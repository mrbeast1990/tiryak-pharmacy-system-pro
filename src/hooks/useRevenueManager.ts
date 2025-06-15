import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Revenue } from '@/store/pharmacyStore';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const useRevenueManager = () => {
  const [expense, setExpense] = useState('');
  const [income, setIncome] = useState('');
  const [period, setPeriod] = useState<'morning' | 'evening' | 'night' | 'ahmad_rajili'>('morning');
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
  
  const { user, checkPermission } = useAuthStore();
  const { language } = useLanguageStore();
  const { revenues, addRevenue, getTotalDailyRevenue, fetchRevenues, revenuesLoading } = usePharmacyStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchRevenues();
  }, [fetchRevenues]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    const expenseAmount = Number(expense) || 0;
    const incomeAmount = Number(income) || 0;

    if (expenseAmount === 0 && incomeAmount === 0) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال مبلغ الصرف أو الإيراد" : "Please enter cash disbursement or income amount",
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
                        period === 'night' ? 'الليل' : 'احمد الرجيلي';
      toast({
        title: language === 'ar' ? "غير مصرح" : "Unauthorized",
        description: language === 'ar' ? `لا يمكنك تسجيل إيرادات فترة ${periodText}` : `Cannot register ${period} period revenues`,
        variant: "destructive",
      });
      setFormSubmitting(false);
      return;
    }

    if (expenseAmount > 0) {
      await addRevenue({
        amount: expenseAmount,
        type: 'expense',
        period,
        notes: notes + (notes ? ' - ' : '') + 'Cash Disbursement',
        date: selectedDate,
      });
    }

    if (incomeAmount > 0) {
      await addRevenue({
        amount: incomeAmount,
        type: 'income',
        period,
        notes: notes + (notes ? ' - ' : '') + 'Income',
        date: selectedDate,
      });
    }
    
    toast({
      title: language === 'ar' ? "تم الإضافة" : "Added",
      description: language === 'ar' ? `تم تسجيل العملية بنجاح` : `Transaction registered successfully`,
    });

    setExpense('');
    setIncome('');
    setNotes('');
    setFormSubmitting(false);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const canNavigateDate = useMemo(() => {
    return checkPermission('view_all');
  }, [checkPermission]);

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

  const generatePeriodReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى تحديد تاريخ البداية والنهاية" : "Please select start and end dates",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      const logoSize = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', (pageWidth / 2) - (logoSize/2), 10, logoSize, logoSize);
      
      doc.setFontSize(18);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', pageWidth / 2, 60, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Revenue Report', pageWidth / 2, 70, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Period: ${reportStartDate} - ${reportEndDate}`, pageWidth / 2, 80, { align: 'center' });
      
      const periodRevenuesData = revenues.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
      
      const revenuesByDate = periodRevenuesData.reduce((acc, revenue) => {
        if (!acc[revenue.date]) acc[revenue.date] = [];
        acc[revenue.date].push(revenue);
        return acc;
      }, {} as Record<string, Revenue[]>);
      
      const head = [['Date', 'Period', 'Change (LYD)', 'Revenue (LYD)', 'Notes']];
      const body: any[] = [];
      let totalRevenue = 0;

      Object.keys(revenuesByDate).sort().forEach(date => {
        const dayRevenues = revenuesByDate[date];
        let dailyTotalRevenue = 0;
        
        dayRevenues.forEach((revenue, index) => {
          const periodText = revenue.period === 'morning' ? 'Morning' : 
                            revenue.period === 'evening' ? 'Evening' : 
                            revenue.period === 'night' ? 'Night' : 'Ahmad Rajili';
          
          const change = revenue.type === 'expense' ? revenue.amount.toFixed(2) : '-';
          const income = revenue.type === 'income' ? revenue.amount.toFixed(2) : '-';
          
          if (revenue.type === 'income') {
            dailyTotalRevenue += revenue.amount;
            totalRevenue += revenue.amount;
          }

          let noteText = (revenue.notes || '').replace('- Income', '').replace('- Cash Disbursement', '').trim();
          
          // Sanitize notes: remove non-ASCII characters to prevent PDF rendering issues
          noteText = noteText.replace(/[^\x00-\x7F]+/g, '').trim() || '-';
          
          body.push([
            index === 0 ? date : '',
            periodText,
            change,
            income,
            noteText
          ]);
        });
        
        if (dayRevenues.length > 0) {
          body.push([
            { content: 'Daily Total:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: dailyTotalRevenue.toFixed(2), styles: { fontStyle: 'bold' } },
            ''
          ]);
        }
      });

      autoTable(doc, {
        head: head,
        body: body,
        startY: 90,
        theme: 'grid',
        headStyles: { fillColor: [70, 130, 180], textColor: 255, font: 'helvetica', fontStyle: 'bold' },
        styles: { font: 'helvetica', cellPadding: 3, fontSize: 9 },
        columnStyles: { 4: { cellWidth: 'auto' } },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 100;
      
      doc.setFontSize(14);
      doc.setFillColor(34, 139, 34);
      doc.rect(20, finalY + 10, pageWidth - 40, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`Total Revenue: ${totalRevenue.toFixed(2)} LYD`, pageWidth / 2, finalY + 17, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US')}, ${new Date().toLocaleTimeString('en-US')}`, pageWidth / 2, finalY + 35, { align: 'center' });
      doc.text('Manager: ________________', pageWidth / 2, finalY + 45, { align: 'center' });
      
      doc.save(`revenue-report-${reportStartDate}-to-${reportEndDate}.pdf`);
      
      toast({
        title: language === 'ar' ? "تم التصدير" : "Exported",
        description: language === 'ar' ? "تم تصدير التقرير بنجاح" : "Report exported successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: language === 'ar' ? "خطأ في التصدير" : "Export Error",
        description: language === 'ar' ? "حدث خطأ أثناء تصدير التقرير" : "Error occurred while exporting report",
        variant: "destructive",
      });
    }
  };

  const canSelectPeriod = useMemo(() => {
    if (!user) return false;
    return checkPermission('register_revenue_all');
  }, [user, checkPermission]);

  const periodDisplayName = useMemo(() => {
    switch (period) {
      case 'morning': return 'صباحية';
      case 'evening': return 'مسائية';
      case 'night': return 'ليلية';
      case 'ahmad_rajili': return 'احمد الرجيلي';
      default: return '';
    }
  }, [period]);

  return {
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
  };
};
