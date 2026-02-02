import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, FileText, Loader2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrderBuilderStore, OrderProduct } from '@/store/orderBuilderStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import ColumnMappingDialog, { ColumnMapping } from './ColumnMappingDialog';
import RawTextDialog from './RawTextDialog';

interface FileUploaderProps {
  onFileProcessed: (products: Omit<OrderProduct, 'quantity'>[]) => void;
}

// Keywords for column detection
const NAME_KEYWORDS = ['اسم الصنف', 'الاسم', 'الصنف', 'المنتج', 'trade_name', 'name', 'product', 'البند', 'الدواء'];
const PRICE_KEYWORDS = ['السعر', 'سعر الوحدة', 'unit_price', 'price', 'سعر', 'القيمة'];
const EXPIRY_KEYWORDS = ['الصلاحية', 'تاريخ الصلاحية', 'انتهاء', 'expiry', 'expiry_date', 'exp'];

interface PDFParseResult {
  products: Array<{ name: string; price: number; expiryDate?: string }>;
  rawText?: string;
  totalPages?: number;
  extractedCount?: number;
  confidence?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileProcessed }) => {
  const { setIsLoading, isLoading } = useOrderBuilderStore();
  const [dragActive, setDragActive] = useState(false);
  
  // Column mapping state for Excel fallback
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [excelSampleRows, setExcelSampleRows] = useState<string[][]>([]);
  const [excelAllRows, setExcelAllRows] = useState<any[][]>([]);
  
  // Raw text state for PDF
  const [showRawText, setShowRawText] = useState(false);
  const [rawTextData, setRawTextData] = useState<{
    rawText: string;
    totalPages?: number;
    extractedCount?: number;
    confidence?: string;
  }>({ rawText: '' });
  
  // Store last PDF result for retry with column mapping
  const [lastPDFResult, setLastPDFResult] = useState<PDFParseResult | null>(null);

  const findColumnIndex = (headers: string[], keywords: string[]): number => {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]?.toString().toLowerCase().trim() || '';
      for (const keyword of keywords) {
        if (header.includes(keyword.toLowerCase())) {
          return i;
        }
      }
    }
    return -1;
  };

  const findHeaderRow = (data: any[][]): { headerRowIndex: number; headers: string[] } => {
    // Search for header row in first 10 rows
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      
      const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');
      
      // Check if this row contains name column keyword
      if (NAME_KEYWORDS.some(kw => rowStr.includes(kw.toLowerCase()))) {
        return { headerRowIndex: i, headers: row.map(c => String(c || '')) };
      }
    }
    
    return { headerRowIndex: 0, headers: data[0]?.map(c => String(c || '')) || [] };
  };

  const processExcelWithMapping = (
    allRows: any[][],
    mapping: ColumnMapping
  ): Omit<OrderProduct, 'quantity'>[] => {
    const products: Omit<OrderProduct, 'quantity'>[] = [];
    
    // Skip first row (assumed to be header)
    for (let i = 1; i < allRows.length; i++) {
      const row = allRows[i];
      if (!row || !row[mapping.nameColumn]) continue;

      const name = String(row[mapping.nameColumn]).trim();
      if (!name) continue;

      const price = parseFloat(row[mapping.priceColumn]) || 0;
      const expiryDate = mapping.expiryColumn !== null 
        ? String(row[mapping.expiryColumn] || '') 
        : undefined;

      products.push({
        id: `excel-mapped-${i}`,
        name,
        price,
        expiryDate: expiryDate || undefined,
      });
    }

    return products;
  };

  const processExcelFile = async (file: File): Promise<Omit<OrderProduct, 'quantity'>[] | 'needs-mapping'> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Find header row
          const { headerRowIndex, headers } = findHeaderRow(jsonData);
          
          // Find column indices
          const nameIndex = findColumnIndex(headers, NAME_KEYWORDS);
          const priceIndex = findColumnIndex(headers, PRICE_KEYWORDS);
          const expiryIndex = findColumnIndex(headers, EXPIRY_KEYWORDS);

          // If can't find name column, trigger manual mapping
          if (nameIndex === -1) {
            setExcelColumns(headers);
            setExcelSampleRows(jsonData.slice(headerRowIndex, headerRowIndex + 4).map(row => 
              row.map((cell: any) => String(cell || ''))
            ));
            setExcelAllRows(jsonData.slice(headerRowIndex));
            resolve('needs-mapping');
            return;
          }

          // Extract products from rows after header
          const products: Omit<OrderProduct, 'quantity'>[] = [];
          
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || !row[nameIndex]) continue;

            const name = String(row[nameIndex]).trim();
            if (!name) continue;

            const price = priceIndex >= 0 ? parseFloat(row[priceIndex]) || 0 : 0;
            const expiryDate = expiryIndex >= 0 ? String(row[expiryIndex] || '') : undefined;

            products.push({
              id: `excel-${i}`,
              name,
              price,
              expiryDate: expiryDate || undefined,
            });
          }

          resolve(products);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processPDFFile = async (file: File): Promise<PDFParseResult> => {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Call edge function to parse PDF
    const { data, error } = await supabase.functions.invoke('parse-supplier-quote', {
      body: { 
        fileBase64: base64,
        fileName: file.name,
      },
    });

    if (error) {
      throw new Error(error.message || 'فشل في معالجة ملف PDF');
    }

    return {
      products: data?.products || [],
      rawText: data?.rawText || '',
      totalPages: data?.totalPages,
      extractedCount: data?.extractedCount,
      confidence: data?.confidence,
    };
  };

  const handleFile = useCallback(async (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (!['pdf', 'xlsx', 'xls', 'csv'].includes(fileExt || '')) {
      toast.error('يرجى رفع ملف PDF أو Excel');
      return;
    }

    setIsLoading(true);
    
    try {
      if (fileExt === 'pdf') {
        const result = await processPDFFile(file);
        setLastPDFResult(result);
        
        // Store raw text for viewing
        setRawTextData({
          rawText: result.rawText || '',
          totalPages: result.totalPages,
          extractedCount: result.extractedCount,
          confidence: result.confidence,
        });

        if (!result.products || result.products.length === 0) {
          toast.error('لم يتم العثور على منتجات. يمكنك مشاهدة النص الخام للتحقق.');
          setShowRawText(true);
          return;
        }

        const products = result.products.map((p, index) => ({
          id: `pdf-${index}`,
          name: p.name || '',
          price: parseFloat(String(p.price)) || 0,
          expiryDate: p.expiryDate || undefined,
        }));

        toast.success(`تم استخراج ${products.length} صنف من ${result.totalPages || 1} صفحة`);
        onFileProcessed(products);
      } else {
        const result = await processExcelFile(file);
        
        if (result === 'needs-mapping') {
          setShowColumnMapping(true);
          return;
        }

        if (result.length === 0) {
          toast.error('لم يتم العثور على منتجات في الملف');
          return;
        }

        toast.success(`تم استخراج ${result.length} صنف`);
        onFileProcessed(result);
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في معالجة الملف');
    } finally {
      setIsLoading(false);
    }
  }, [onFileProcessed, setIsLoading]);

  const handleColumnMappingConfirm = (mapping: ColumnMapping) => {
    setShowColumnMapping(false);
    
    const products = processExcelWithMapping(excelAllRows, mapping);
    
    if (products.length === 0) {
      toast.error('لم يتم العثور على منتجات بناءً على التحديد');
      return;
    }

    toast.success(`تم استخراج ${products.length} صنف`);
    onFileProcessed(products);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <>
      <Card className={`transition-all ${dragActive ? 'ring-2 ring-primary border-primary' : ''}`}>
        <CardContent className="p-4">
          <label
            className="block cursor-pointer"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleFileInput}
              className="hidden"
              disabled={isLoading}
            />
            
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              {isLoading ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-medium text-foreground">جاري معالجة الملف...</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-2">
                    اضغط لرفع ملف أو اسحبه هنا
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      PDF
                    </span>
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel
                    </span>
                  </div>
                </>
              )}
            </div>
          </label>

          {/* Show Raw Text Button for PDF */}
          {rawTextData.rawText && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setShowRawText(true)}
            >
              <Eye className="h-4 w-4 ml-2" />
              عرض النص الخام
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Column Mapping Dialog for Excel */}
      <ColumnMappingDialog
        open={showColumnMapping}
        onOpenChange={setShowColumnMapping}
        columns={excelColumns}
        sampleRows={excelSampleRows}
        onConfirm={handleColumnMappingConfirm}
      />

      {/* Raw Text Dialog for PDF */}
      <RawTextDialog
        open={showRawText}
        onOpenChange={setShowRawText}
        rawText={rawTextData.rawText}
        totalPages={rawTextData.totalPages}
        extractedCount={rawTextData.extractedCount}
        confidence={rawTextData.confidence}
      />
    </>
  );
};

export default FileUploader;
