import React from 'react';
import { Card } from '@/components/ui/card';
import { Wallet, AlertCircle } from 'lucide-react';
import { usePaymentsStore } from '@/store/paymentsStore';

const PaymentsSummary: React.FC = () => {
  const { getTotalAmount, getUndeductedTotal, getUndeductedCount } = usePaymentsStore();

  const totalAmount = getTotalAmount();
  const undeductedTotal = getUndeductedTotal();
  const undeductedCount = getUndeductedCount();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* إجمالي السدادات */}
      <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 overflow-hidden">
        <div className="p-3 relative">
          <div className="absolute top-2 left-2 opacity-20">
            <Wallet className="w-12 h-12" />
          </div>
          <div className="relative z-10">
            <Wallet className="w-5 h-5 mb-1" />
            <p className="text-xs opacity-90">إجمالي السدادات</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
            <p className="text-xs opacity-80">د.ل</p>
          </div>
        </div>
      </Card>

      {/* المبالغ غير المخصومة */}
      <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 overflow-hidden">
        <div className="p-3 relative">
          <div className="absolute top-2 left-2 opacity-20">
            <AlertCircle className="w-12 h-12" />
          </div>
          <div className="relative z-10">
            <AlertCircle className="w-5 h-5 mb-1" />
            <p className="text-xs opacity-90">لم تُخصم بعد</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(undeductedTotal)}</p>
            <p className="text-xs opacity-80">
              د.ل ({undeductedCount} سداد)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentsSummary;
