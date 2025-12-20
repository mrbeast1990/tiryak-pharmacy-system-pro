
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Wallet } from 'lucide-react';

import { useRevenueManager } from '@/hooks/useRevenueManager';

import DailyRevenueDetails from './revenue/DailyRevenueDetails';
import PeriodRevenueDetails from './revenue/PeriodRevenueDetails';
import RevenueForm from './revenue/RevenueForm';
import RevenueDisplay from './revenue/RevenueDisplay';
import RevenueReportExporter from './revenue/RevenueReportExporter';
import pharmacyLogo from '@/assets/pharmacy-logo.png';

interface RevenueManagerProps {
  onBack: () => void;
}

const RevenueManager: React.FC<RevenueManagerProps> = ({ onBack }) => {
  const {
    bankingServices, setBankingServices,
    income, setIncome,
    period, setPeriod,
    notes, setNotes,
    selectedDate, setSelectedDate,
    reportStartDate, setReportStartDate,
    reportEndDate, setReportEndDate,
    showDailyDetails, setShowDailyDetails,
    showPeriodDetails, setShowPeriodDetails,
    periodStartDate, setPeriodStartDate,
    periodEndDate, setPeriodEndDate,
    formSubmitting,
    viewMode, setViewMode,
    language,
    revenuesLoading,
    checkPermission,
    handleSubmit,
    navigateDate,
    canNavigateDate,
    dailyRevenue,
    dailyBankingServices,
    dailyRevenues,
    getPeriodRevenue,
    getPeriodBankingServices,
    getPeriodRevenues,
    showPeriodRevenue,
    showPeriodBanking,
    generatePeriodReport,
    canSelectPeriod,
    periodDisplayName,
    updateRevenue,
    deleteRevenue,
  } = useRevenueManager();

  if (revenuesLoading && !showDailyDetails && !showPeriodDetails) {
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

  if (showPeriodDetails) {
    const periodRevenues = getPeriodRevenues(viewMode === 'income' ? 'income' : 'banking_services');
    const periodRevenue = viewMode === 'income' ? getPeriodRevenue() : getPeriodBankingServices();
    return (
      <PeriodRevenueDetails
        onBack={() => setShowPeriodDetails(false)}
        periodStartDate={periodStartDate}
        periodEndDate={periodEndDate}
        periodRevenue={periodRevenue}
        periodRevenues={periodRevenues}
        language={language}
        updateRevenue={updateRevenue}
        deleteRevenue={deleteRevenue}
        checkPermission={checkPermission}
      />
    );
  }

  if (showDailyDetails) {
    return (
      <DailyRevenueDetails
        onBack={() => setShowDailyDetails(false)}
        selectedDate={selectedDate}
        dailyRevenue={dailyRevenue}
        dailyRevenues={dailyRevenues}
        language={language}
        updateRevenue={updateRevenue}
        deleteRevenue={deleteRevenue}
        checkPermission={checkPermission}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-border/50 sticky top-0 z-20">
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
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          period={period}
          setPeriod={setPeriod}
          canSelectPeriod={canSelectPeriod}
          periodDisplayName={periodDisplayName}
          bankingServices={bankingServices}
          setBankingServices={setBankingServices}
          income={income}
          setIncome={setIncome}
          notes={notes}
          setNotes={setNotes}
          handleSubmit={handleSubmit}
          formSubmitting={formSubmitting}
        />

        <RevenueDisplay
          dailyRevenue={dailyRevenue}
          dailyBankingServices={dailyBankingServices}
          selectedDate={selectedDate}
          navigateDate={navigateDate}
          setShowDailyDetails={setShowDailyDetails}
          periodStartDate={periodStartDate}
          setPeriodStartDate={setPeriodStartDate}
          periodEndDate={periodEndDate}
          setPeriodEndDate={setPeriodEndDate}
          showPeriodRevenue={() => {
            setViewMode('income');
            showPeriodRevenue();
          }}
          showPeriodBanking={() => {
            setViewMode('banking');
            showPeriodBanking();
          }}
          canNavigateDate={canNavigateDate}
        />
        
        {checkPermission('export_revenue_pdf') && (
          <RevenueReportExporter
            reportStartDate={reportStartDate}
            setReportStartDate={setReportStartDate}
            reportEndDate={reportEndDate}
            setReportEndDate={setReportEndDate}
            generatePeriodReport={generatePeriodReport}
          />
        )}
      </main>
    </div>
  );
};

export default RevenueManager;
