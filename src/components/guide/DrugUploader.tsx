import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ParsedDrug {
  trade_name: string;
  scientific_name?: string | null;
  concentration?: string | null;
  origin?: string | null;
  pharmacist_notes?: string | null;
  keywords?: string[];
  price?: number | null;
  quantity?: number | null;
  expiry_date?: string | null;
  barcode?: string | null;
}

// تحويل تنسيقات التاريخ المختلفة
const parseExpiryDate = (value: any): string | null => {
  if (!value) return null;
  
  // إذا كان رقم (تنسيق Excel serial date)
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date.toISOString().split('T')[0];
  }
  
  // إذا كان نص
  const strValue = String(value).trim();
  if (!strValue) return null;
  
  // محاولة تحويل التنسيقات المختلفة
  const formats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY or MM/DD/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = strValue.match(format);
    if (match) {
      try {
        const date = new Date(strValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        continue;
      }
    }
  }
  
  return null;
};

const DrugUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedDrug[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    
    if (!validTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.xlsx') && 
        !selectedFile.name.endsWith('.xls') && 
        !selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'نوع ملف غير مدعوم',
        description: 'يرجى اختيار ملف Excel (.xlsx, .xls) أو CSV',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Map columns to our schema - دعم ملف الترياق الجديد
      const parsed: ParsedDrug[] = jsonData.map((row: any) => ({
        // الاسم التجاري - دعم أعمدة متعددة
        trade_name: row['اسم الصنف'] || row['الاسم التجاري'] || row['trade_name'] || row['Trade Name'] || '',
        
        // الاسم العلمي - اختياري الآن (الـ AI سيستنتجه)
        scientific_name: row['الاسم العلمي'] || row['scientific_name'] || row['Scientific Name'] || null,
        
        // التركيز
        concentration: row['التركيز'] || row['concentration'] || row['Concentration'] || null,
        
        // المنشأ
        origin: row['المنشأ'] || row['origin'] || row['Origin'] || null,
        
        // ملاحظات الصيدلي
        pharmacist_notes: row['ملاحظات الصيدلي'] || row['pharmacist_notes'] || row['Notes'] || null,
        
        // الكلمات المفتاحية
        keywords: (row['الكلمات المفتاحية'] || row['keywords'] || row['Keywords'] || '')
          .toString()
          .split(',')
          .map((k: string) => k.trim())
          .filter((k: string) => k.length > 0),
        
        // السعر - من ملف الترياق
        price: row['السعر'] ? parseFloat(String(row['السعر']).replace(/[^\d.]/g, '')) : null,
        
        // الكمية - من ملف الترياق
        quantity: row['الكمية'] ? parseInt(String(row['الكمية']).replace(/[^\d]/g, '')) : null,
        
        // تاريخ الصلاحية - من ملف الترياق
        expiry_date: parseExpiryDate(row['الصلاحيه'] || row['الصلاحية'] || row['expiry_date']),
        
        // الرقم التجاري/الباركود - من ملف الترياق
        barcode: row['الرقم التجاري'] || row['barcode'] || row['Barcode'] || null,
      })).filter((item: ParsedDrug) => item.trade_name); // فقط الأصناف التي لها اسم

      if (parsed.length === 0) {
        toast({
          title: 'لا توجد بيانات صالحة',
          description: 'تأكد من أن الملف يحتوي على عمود "اسم الصنف" أو "الاسم التجاري"',
          variant: 'destructive',
        });
        setFile(null);
        setParsedData([]);
      } else {
        setParsedData(parsed);
        toast({
          title: 'تم قراءة الملف بنجاح',
          description: `تم العثور على ${parsed.length} صنف`,
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'خطأ في قراءة الملف',
        description: 'تأكد من أن الملف بصيغة صحيحة',
        variant: 'destructive',
      });
      setFile(null);
      setParsedData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

    setUploading(true);

    try {
      // If replace mode, delete all existing data first
      if (replaceExisting) {
        const { error: deleteError } = await supabase
          .from('pharmacy_guide')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (deleteError) {
          throw deleteError;
        }
      }

      // Insert new data in batches
      const batchSize = 100;
      let successCount = 0;

      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize);
        const { error } = await supabase
          .from('pharmacy_guide')
          .insert(batch);

        if (error) {
          console.error('Batch insert error:', error);
          throw error;
        }
        successCount += batch.length;
      }

      toast({
        title: 'تم رفع البيانات بنجاح',
        description: `تم إضافة ${successCount} صنف إلى دليل الصيدلية`,
      });

      // Reset state
      setFile(null);
      setParsedData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'خطأ في رفع البيانات',
        description: 'حدث خطأ أثناء رفع البيانات، يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // تحقق من وجود أعمدة معينة في البيانات
  const hasPrice = parsedData.some(d => d.price != null);
  const hasQuantity = parsedData.some(d => d.quantity != null);
  const hasExpiry = parsedData.some(d => d.expiry_date != null);

  return (
    <div className="space-y-4">
      {/* Upload Card */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-sm border-purple-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
            <Upload className="w-5 h-5" />
            تحديث بيانات الأدوية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              file ? 'border-green-300 bg-green-50' : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {loading ? (
              <Loader2 className="w-10 h-10 mx-auto mb-3 text-purple-500 animate-spin" />
            ) : file ? (
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
            ) : (
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-purple-400" />
            )}
            
            <p className="font-medium text-foreground mb-1">
              {file ? file.name : 'اضغط لاختيار ملف'}
            </p>
            <p className="text-sm text-muted-foreground">
              {file
                ? `${parsedData.length} صنف جاهز للرفع`
                : 'Excel (.xlsx, .xls) أو CSV'}
            </p>
          </div>

          {/* Options */}
          {parsedData.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Switch
                  id="replace-mode"
                  checked={replaceExisting}
                  onCheckedChange={setReplaceExisting}
                />
                <Label htmlFor="replace-mode" className="text-sm">
                  استبدال البيانات الحالية
                </Label>
              </div>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
          )}

          {/* Action Buttons */}
          {parsedData.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    رفع {parsedData.length} صنف
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card className="bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="py-3 bg-purple-50 border-b">
            <CardTitle className="text-sm font-medium text-purple-700">
              معاينة البيانات ({parsedData.length} صنف)
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الصنف</TableHead>
                  {hasPrice && <TableHead className="text-right">السعر</TableHead>}
                  {hasQuantity && <TableHead className="text-right">الكمية</TableHead>}
                  {hasExpiry && <TableHead className="text-right">الصلاحية</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.slice(0, 100).map((drug, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{drug.trade_name}</TableCell>
                    {hasPrice && (
                      <TableCell>{drug.price ? `${drug.price} د.ل` : '-'}</TableCell>
                    )}
                    {hasQuantity && (
                      <TableCell>{drug.quantity ?? '-'}</TableCell>
                    )}
                    {hasExpiry && (
                      <TableCell>{drug.expiry_date || '-'}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {parsedData.length > 100 && (
              <p className="text-center text-sm text-muted-foreground py-3">
                يتم عرض أول 100 صنف من أصل {parsedData.length}
              </p>
            )}
          </ScrollArea>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50/80 border-blue-100">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-2">تنسيق الملف المطلوب:</p>
              <p className="text-blue-600 mb-2">
                يدعم ملفات الإكسيل بالأعمدة التالية:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-600">
                <li><strong>اسم الصنف / الاسم التجاري</strong> (مطلوب)</li>
                <li>السعر (اختياري)</li>
                <li>الكمية (اختياري)</li>
                <li>الصلاحية (اختياري)</li>
                <li>الرقم التجاري / الباركود (اختياري)</li>
                <li>الاسم العلمي (اختياري - الـ AI يستنتجه)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DrugUploader;