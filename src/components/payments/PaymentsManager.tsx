import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, CreditCard, Receipt, Building2, ChevronLeft } from 'lucide-react';
import { usePaymentsStore, Company } from '@/store/paymentsStore';
import PaymentsSummary from './PaymentsSummary';
import PaymentForm from './PaymentForm';
import PaymentsFilters from './PaymentsFilters';
import PaymentsList from './PaymentsList';
import PaymentExporter from './PaymentExporter';
import CompanyDetailsView from './CompanyDetailsView';
import CompaniesListView from './CompaniesListView';
import ExpensesManager from '../expenses/ExpensesManager';
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
  const { fetchPayments, fetchCompanies, companies } = usePaymentsStore();
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('payments');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [viewingCompanies, setViewingCompanies] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchCompanies();
  }, [fetchPayments, fetchCompanies]);

  // If viewing companies list
  if (viewingCompanies && !selectedCompany) {
    return (
      <CompaniesListView
        onBack={() => setViewingCompanies(false)}
        onSelectCompany={(c) => setSelectedCompany(c)}
      />
    );
  }

  // If viewing a company detail
  if (selectedCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100" dir="rtl">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm safe-area-top">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(null)} className="text-muted-foreground hover:text-foreground -mr-2">
                <ArrowRight className="w-5 h-5 ml-1" />
                العودة
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">{selectedCompany.name}</h1>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 pt-4 pb-20">
          <CompanyDetailsView
            company={selectedCompany}
            onBack={() => setSelectedCompany(null)}
            onViewAttachment={setViewingAttachment}
          />
        </div>
        {/* Attachment Viewer */}
        <Dialog open={!!viewingAttachment} onOpenChange={() => setViewingAttachment(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>عرض المرفق</DialogTitle></DialogHeader>
            {viewingAttachment && (
              <div className="mt-4">
                <img src={viewingAttachment} alt="مرفق السداد" className="w-full h-auto rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                <Button variant="outline" className="w-full mt-4" onClick={() => window.open(viewingAttachment, '_blank')}>فتح في نافذة جديدة</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground -mr-2">
              <ArrowRight className="w-5 h-5 ml-1" />
              العودة
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">
                {activeTab === 'payments' ? 'سداد الشركات' : 'المصاريف'}
              </h1>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeTab === 'payments' 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                  : 'bg-gradient-to-br from-rose-500 to-pink-600'
              }`}>
                {activeTab === 'payments' 
                  ? <CreditCard className="w-4 h-4 text-white" />
                  : <Receipt className="w-4 h-4 text-white" />
                }
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <CreditCard className="w-4 h-4" />
              سداد الشركات
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2 data-[state=active]:bg-rose-500 data-[state=active]:text-white">
              <Receipt className="w-4 h-4" />
              المصاريف
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4 pb-20 mt-0">
            <PaymentsSummary />
            
            {/* Companies Card */}
            <Card
              className="p-4 bg-white hover:bg-blue-50/50 cursor-pointer transition-colors border border-border/50 active:scale-[0.99]"
              onClick={() => setViewingCompanies(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">الشركات</p>
                    <p className="text-xs text-muted-foreground">{companies.length} شركة مسجلة</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>

            <PaymentForm />
            <PaymentsFilters />
            <PaymentsList onViewAttachment={setViewingAttachment} />
            <PaymentExporter />
          </TabsContent>

          <TabsContent value="expenses" className="pb-20 mt-0">
            <ExpensesManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Attachment Viewer Dialog */}
      <Dialog open={!!viewingAttachment} onOpenChange={() => setViewingAttachment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>عرض المرفق</DialogTitle></DialogHeader>
          {viewingAttachment && (
            <div className="mt-4">
              <img src={viewingAttachment} alt="مرفق السداد" className="w-full h-auto rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              <Button variant="outline" className="w-full mt-4" onClick={() => window.open(viewingAttachment, '_blank')}>فتح في نافذة جديدة</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsManager;
