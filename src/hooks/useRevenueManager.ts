
import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { useRevenueState } from './revenue/useRevenueState';
import { useRevenueData } from './revenue/useRevenueData';
import { useRevenuePDF } from './revenue/useRevenuePDF';
import { useRevenueForm } from './revenue/useRevenueForm';
import { usePharmacyStore } from '@/store/pharmacyStore';

export const useRevenueManager = () => {
  const { user, checkPermission } = useAuthStore();
  const { language } = useLanguageStore();
  const { updateRevenue, deleteRevenue } = usePharmacyStore();

  const state = useRevenueState();

  const isAdmin = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'ahmad_rajili';
  }, [user]);

  const data = useRevenueData({
    periodStartDate: state.periodStartDate,
    periodEndDate: state.periodEndDate,
    selectedDate: state.selectedDate,
    setShowPeriodDetails: state.setShowPeriodDetails,
    userPeriod: state.period,
    isAdmin,
  });

  const { generatePeriodReport: generateReport } = useRevenuePDF();

  const form = useRevenueForm({
    income: state.income,
    setIncome: state.setIncome,
    notes: state.notes,
    setNotes: state.setNotes,
    period: state.period,
    selectedDate: state.selectedDate,
    formSubmitting: state.formSubmitting,
    setFormSubmitting: state.setFormSubmitting,
    bankingValues: state.bankingValues,
    resetBankingValues: state.resetBankingValues,
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(state.selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    state.setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const generatePeriodReport = () => {
    generateReport(state.reportStartDate, state.reportEndDate, data.revenues);
  }

  const canNavigateDate = useMemo(() => {
    return checkPermission('view_all');
  }, [checkPermission]);

  const canSelectPeriod = useMemo(() => {
    if (!user) return false;
    return checkPermission('register_revenue_all');
  }, [user, checkPermission]);

  const periodDisplayName = useMemo(() => {
    switch (state.period) {
      case 'morning': return 'صباحية';
      case 'evening': return 'مسائية';
      case 'night': return 'ليلية';
      case 'ahmad_rajili': return 'احمد الرجيلي';
      case 'abdulwahab': return 'عبدالوهاب';
      default: return '';
    }
  }, [state.period]);

  return {
    ...state,
    ...data,
    language,
    isAdmin,
    checkPermission,
    handleSubmit: form.handleSubmit,
    navigateDate,
    canNavigateDate,
    generatePeriodReport,
    canSelectPeriod,
    periodDisplayName,
    updateRevenue,
    deleteRevenue,
  };
};
