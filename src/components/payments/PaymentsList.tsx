import React from 'react';
import { usePaymentsStore } from '@/store/paymentsStore';
import PaymentCard from './PaymentCard';
import { Wallet, SearchX } from 'lucide-react';

interface PaymentsListProps {
  onViewAttachment?: (url: string) => void;
}

const PaymentsList: React.FC<PaymentsListProps> = ({ onViewAttachment }) => {
  const { getFilteredPayments, loading } = usePaymentsStore();
  
  const payments = getFilteredPayments();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">جاري تحميل السدادات...</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-white/50 rounded-xl border border-dashed border-border">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <SearchX className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium">لا توجد سدادات</p>
        <p className="text-xs text-muted-foreground mt-1">قم بإضافة سداد جديد للبدء</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wallet className="w-4 h-4" />
        <span>السدادات ({payments.length})</span>
      </div>
      
      <div className="space-y-2">
        {payments.map((payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            onViewAttachment={onViewAttachment}
          />
        ))}
      </div>
    </div>
  );
};

export default PaymentsList;
