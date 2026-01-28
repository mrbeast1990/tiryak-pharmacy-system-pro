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
import { Company, usePaymentsStore } from '@/store/paymentsStore';
import { Building2, User, Phone, CreditCard, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditCompanyDialogProps {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditCompanyDialog: React.FC<EditCompanyDialogProps> = ({
  company,
  open,
  onOpenChange,
}) => {
  const { updateCompany } = usePaymentsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company.name,
    representative_name: company.representative_name || '',
    phone: company.phone || '',
    account_number: company.account_number || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم الشركة');
      return;
    }

    setIsLoading(true);
    const success = await updateCompany(company.id, {
      name: formData.name.trim(),
      representative_name: formData.representative_name.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      account_number: formData.account_number.trim() || undefined,
    });
    setIsLoading(false);

    if (success) {
      toast.success('تم تحديث بيانات الشركة بنجاح');
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
            تعديل بيانات الشركة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              اسم الشركة
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="اسم الشركة..."
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              اسم المندوب
            </label>
            <Input
              value={formData.representative_name}
              onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
              placeholder="اسم المندوب..."
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              رقم الهاتف
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="رقم الهاتف..."
              className="text-right"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              رقم الحساب
            </label>
            <Input
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              placeholder="رقم الحساب البنكي..."
              className="text-right"
              dir="ltr"
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

export default EditCompanyDialog;
