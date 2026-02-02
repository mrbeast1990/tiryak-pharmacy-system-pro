import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertCircle, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ColumnMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: string[];
  sampleRows: string[][];
  onConfirm: (mapping: ColumnMapping) => void;
}

export interface ColumnMapping {
  nameColumn: number;
  priceColumn: number;
  expiryColumn: number | null;
}

const ColumnMappingDialog: React.FC<ColumnMappingDialogProps> = ({
  open,
  onOpenChange,
  columns,
  sampleRows,
  onConfirm,
}) => {
  const [nameColumn, setNameColumn] = useState<string>('');
  const [priceColumn, setPriceColumn] = useState<string>('');
  const [expiryColumn, setExpiryColumn] = useState<string>('none');

  const handleConfirm = () => {
    if (!nameColumn || !priceColumn) return;
    
    onConfirm({
      nameColumn: parseInt(nameColumn),
      priceColumn: parseInt(priceColumn),
      expiryColumn: expiryColumn === 'none' ? null : parseInt(expiryColumn),
    });
  };

  const isValid = nameColumn !== '' && priceColumn !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5 text-primary" />
            تحديد الأعمدة يدوياً
          </DialogTitle>
          <DialogDescription>
            لم يتمكن النظام من التعرف على الأعمدة تلقائياً. يرجى تحديد الأعمدة يدوياً.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="bg-warning/10 border-warning/50">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            حدد العمود المناسب لكل حقل من الحقول أدناه
          </AlertDescription>
        </Alert>

        {/* Sample Data Preview */}
        {sampleRows.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-3 py-2 text-sm font-medium text-foreground">
              عينة من البيانات:
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {columns.map((col, i) => (
                      <th key={i} className="px-3 py-2 text-right font-medium text-foreground">
                        عمود {i + 1}: {col || '(فارغ)'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-t">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-foreground">
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Column Mapping Selects */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name-column" className="text-foreground">
              عمود اسم الصنف <span className="text-destructive">*</span>
            </Label>
            <Select value={nameColumn} onValueChange={setNameColumn}>
              <SelectTrigger id="name-column">
                <SelectValue placeholder="اختر عمود اسم الصنف" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    عمود {i + 1}: {col || '(فارغ)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price-column" className="text-foreground">
              عمود السعر <span className="text-destructive">*</span>
            </Label>
            <Select value={priceColumn} onValueChange={setPriceColumn}>
              <SelectTrigger id="price-column">
                <SelectValue placeholder="اختر عمود السعر" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    عمود {i + 1}: {col || '(فارغ)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-column" className="text-foreground">
              عمود تاريخ الصلاحية (اختياري)
            </Label>
            <Select value={expiryColumn} onValueChange={setExpiryColumn}>
              <SelectTrigger id="expiry-column">
                <SelectValue placeholder="اختر عمود الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون صلاحية</SelectItem>
                {columns.map((col, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    عمود {i + 1}: {col || '(فارغ)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            تأكيد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnMappingDialog;
