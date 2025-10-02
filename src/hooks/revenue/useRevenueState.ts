
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export type Period = 'morning' | 'evening' | 'night' | 'ahmad_rajili';

export const useRevenueState = () => {
  const [bankingServices, setBankingServices] = useState('');
  const [income, setIncome] = useState('');
  const [period, setPeriod] = useState<Period>('morning');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [showDailyDetails, setShowDailyDetails] = useState(false);
  const [showPeriodDetails, setShowPeriodDetails] = useState(false);
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [periodEndDate, setPeriodEndDate] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'income' | 'banking'>('income');
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'morning_shift':
          setPeriod('morning');
          break;
        case 'evening_shift':
          setPeriod('evening');
          break;
        case 'night_shift':
          setPeriod('night');
          break;
        case 'ahmad_rajili':
          setPeriod('ahmad_rajili');
          break;
        default:
          setPeriod('morning');
          break;
      }
    }
  }, [user]);

  return {
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
    formSubmitting, setFormSubmitting,
    viewMode, setViewMode,
  };
};

