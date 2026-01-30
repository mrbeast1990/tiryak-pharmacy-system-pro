import React, { useState } from 'react';
import { useExpensesStore } from '@/store/expensesStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ExpenseForm: React.FC = () => {
  const { addExpense } = useExpensesStore();
  const { user } = useAuthStore();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description || !user) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    
    const success = await addExpense({
      amount: parseFloat(amount),
      description: description.trim(),
      expense_date: format(expenseDate, 'yyyy-MM-dd'),
      is_deducted: false,
      created_by_id: user.id,
      created_by_name: user.name || 'مستخدم',
    });

    if (success) {
      toast.success('تم إضافة المصروف بنجاح');
      setAmount('');
      setDescription('');
      setExpenseDate(new Date());
    } else {
      toast.error('حدث خطأ أثناء إضافة المصروف');
    }

    setIsSubmitting(false);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-rose-600" />
          إضافة مصروف جديد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">القيمة (د.ل)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold text-center"
              dir="ltr"
              min="0"
              step="0.01"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">البيان</label>
            <Input
              type="text"
              placeholder="مثال: إيجار، كهرباء، صيانة..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-right"
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">التاريخ</label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal",
                    !expenseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {expenseDate ? format(expenseDate, 'PPP', { locale: ar }) : 'اختر التاريخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expenseDate}
                  onSelect={(date) => {
                    if (date) {
                      setExpenseDate(date);
                      setIsCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4 ml-2" />
            {isSubmitting ? 'جاري الإضافة...' : 'إضافة المصروف'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;
