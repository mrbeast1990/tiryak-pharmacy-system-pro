
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Revenue } from '@/store/pharmacyStore';
import { ArrowRight, Plus, TrendingUp, DollarSign, Calendar, FileText, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface RevenueManagerProps {
  onBack: () => void;
}

const RevenueManager: React.FC<RevenueManagerProps> = ({ onBack }) => {
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
  
  const { user, checkPermission } = useAuthStore();
  const { language, t } = useLanguageStore();
  const { revenues, addRevenue, getTotalDailyRevenue } = usePharmacyStore();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expenseAmount = Number(expense) || 0;
    const incomeAmount = Number(income) || 0;

    if (expenseAmount === 0 && incomeAmount === 0) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال مبلغ الصرف أو الإيراد" : "Please enter expense or income amount",
        variant: "destructive",
      });
      return;
    }

    // Check permissions
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
      return;
    }

    // Add expense if entered
    if (expenseAmount > 0) {
      addRevenue({
        amount: expenseAmount,
        type: 'expense',
        period,
        notes: notes + (notes ? ' - ' : '') + 'صرف',
        date: selectedDate,
        createdBy: user?.name || ''
      });
    }

    // Add income if entered
    if (incomeAmount > 0) {
      addRevenue({
        amount: incomeAmount,
        type: 'income',
        period,
        notes: notes + (notes ? ' - ' : '') + 'إيراد',
        date: selectedDate,
        createdBy: user?.name || ''
      });
    }
    
    toast({
      title: language === 'ar' ? "تم الإضافة" : "Added",
      description: language === 'ar' ? `تم تسجيل العملية بنجاح` : `Transaction registered successfully`,
    });

    setExpense('');
    setIncome('');
    setNotes('');
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

  const dailyRevenue = getTotalDailyRevenue(selectedDate);

  const generatePeriodReport = () => {
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
      
      // Header
      doc.setFontSize(16);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Revenue Report: ${reportStartDate} to ${reportEndDate}`, 105, 30, { align: 'center' });
      
      // Get revenues for the period
      const periodRevenues = revenues.filter(revenue => 
        revenue.date >= reportStartDate && revenue.date <= reportEndDate
      );
      
      let yPosition = 50;
      let totalIncome = 0;
      let totalExpenses = 0;
      
      doc.setFontSize(10);
      doc.text('Date', 20, yPosition);
      doc.text('Period', 50, yPosition);
      doc.text('Type', 80, yPosition);
      doc.text('Amount', 110, yPosition);
      doc.text('Notes', 140, yPosition);
      
      yPosition += 10;
      
      periodRevenues.forEach(revenue => {
        doc.text(revenue.date, 20, yPosition);
        doc.text(revenue.period, 50, yPosition);
        doc.text(revenue.type, 80, yPosition);
        doc.text(revenue.amount.toString(), 110, yPosition);
        doc.text(revenue.notes || '', 140, yPosition);
        
        if (revenue.type === 'income') {
          totalIncome += revenue.amount;
        } else {
          totalExpenses += revenue.amount;
        }
        
        yPosition += 8;
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      // Summary
      yPosition += 10;
      doc.setFontSize(12);
      doc.text(`Total Income: ${totalIncome} JD`, 20, yPosition);
      yPosition += 8;
      doc.text(`Total Expenses: ${totalExpenses} JD`, 20, yPosition);
      yPosition += 8;
      doc.text(`Net Revenue: ${totalIncome - totalExpenses} JD`, 20, yPosition);
      
      doc.save(`revenue-report-${reportStartDate}-to-${reportEndDate}.pdf`);
      
      toast({
        title: language === 'ar' ? "تم التصدير" : "Exported",
        description: language === 'ar' ? "تم تصدير التقرير بنجاح" : "Report exported successfully",
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ في التصدير" : "Export Error",
        description: language === 'ar' ? "حدث خطأ أثناء تصدير التقرير" : "Error occurred while exporting report",
        variant: "destructive",
      });
    }
  };

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
        <Card className="card-shadow mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  التاريخ
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-sm text-right"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  الفترة
                </label>
                <Select value={period} onValueChange={(value: 'morning' | 'evening' | 'night' | 'ahmad_rajili') => setPeriod(value)}>
                  <SelectTrigger className="text-sm text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">صباحية</SelectItem>
                    <SelectItem value="evening">مسائية</SelectItem>
                    <SelectItem value="night">ليلية</SelectItem>
                    <SelectItem value="ahmad_rajili">احمد الرجيلي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  الصرف (دينار)
                </label>
                <Input
                  type="number"
                  value={expense}
                  onChange={(e) => setExpense(e.target.value)}
                  placeholder="أدخل مبلغ الصرف"
                  className="text-sm text-right"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  الإيراد (دينار)
                </label>
                <Input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="أدخل مبلغ الإيراد"
                  className="text-sm text-right"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  ملاحظات
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات (اختياري)"
                  className="text-sm text-right resize-none"
                  rows={3}
                />
              </div>
              
              <Button type="submit" className="w-full pharmacy-gradient text-white font-medium py-3">
                <Plus className="w-4 h-4 ml-2" />
                إضافة إدخال
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Daily Revenue Display */}
        <Card className="card-shadow mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => navigateDate('prev')}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">إيراد اليوم</p>
                <p className="text-lg font-bold text-green-600">{dailyRevenue} دينار</p>
                <p className="text-xs text-gray-500">{selectedDate}</p>
              </div>
              
              <Button
                onClick={() => navigateDate('next')}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Period Report Export */}
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-gray-700 text-right mb-4">
              إصدار تقرير فترة معينة
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 text-right block">
                    من
                  </label>
                  <Input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="text-xs text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 text-right block">
                    الى
                  </label>
                  <Input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="text-xs text-right"
                  />
                </div>
              </div>
              
              <Button
                onClick={generatePeriodReport}
                className="w-full pharmacy-gradient text-white"
                size="sm"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RevenueManager;
