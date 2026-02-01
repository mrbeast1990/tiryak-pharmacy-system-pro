import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useOrderBuilderStore, OrderProduct } from '@/store/orderBuilderStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onFileProcessed: (products: Omit<OrderProduct, 'quantity'>[]) => void;
}

// Keywords for column detection
const NAME_KEYWORDS = ['اسم الصنف', 'الاسم', 'الصنف', 'المنتج', 'trade_name', 'name', 'product'];
const PRICE_KEYWORDS = ['السعر', 'سعر الوحدة', 'unit_price', 'price', 'سعر'];
const EXPIRY_KEYWORDS = ['الصلاحية', 'تاريخ الصلاحية', 'انتهاء', 'expiry', 'expiry_date', 'exp'];

const FileUploader: React.FC<FileUploaderProps> = ({ onFileProcessed }) => {
  const { setIsLoading, isLoading } = useOrderBuilderStore();
  const [dragActive, setDragActive] = useState(false);

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

  const processExcelFile = async (file: File): Promise<Omit<OrderProduct, 'quantity'>[]> => {
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

          if (nameIndex === -1) {
            throw new Error('لم يتم العثور على عمود اسم الصنف');
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

  const processPDFFile = async (file: File): Promise<Omit<OrderProduct, 'quantity'>[]> => {
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

    if (!data?.products || !Array.isArray(data.products)) {
      throw new Error('لم يتم استخراج أي منتجات من الملف');
    }

    return data.products.map((p: any, index: number) => ({
      id: `pdf-${index}`,
      name: p.name || '',
      price: parseFloat(p.price) || 0,
      expiryDate: p.expiryDate || undefined,
    }));
  };

  const handleFile = useCallback(async (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (!['pdf', 'xlsx', 'xls', 'csv'].includes(fileExt || '')) {
      toast.error('يرجى رفع ملف PDF أو Excel');
      return;
    }

    setIsLoading(true);
    
    try {
      let products: Omit<OrderProduct, 'quantity'>[];
      
      if (fileExt === 'pdf') {
        products = await processPDFFile(file);
      } else {
        products = await processExcelFile(file);
      }

      if (products.length === 0) {
        toast.error('لم يتم العثور على منتجات في الملف');
        return;
      }

      toast.success(`تم استخراج ${products.length} صنف`);
      onFileProcessed(products);
    } catch (error) {
      console.error('File processing error:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في معالجة الملف');
    } finally {
      setIsLoading(false);
    }
  }, [onFileProcessed, setIsLoading]);

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
      </CardContent>
    </Card>
  );
};

export default FileUploader;
