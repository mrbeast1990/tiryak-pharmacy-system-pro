import React, { useState, useEffect } from 'react';
import { usePaymentsStore } from '@/store/paymentsStore';
import PaymentCard from './PaymentCard';
import { Wallet, SearchX, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 50;

interface PaymentsListProps {
  onViewAttachment?: (url: string) => void;
}

const PaymentsList: React.FC<PaymentsListProps> = ({ onViewAttachment }) => {
  const { getFilteredPayments, loading, filters } = usePaymentsStore();
  const [currentPage, setCurrentPage] = useState(1);

  const payments = getFilteredPayments();
  const totalPages = Math.ceil(payments.length / PAGE_SIZE);
  const paginatedPayments = payments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.company, filters.showUndeductedOnly, filters.dateFilter, filters.selectedMonth, filters.selectedYear]);

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
        {totalPages > 1 && (
          <span className="text-xs">- صفحة {currentPage} من {totalPages}</span>
        )}
      </div>
      
      <div className="space-y-2">
        {paginatedPayments.map((payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            onViewAttachment={onViewAttachment}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="h-8 text-xs"
          >
            <ChevronRight className="w-4 h-4 ml-1" />
            السابق
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="h-8 w-8 text-xs p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="h-8 text-xs"
          >
            التالي
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentsList;
