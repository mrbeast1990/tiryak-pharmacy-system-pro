
import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { useToast } from '@/hooks/use-toast';
import { Period } from './useRevenueState';
import { BankingServiceEntry } from '@/components/revenue/BankingServiceInput';

const PERIOD_DISPLAY_NAMES: Record<string, string> = {
  morning: 'صباحية',
  evening: 'مسائية',
  night: 'ليلية',
  ahmad_rajili: 'احمد الرجيلي',
  abdulwahab: 'عبدالوهاب',
};

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

    // Determine if user is registering for a period that's not their own
    const ROLE_TO_PERIOD: Record<string, string> = {
      morning_shift: 'morning',
      evening_shift: 'evening',
      night_shift: 'night',
      abdulwahab: 'abdulwahab',
      ahmad_rajili: 'ahmad_rajili',
    };
    const userDefaultPeriod = user?.role ? ROLE_TO_PERIOD[user.role] : undefined;
    const isOtherPeriod = userDefaultPeriod && userDefaultPeriod !== period;
    const nameOverride = isOtherPeriod ? PERIOD_DISPLAY_NAMES[period] || undefined : undefined;

    let hasFailure = false;

    console.log('📝 Submit - income:', incomeAmount, 'bankingValues:', JSON.stringify(bankingValues), 'bankingTotal:', bankingTotal, 'period:', period, 'date:', selectedDate);

    // Save cash income as one record
    if (incomeAmount > 0) {
      console.log('💰 Saving income:', incomeAmount);
      const success = await addRevenue({
        amount: incomeAmount,
        type: 'income',
        period,
        notes: notes,
        date: selectedDate,
        service_name: null,
        is_verified: false,
        verified_by_name: null,
        adjustment: 0,
        adjustment_note: null,
      });
      console.log('💰 Income save result:', success);
      if (!success) hasFailure = true;
    }

    // Save each banking entry as a separate record
    console.log('🏦 Banking entries to save:', bankingValues.length);
    for (const entry of bankingValues) {
      console.log('🏦 Saving banking entry:', entry.service, entry.amount);
      const success = await addRevenue({
        amount: entry.amount,
        type: 'banking_services',
        period,
        notes: notes,
        date: selectedDate,
        service_name: entry.service,
        is_verified: false,
        verified_by_name: null,
        adjustment: 0,
        adjustment_note: null,
      });
      console.log('🏦 Banking save result:', success, 'for', entry.service);
      if (!success) hasFailure = true;
    }
    
    if (hasFailure) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "فشل حفظ بعض البيانات. تحقق من صلاحياتك." : "Failed to save some data. Check your permissions.",
        variant: "destructive",
      });
    } else {
      toast({
        title: language === 'ar' ? "تم الإضافة" : "Added",
        description: language === 'ar' ? `تم تسجيل العملية بنجاح` : `Transaction registered successfully`,
      });
    }

    setIncome('');
    setNotes('');
    resetBankingValues();
    setFormSubmitting(false);
  };

  return { handleSubmit };
};
