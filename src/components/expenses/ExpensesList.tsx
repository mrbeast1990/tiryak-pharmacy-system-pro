import React from 'react';
import { useExpensesStore } from '@/store/expensesStore';
import ExpenseCard from './ExpenseCard';
import { Receipt, SearchX } from 'lucide-react';

const ExpensesList: React.FC = () => {
  const { getFilteredExpenses, loading } = useExpensesStore();
  
  const expenses = getFilteredExpenses();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">جاري تحميل المصاريف...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-white/50 rounded-xl border border-dashed border-border">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <SearchX className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium">لا توجد مصاريف</p>
        <p className="text-xs text-muted-foreground mt-1">قم بإضافة مصروف جديد للبدء</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Receipt className="w-4 h-4" />
        <span>المصاريف ({expenses.length})</span>
      </div>
      
      <div className="space-y-2">
        {expenses.map((expense) => (
          <ExpenseCard key={expense.id} expense={expense} />
        ))}
      </div>
    </div>
  );
};

export default ExpensesList;
