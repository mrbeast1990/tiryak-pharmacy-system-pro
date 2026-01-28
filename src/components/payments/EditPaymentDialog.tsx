import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Payment, usePaymentsStore } from '@/store/paymentsStore';
import { Calendar, DollarSign, FileText, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditPaymentDialogProps {
  payment: Payment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditPaymentDialog: React.FC<EditPaymentDialogProps> = ({
  payment,
  open,
  onOpenChange,
}) => {
  const { updatePayment } = usePaymentsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: String(payment.amount),
    payment_date: payment.payment_date,
    payment_type: payment.payment_type,
    notes: payment.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsLoading(true);
    const success = await updatePayment(payment.id, {
      amount: Number(formData.amount),
      payment_date: formData.payment_date,
      payment_type: formData.payment_type as 'cash' | 'bank',
      notes: formData.notes || undefined,
    });
    setIsLoading(false);

    if (success) {
      toast.success('تم تحديث السداد بنجاح');
      onOpenChange(false);
    } else {
      toast.error('حدث خطأ أثناء التحديث');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            تعديل السداد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              المبلغ (د.ل)
            </label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="text-right"
              step="0.01"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              التاريخ
            </label>
            <Input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">نوع السداد</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={formData.payment_type === 'cash' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, payment_type: 'cash' })}
                className="w-full"
              >
                كاش
              </Button>
              <Button
                type="button"
                variant={formData.payment_type === 'bank' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, payment_type: 'bank' })}
                className="w-full"
              >
                مصرف
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              ملاحظات
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="رقم الصك، اسم المستلم..."
              className="text-right resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPaymentDialog;
