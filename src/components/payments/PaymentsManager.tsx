import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard } from 'lucide-react';
import { usePaymentsStore } from '@/store/paymentsStore';
import PaymentsSummary from './PaymentsSummary';
import PaymentForm from './PaymentForm';
import PaymentsFilters from './PaymentsFilters';
import PaymentsList from './PaymentsList';
import PaymentExporter from './PaymentExporter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentsManagerProps {
  onBack: () => void;
}

const PaymentsManager: React.FC<PaymentsManagerProps> = ({ onBack }) => {
  const { fetchPayments, fetchCompanies, loading } = usePaymentsStore();
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchCompanies();
  }, [fetchPayments, fetchCompanies]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground -mr-2"
            >
              <ArrowRight className="w-5 h-5 ml-1" />
              العودة
            </Button>
            
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">إدارة السدادات</h1>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-20">
        {/* Summary Cards */}
        <PaymentsSummary />

        {/* Payment Form */}
        <PaymentForm />

        {/* Filters */}
        <PaymentsFilters />

        {/* Payments List */}
        <PaymentsList onViewAttachment={setViewingAttachment} />

        {/* Exporter */}
        <PaymentExporter />
      </main>

      {/* Attachment Viewer Dialog */}
      <Dialog open={!!viewingAttachment} onOpenChange={() => setViewingAttachment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>عرض المرفق</DialogTitle>
          </DialogHeader>
          {viewingAttachment && (
            <div className="mt-4">
              <img
                src={viewingAttachment}
                alt="مرفق السداد"
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => window.open(viewingAttachment, '_blank')}
              >
                فتح في نافذة جديدة
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsManager;
