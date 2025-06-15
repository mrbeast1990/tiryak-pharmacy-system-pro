
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

import { useRevenueManager } from '@/hooks/useRevenueManager';

import DailyRevenueDetails from './revenue/DailyRevenueDetails';
import PeriodRevenueDetails from './revenue/PeriodRevenueDetails';
import RevenueForm from './revenue/RevenueForm';
import RevenueDisplay from './revenue/RevenueDisplay';
import RevenueReportExporter from './revenue/RevenueReportExporter';

interface RevenueManagerProps {
  onBack: () => void;
}

const RevenueManager: React.FC<RevenueManagerProps> = ({ onBack }) => {
  const {
    expense, setExpense,
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
    language,
    revenuesLoading,
    checkPermission,
    handleSubmit,
    navigateDate,
    canNavigateDate,
    dailyRevenue,
    dailyRevenues,
    getPeriodRevenue,
    getPeriodRevenues,
    showPeriodRevenue,
    generatePeriodReport,
    canSelectPeriod,
    periodDisplayName,
  } = useRevenueManager();

  if (revenuesLoading && !showDailyDetails && !showPeriodDetails) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (showPeriodDetails) {
    const periodRevenues = getPeriodRevenues();
    const periodRevenue = getPeriodRevenue();
    return (
      <PeriodRevenueDetails
        onBack={() => setShowPeriodDetails(false)}
        periodStartDate={periodStartDate}
        periodEndDate={periodEndDate}
        periodRevenue={periodRevenue}
        periodRevenues={periodRevenues}
        language={language}
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
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Logo */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png)',
          backgroundSize: '600px 600px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 space-x-reverse text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للرئيسية</span>
              </Button>
              <h1 className="text-lg font-bold text-gray-900">إدارة الإيرادات</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 relative z-10">
        <RevenueForm
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          period={period}
          setPeriod={setPeriod}
          canSelectPeriod={canSelectPeriod}
          periodDisplayName={periodDisplayName}
          expense={expense}
          setExpense={setExpense}
          income={income}
          setIncome={setIncome}
          notes={notes}
          setNotes={setNotes}
          handleSubmit={handleSubmit}
          formSubmitting={formSubmitting}
        />

        <RevenueDisplay
          dailyRevenue={dailyRevenue}
          selectedDate={selectedDate}
          navigateDate={navigateDate}
          setShowDailyDetails={setShowDailyDetails}
          periodStartDate={periodStartDate}
          setPeriodStartDate={setPeriodStartDate}
          periodEndDate={periodEndDate}
          setPeriodEndDate={setPeriodEndDate}
          showPeriodRevenue={showPeriodRevenue}
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
