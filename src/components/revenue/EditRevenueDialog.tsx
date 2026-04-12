
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Revenue } from '@/store/pharmacyStore';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';

interface EditRevenueDialogProps {
  revenue: Revenue | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Omit<Revenue, 'id' | 'created_at' | 'createdBy' | 'date'>>) => void;
}

const EditRevenueDialog: React.FC<EditRevenueDialogProps> = ({ revenue, isOpen, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const { language } = useLanguageStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (revenue) {
      setAmount(String(revenue.amount));
      // Strip previous edit notes for clean editing
      const cleanNotes = (revenue.notes || '')
        .replace(/\s*\[تم التعديل بواسطة .+?\]/g, '')
        .trim();
      setNotes(cleanNotes);
    }
  }, [revenue]);

  const handleSave = () => {
    if (!revenue) return;
    
    const editorName = user?.name || 'مدير';
    const editTag = `[تم التعديل بواسطة ${editorName}]`;
    const finalNotes = notes ? `${notes} ${editTag}` : editTag;
    
    // Only update amount and notes - preserve period and creator
    onSave(revenue.id, {
      amount: Number(amount),
      notes: finalNotes,
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
            <Label htmlFor="notes" className="text-right">ملاحظات</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
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
