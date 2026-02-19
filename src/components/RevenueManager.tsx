
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Wallet, BarChart3 } from 'lucide-react';

import { useRevenueManager } from '@/hooks/useRevenueManager';

import DailyRevenueDetails from './revenue/DailyRevenueDetails';
import PeriodRevenueDetails from './revenue/PeriodRevenueDetails';
import RevenueForm from './revenue/RevenueForm';
import RevenueDisplay from './revenue/RevenueDisplay';
import AdminRevenueDisplay from './revenue/AdminRevenueDisplay';
import RevenueReportSheet from './revenue/RevenueReportSheet';
import pharmacyLogo from '@/assets/pharmacy-logo.png';

interface RevenueManagerProps {
  onBack: () => void;
}

const RevenueManager: React.FC<RevenueManagerProps> = ({ onBack }) => {
  const manager = useRevenueManager();

  if (manager.revenuesLoading && !manager.showDailyDetails && !manager.showPeriodDetails) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <span className="text-sm text-muted-foreground">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (manager.showPeriodDetails) {
    const periodRevenues = manager.getPeriodRevenues(manager.viewMode === 'income' ? 'income' : 'banking_services');
    const periodRevenue = manager.viewMode === 'income' ? manager.getPeriodRevenue() : manager.getPeriodBankingServices();
    return (
      <PeriodRevenueDetails
        onBack={() => manager.setShowPeriodDetails(false)}
        periodStartDate={manager.periodStartDate}
        periodEndDate={manager.periodEndDate}
        periodRevenue={periodRevenue}
        periodRevenues={periodRevenues}
        language={manager.language}
        updateRevenue={manager.updateRevenue}
        deleteRevenue={manager.deleteRevenue}
        checkPermission={manager.checkPermission}
      />
    );
  }

  if (manager.showDailyDetails) {
    return (
      <DailyRevenueDetails
        onBack={() => manager.setShowDailyDetails(false)}
        selectedDate={manager.selectedDate}
        dailyRevenue={manager.dailyRevenue}
        dailyRevenues={manager.dailyRevenues}
        language={manager.language}
        updateRevenue={manager.updateRevenue}
        deleteRevenue={manager.deleteRevenue}
        checkPermission={manager.checkPermission}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 relative" dir={manager.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Logo */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          backgroundImage: `url(${pharmacyLogo})`,
          backgroundSize: '400px 400px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.03
        }}
      />

      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm shadow-sm border-b border-border/50 sticky top-0 z-20 safe-area-top">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground">إدارة الإيرادات</h1>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 relative z-10 space-y-4">
        <RevenueForm
          selectedDate={manager.selectedDate}
          setSelectedDate={manager.setSelectedDate}
          period={manager.period}
          setPeriod={manager.setPeriod}
          canSelectPeriod={manager.canSelectPeriod}
          periodDisplayName={manager.periodDisplayName}
          income={manager.income}
          setIncome={manager.setIncome}
          notes={manager.notes}
          setNotes={manager.setNotes}
          handleSubmit={manager.handleSubmit}
          formSubmitting={manager.formSubmitting}
          bankingValues={manager.bankingValues}
          onBankingValuesChange={manager.setBankingValues}
          bankingTotal={manager.bankingTotal}
        />

        {/* Admin sees full period breakdown, cashier sees summary */}
        {manager.isAdmin ? (
          <AdminRevenueDisplay
            dailyRevenues={manager.dailyRevenues}
            selectedDate={manager.selectedDate}
            updateRevenue={manager.updateRevenue}
            deleteRevenue={manager.deleteRevenue}
          />
        ) : null}

        <RevenueDisplay
          dailyRevenue={manager.dailyRevenue}
          dailyBankingServices={manager.dailyBankingServices}
          selectedDate={manager.selectedDate}
          navigateDate={manager.navigateDate}
          setShowDailyDetails={manager.setShowDailyDetails}
          canNavigateDate={manager.canNavigateDate}
          isAdmin={manager.isAdmin}
        />
      </main>

      {/* FAB for Reports - Admin only */}
      {manager.isAdmin && (
        <RevenueReportSheet revenues={manager.revenues}>
          <button
            className="fixed bottom-6 left-6 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
            aria-label="التقارير"
          >
            <BarChart3 className="w-6 h-6" />
          </button>
        </RevenueReportSheet>
      )}
    </div>
  );
};

export default RevenueManager;
