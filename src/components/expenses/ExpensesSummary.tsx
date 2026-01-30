import React from 'react';
import { useExpensesStore } from '@/store/expensesStore';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt, AlertCircle } from 'lucide-react';

const ExpensesSummary: React.FC = () => {
  const { getTotalAmount, getUndeductedTotal, getUndeductedCount } = useExpensesStore();
  
  const total = getTotalAmount();
  const undeductedTotal = getUndeductedTotal();
  const undeductedCount = getUndeductedCount();

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 opacity-80" />
            <span className="text-xs opacity-80">إجمالي المصاريف</span>
          </div>
          <div className="text-xl font-bold">{total.toLocaleString('ar-LY')}</div>
          <div className="text-xs opacity-70">د.ل</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 opacity-80" />
            <span className="text-xs opacity-80">غير مخصومة</span>
          </div>
          <div className="text-xl font-bold">{undeductedTotal.toLocaleString('ar-LY')}</div>
          <div className="text-xs opacity-70">{undeductedCount} مصروف</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesSummary;
