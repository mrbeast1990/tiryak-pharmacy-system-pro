
import { useEffect, useMemo } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { useToast } from '@/hooks/use-toast';
import { Period } from './useRevenueState';

interface UseRevenueDataProps {
  periodStartDate: string;
  periodEndDate: string;
  selectedDate: string;
  setShowPeriodDetails: (show: boolean) => void;
  userPeriod: Period;
  isAdmin: boolean;
}

export const useRevenueData = ({ periodStartDate, periodEndDate, selectedDate, setShowPeriodDetails, userPeriod, isAdmin }: UseRevenueDataProps) => {
  const { revenues, getTotalDailyRevenue, fetchRevenues, revenuesLoading } = usePharmacyStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchRevenues();
  }, [fetchRevenues]);

  // Filter revenues based on role
  const filteredRevenues = useMemo(() => {
    if (isAdmin) return revenues;
    return revenues.filter(r => r.period === userPeriod);
  }, [revenues, isAdmin, userPeriod]);

  const dailyRevenues = useMemo(() => {
    return filteredRevenues.filter(revenue => revenue.date === selectedDate);
  }, [filteredRevenues, selectedDate]);

  const dailyRevenue = useMemo(() => {
    return dailyRevenues
      .filter(r => r.type === 'income')
      .reduce((total, r) => total + r.amount, 0);
  }, [dailyRevenues]);
  
  const dailyBankingServices = useMemo(() => {
    return dailyRevenues
      .filter(r => r.type === 'banking_services')
      .reduce((total, r) => total + r.amount, 0);
  }, [dailyRevenues]);

  const getPeriodRevenue = () => {
    if (!periodStartDate || !periodEndDate) return 0;
    return filteredRevenues
      .filter(revenue => 
        revenue.date >= periodStartDate && 
        revenue.date <= periodEndDate && 
        revenue.type === 'income'
      )
      .reduce((total, revenue) => total + revenue.amount, 0);
  };

  const getPeriodBankingServices = () => {
    if (!periodStartDate || !periodEndDate) return 0;
    return filteredRevenues
      .filter(revenue => 
        revenue.date >= periodStartDate && 
        revenue.date <= periodEndDate && 
        revenue.type === 'banking_services'
      )
      .reduce((total, revenue) => total + revenue.amount, 0);
  };

  const getPeriodRevenues = (type: 'income' | 'banking_services') => {
    if (!periodStartDate || !periodEndDate) return [];
    return filteredRevenues.filter(revenue => 
      revenue.date >= periodStartDate && 
      revenue.date <= periodEndDate &&
      revenue.type === type
    );
  };

  const showPeriodRevenue = () => {
    if (!periodStartDate || !periodEndDate) {
      toast({
        title: "تحديد التواريخ",
        description: "يرجى تحديد تاريخ البداية والنهاية",
        variant: "destructive",
      });
      return;
    }
    setShowPeriodDetails(true);
  };

  const showPeriodBanking = () => {
    if (!periodStartDate || !periodEndDate) {
      toast({
        title: "تحديد التواريخ",
        description: "يرجى تحديد تاريخ البداية والنهاية",
        variant: "destructive",
      });
      return;
    }
    setShowPeriodDetails(true);
  };

  return {
    revenues: filteredRevenues,
    revenuesLoading,
    dailyRevenue,
    dailyBankingServices,
    dailyRevenues,
    getPeriodRevenue,
    getPeriodBankingServices,
    getPeriodRevenues,
    showPeriodRevenue,
    showPeriodBanking,
  };
};
