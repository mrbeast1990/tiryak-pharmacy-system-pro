
import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { useToast } from '@/hooks/use-toast';
import { Period } from './useRevenueState';
import { BankingServiceEntry } from '@/components/revenue/BankingServiceInput';

interface UseRevenueFormProps {
  income: string;
  setIncome: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  period: Period;
  selectedDate: string;
  formSubmitting: boolean;
  setFormSubmitting: (submitting: boolean) => void;
  bankingValues: BankingServiceEntry[];
  resetBankingValues: () => void;
}

export const useRevenueForm = ({
  income, setIncome,
  notes, setNotes,
  period, selectedDate,
  formSubmitting, setFormSubmitting,
  bankingValues, resetBankingValues,
}: UseRevenueFormProps) => {
  const { user, checkPermission } = useAuthStore();
  const { language } = useLanguageStore();
  const { addRevenue } = usePharmacyStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    const incomeAmount = Number(income) || 0;
    const bankingTotal = bankingValues.reduce((s, e) => s + e.amount, 0);

    if (incomeAmount === 0 && bankingTotal === 0) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال الإيراد النقدي أو الخدمات المصرفية" : "Please enter cash income or banking services amount",
        variant: "destructive",
      });
      setFormSubmitting(false);
      return;
    }

    const canRegisterForPeriod = 
      checkPermission('register_revenue_all') ||
      checkPermission(`register_revenue_${period}`) ||
      user?.role === 'admin' ||
      user?.role === 'ahmad_rajili';

    if (!canRegisterForPeriod) {
      const periodText = period === 'morning' ? 'الصباح' : 
                        period === 'evening' ? 'المساء' : 
                        period === 'night' ? 'الليل' : 
                        period === 'abdulwahab' ? 'عبدالوهاب' : 'احمد الرجيلي';
      toast({
        title: language === 'ar' ? "غير مصرح" : "Unauthorized",
        description: language === 'ar' ? `لا يمكنك تسجيل إيرادات فترة ${periodText}` : `Cannot register ${period} period revenues`,
        variant: "destructive",
      });
      setFormSubmitting(false);
      return;
    }

    // Save cash income as one record
    if (incomeAmount > 0) {
      await addRevenue({
        amount: incomeAmount,
        type: 'income',
        period,
        notes: notes,
        date: selectedDate,
        service_name: null,
      });
    }

    // Save each banking entry as a separate record
    for (const entry of bankingValues) {
      await addRevenue({
        amount: entry.amount,
        type: 'banking_services',
        period,
        notes: notes,
        date: selectedDate,
        service_name: entry.service,
      });
    }
    
    toast({
      title: language === 'ar' ? "تم الإضافة" : "Added",
      description: language === 'ar' ? `تم تسجيل العملية بنجاح` : `Transaction registered successfully`,
    });

    setIncome('');
    setNotes('');
    resetBankingValues();
    setFormSubmitting(false);
  };

  return { handleSubmit };
};
