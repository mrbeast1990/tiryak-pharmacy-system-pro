
import { useEffect } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { useToast } from '@/hooks/use-toast';

interface UseRevenueDataProps {
  periodStartDate: string;
  periodEndDate: string;
  selectedDate: string;
  setShowPeriodDetails: (show: boolean) => void;
}

export const useRevenueData = ({ periodStartDate, periodEndDate, selectedDate, setShowPeriodDetails }: UseRevenueDataProps) => {
  const { revenues, getTotalDailyRevenue, fetchRevenues, revenuesLoading } = usePharmacyStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchRevenues();
  }, [fetchRevenues]);

  const dailyRevenue = getTotalDailyRevenue(selectedDate);
  const dailyRevenues = revenues.filter(revenue => revenue.date === selectedDate);

  const getPeriodRevenue = () => {
    if (!periodStartDate || !periodEndDate) return 0;
    return revenues
      .filter(revenue => 
        revenue.date >= periodStartDate && 
        revenue.date <= periodEndDate && 
        revenue.type === 'income'
      )
      .reduce((total, revenue) => total + revenue.amount, 0);
  };

  const getPeriodRevenues = () => {
    if (!periodStartDate || !periodEndDate) return [];
    return revenues.filter(revenue => 
      revenue.date >= periodStartDate && 
      revenue.date <= periodEndDate
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

  return {
    revenues,
    revenuesLoading,
    dailyRevenue,
    dailyRevenues,
    getPeriodRevenue,
    getPeriodRevenues,
    showPeriodRevenue,
  };
};
