import React, { useState } from 'react';
import { useExpensesStore } from '@/store/expensesStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Banknote,
  Calendar,
  FileText,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ExpenseForm: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { addExpense } = useExpensesStore();
  const { user } = useAuthStore();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || Number(amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (!description.trim()) {
      toast.error('يرجى إدخال البيان');
      return;
    }

    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsSubmitting(true);
    
    const success = await addExpense({
      amount: parseFloat(amount),
      description: description.trim(),
      expense_date: expenseDate,
      notes: notes.trim() || null,
      is_deducted: false,
      created_by_id: user.id,
      created_by_name: user.name || 'مستخدم',
    });

    setIsSubmitting(false);

    if (success) {
      toast.success('تم إضافة المصروف بنجاح');
      resetForm();
      setIsOpen(false);
    } else {
      toast.error('حدث خطأ أثناء إضافة المصروف');
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden border-rose-500/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-rose-600" />
                </div>
                إضافة مصروف جديد
              </span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* المبلغ */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-muted-foreground" />
                  القيمة (د.ل)
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="text-lg font-semibold"
                  dir="ltr"
                />
              </div>

              {/* البيان */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  البيان
                </label>
                <Input
                  type="text"
                  placeholder="مثال: إيجار، كهرباء، صيانة..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-right"
                />
              </div>

              {/* التاريخ */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  التاريخ
                </label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="text-right"
                />
              </div>

              {/* الملاحظات */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  ملاحظات (اختياري)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي تفاصيل إضافية..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* زر الإضافة */}
              <Button
                type="submit"
                className="w-full h-12 text-base bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                disabled={isSubmitting || !description.trim() || !amount}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة المصروف
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default ExpenseForm;
