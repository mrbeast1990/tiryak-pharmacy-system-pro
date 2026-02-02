import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Trash2 } from 'lucide-react';
import { OrderProduct } from '@/store/orderBuilderStore';

interface DataReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Omit<OrderProduct, 'quantity'>[];
  onConfirm: (products: Omit<OrderProduct, 'quantity'>[]) => void;
}

const DataReviewDialog: React.FC<DataReviewDialogProps> = ({
  open,
  onOpenChange,
  products,
  onConfirm,
}) => {
  const [editableProducts, setEditableProducts] = useState<Omit<OrderProduct, 'quantity'>[]>([]);

  useEffect(() => {
    setEditableProducts([...products]);
  }, [products]);

  const handleNameChange = (index: number, value: string) => {
    const updated = [...editableProducts];
    updated[index] = { ...updated[index], name: value };
    setEditableProducts(updated);
  };

  const handlePriceChange = (index: number, value: string) => {
    const updated = [...editableProducts];
    updated[index] = { ...updated[index], price: parseFloat(value) || 0 };
    setEditableProducts(updated);
  };

  const handleExpiryChange = (index: number, value: string) => {
    const updated = [...editableProducts];
    updated[index] = { ...updated[index], expiryDate: value || undefined };
    setEditableProducts(updated);
  };

  const handleCodeChange = (index: number, value: string) => {
    const updated = [...editableProducts];
    updated[index] = { ...updated[index], code: value || undefined };
    setEditableProducts(updated);
  };

  const handleDelete = (index: number) => {
    const updated = editableProducts.filter((_, i) => i !== index);
    setEditableProducts(updated);
  };

  const handleConfirm = () => {
    // Filter out products with empty names
    const validProducts = editableProducts.filter(p => p.name.trim());
    onConfirm(validProducts);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">مراجعة البيانات المستخرجة</DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-muted-foreground mb-2">
          تم استخراج {editableProducts.length} صنف. يمكنك التعديل قبل الموافقة.
        </p>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {editableProducts.map((product, index) => (
              <div
                key={product.id}
                className="bg-muted/50 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{index + 1}</span>
                  <Input
                    value={product.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder="اسم الصنف"
                    className="flex-1 text-right"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2 mr-8">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">الكود</label>
                    <Input
                      value={product.code || ''}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      placeholder="CODE"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">السعر</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={product.price || ''}
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                      placeholder="0.00"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">الصلاحية</label>
                    <Input
                      value={product.expiryDate || ''}
                      onChange={(e) => handleExpiryChange(index, e.target.value)}
                      placeholder="EXP"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            <X className="h-4 w-4 ml-2" />
            إلغاء
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={editableProducts.length === 0}
          >
            <Check className="h-4 w-4 ml-2" />
            موافقة ({editableProducts.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DataReviewDialog;
