
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Revenue } from '@/store/pharmacyStore';
import { useLanguageStore } from '@/store/languageStore';

interface EditRevenueDialogProps {
  revenue: Revenue | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Omit<Revenue, 'id' | 'created_at' | 'createdBy' | 'date'>>) => void;
}

const EditRevenueDialog: React.FC<EditRevenueDialogProps> = ({ revenue, isOpen, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [period, setPeriod] = useState<'morning' | 'evening' | 'night' | 'ahmad_rajili' | 'abdulwahab'>('morning');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const { language } = useLanguageStore();

  useEffect(() => {
    if (revenue) {
      setAmount(String(revenue.amount));
      setNotes(revenue.notes || '');
      setPeriod(revenue.period as any);
      setType(revenue.type as any);
    }
  }, [revenue]);

  const handleSave = () => {
    if (!revenue) return;
    const cleanedNotes = notes.replace('- Income', '').replace('- Cash Disbursement', '').trim();
    const typeText = type === 'income' ? 'Income' : 'Cash Disbursement';
    const newNotes = cleanedNotes + (cleanedNotes ? ' - ' : '') + typeText;
    
    onSave(revenue.id, {
      amount: Number(amount),
      notes: newNotes,
      period,
      type
    });
    onClose();
  };

  if (!revenue) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>تعديل العملية</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">المبلغ</Label>
            <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" type="number" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">النوع</Label>
            <Select value={type} onValueChange={(value) => setType(value as any)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">إيراد</SelectItem>
                <SelectItem value="expense">صرف</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="period" className="text-right">الفترة</Label>
            <Select value={period} onValueChange={(value) => setPeriod(value as any)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">صباحية</SelectItem>
                <SelectItem value="evening">مسائية</SelectItem>
                <SelectItem value="night">ليلية</SelectItem>
                <SelectItem value="ahmad_rajili">احمد الرجيلي</SelectItem>
                <SelectItem value="abdulwahab">عبدالوهاب</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">ملاحظات</Label>
            <Input id="notes" value={notes.replace('- Income', '').replace('- Cash Disbursement', '').trim()} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={onClose} variant="outline">إلغاء</Button>
          </DialogClose>
          <Button onClick={handleSave}>حفظ التغييرات</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRevenueDialog;
