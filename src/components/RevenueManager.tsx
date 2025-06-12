
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
import { ArrowRight, Plus, TrendingUp, DollarSign, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface RevenueManagerProps {
  onBack: () => void;
}

const RevenueManager: React.FC<RevenueManagerProps> = ({ onBack }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [period, setPeriod] = useState<'morning' | 'evening' | 'night'>('morning');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedDateForTotal, setSelectedDateForTotal] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [showDetailsForDate, setShowDetailsForDate] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { user, checkPermission } = useAuthStore();
  const { language, t } = useLanguageStore();
  const { revenues, addRevenue, getTotalDailyRevenue } = usePharmacyStore();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount))) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال مبلغ صحيح" : "Please enter a valid amount",
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
      toast({
        title: language === 'ar' ? "غير مصرح" : "Unauthorized",
        description: language === 'ar' ? `لا يمكنك تسجيل إيرادات فترة ${period === 'morning' ? 'الصباح' : period === 'evening' ? 'المساء' : 'الليل'}` : `Cannot register ${period} period revenues`,
        variant: "destructive",
      });
      return;
    }

    addRevenue({
      amount: Number(amount),
      type,
      period,
      notes,
      date: selectedDate,
      createdBy: user?.name || ''
    });
    
    toast({
      title: language === 'ar' ? "تم الإضافة" : "Added",
      description: language === 'ar' ? `تم تسجيل ${type === 'income' ? 'إيراد' : 'صرف'} بمبلغ ${amount} دينار` : `${type === 'income' ? 'Income' : 'Expense'} of ${amount} JD registered`,
    });

    setAmount('');
    setNotes('');
  };

  const dailyTotal = getTotalDailyRevenue(selectedDateForTotal);
  const revenuesForSelectedDate = revenues.filter(rev => rev.date === selectedDateForTotal);
  
  const periodTotals = useMemo(() => {
    const periods = { morning: { income: 0, expense: 0 }, evening: { income: 0, expense: 0 }, night: { income: 0, expense: 0 } };
    revenuesForSelectedDate.forEach(rev => {
      periods[rev.period][rev.type] += rev.amount;
    });
    return periods;
  }, [revenuesForSelectedDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDateForTotal);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDateForTotal(currentDate.toISOString().split('T')[0]);
    setShowDetailsForDate(false);
  };

  const exportPeriodReport = () => {
    if (!startDate || !endDate) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى تحديد تاريخ البداية والنهاية" : "Please select start and end dates",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Add logo - smaller size
      const logoSize = 12;
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', 15, 8, logoSize, logoSize);
      
      // Header - smaller fonts
      doc.setFontSize(10);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', 105, 12, { align: 'center' });
      
      doc.setFontSize(9);
      doc.text('Revenue Report', 105, 18, { align: 'center' });
      doc.text(`Period: ${startDate} to ${endDate}`, 105, 24, { align: 'center' });
      
      // Filter revenues by date range
      const filteredRevenues = revenues.filter(rev => {
        return rev.date >= startDate && rev.date <= endDate;
      });
      
      // Table - smaller table
      let yPosition = 35;
      
      // Draw smaller header background
      doc.setFillColor(65, 105, 225);
      doc.rect(25, yPosition - 5, 25, 8, 'F');
      doc.rect(50, yPosition - 5, 25, 8, 'F');
      doc.rect(75, yPosition - 5, 25, 8, 'F');
      doc.rect(100, yPosition - 5, 25, 8, 'F');
      doc.rect(125, yPosition - 5, 30, 8, 'F');
      doc.rect(155, yPosition - 5, 25, 8, 'F');
      
      // Table headers - smaller fonts
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text('Date', 37.5, yPosition, { align: 'center' });
      doc.text('Period', 62.5, yPosition, { align: 'center' });
      doc.text('Type', 87.5, yPosition, { align: 'center' });
      doc.text('Amount', 112.5, yPosition, { align: 'center' });
      doc.text('Notes', 140, yPosition, { align: 'center' });
      doc.text('By', 167.5, yPosition, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      yPosition += 12;
      
      // Table content - smaller fonts
      filteredRevenues.forEach((revenue, index) => {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(25, yPosition - 6, 180, yPosition - 6);
        doc.line(25, yPosition + 2, 180, yPosition + 2);
        
        doc.setFontSize(6);
        doc.text(revenue.date, 37.5, yPosition - 1, { align: 'center' });
        doc.text(revenue.period, 62.5, yPosition - 1, { align: 'center' });
        doc.text(revenue.type, 87.5, yPosition - 1, { align: 'center' });
        doc.text(`${revenue.amount} JD`, 112.5, yPosition - 1, { align: 'center' });
        doc.text(revenue.notes.substring(0, 15), 140, yPosition - 1, { align: 'center' });
        doc.text(revenue.createdBy, 167.5, yPosition - 1, { align: 'center' });
        
        yPosition += 8;
        
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      doc.save(`revenue-report-${startDate}-to-${endDate}.pdf`);
      
      toast({
        title: language === 'ar' ? "تم التصدير" : "Exported",
        description: language === 'ar' ? "تم تصدير تقرير الإيرادات بنجاح" : "Revenue report exported successfully",
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative">
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
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-bold text-gray-900">{t('revenue.title')}</h1>
          </div>
          <div className="pb-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 space-x-reverse text-sm"
            >
              <ArrowRight className="w-3 h-3" />
              <span>{t('back')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Revenue Form */}
          <div className="lg:col-span-1">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-sm">
                  {t('revenue.addRevenue')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('revenue.date')}
                    </label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('revenue.type')}
                    </label>
                    <Select value={type} onValueChange={(value: 'income' | 'expense') => setType(value)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">{language === 'ar' ? 'إيراد' : 'Income'}</SelectItem>
                        <SelectItem value="expense">
                          <span className="text-blue-600 font-medium">{language === 'ar' ? 'صرف' : 'Expense'}</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('revenue.period')}
                    </label>
                    <Select value={period} onValueChange={(value: 'morning' | 'evening' | 'night') => setPeriod(value)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">{language === 'ar' ? 'الصباح' : 'Morning'}</SelectItem>
                        <SelectItem value="evening">{language === 'ar' ? 'المساء' : 'Evening'}</SelectItem>
                        <SelectItem value="night">{language === 'ar' ? 'الليل' : 'Night'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('revenue.amount')} ({language === 'ar' ? 'دينار' : 'JD'})
                    </label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل المبلغ' : 'Enter amount'}
                      className="text-sm text-right"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('revenue.notes')}
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                      className="text-sm text-right resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full pharmacy-gradient">
                    <Plus className="w-4 h-4 ml-2" />
                    {t('revenue.addEntry')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Daily Summary and Statistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Total with Navigation */}
            <Card className="card-shadow">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigateDate('prev')}
                    className="p-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <CardTitle 
                    className="flex items-center space-x-2 space-x-reverse text-green-600 text-sm cursor-pointer"
                    onClick={() => setShowDetailsForDate(!showDetailsForDate)}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>{t('revenue.dailyTotal')} - {selectedDateForTotal}</span>
                  </CardTitle>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigateDate('next')}
                    className="p-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {dailyTotal.toFixed(2)} {language === 'ar' ? 'دينار' : 'JD'}
                  </div>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'صافي الإيراد اليومي' : 'Net Daily Revenue'}
                  </p>
                </div>

                {showDetailsForDate && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-medium text-sm">{language === 'ar' ? 'تفاصيل الفترات:' : 'Period Details:'}</h4>
                    {Object.entries(periodTotals).map(([periodName, totals]) => (
                      <div key={periodName} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">
                            {periodName === 'morning' ? (language === 'ar' ? 'الصباح' : 'Morning') :
                             periodName === 'evening' ? (language === 'ar' ? 'المساء' : 'Evening') :
                             (language === 'ar' ? 'الليل' : 'Night')}
                          </span>
                          <span className="text-sm font-bold">
                            {(totals.income - totals.expense).toFixed(2)} {language === 'ar' ? 'د' : 'JD'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">
                            {language === 'ar' ? 'إيراد:' : 'Income:'} {totals.income.toFixed(2)}
                          </span>
                          <span className="text-blue-600 font-medium">
                            {language === 'ar' ? 'صرف:' : 'Expense:'} {totals.expense.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Show entries for this period */}
                        <div className="mt-2 space-y-1">
                          {revenuesForSelectedDate
                            .filter(rev => rev.period === periodName)
                            .map((revenue, idx) => (
                              <div key={idx} className="text-xs bg-white p-2 rounded flex justify-between">
                                <span className={revenue.type === 'expense' ? 'text-blue-600 font-medium' : 'text-green-600'}>
                                  {revenue.amount} {language === 'ar' ? 'د' : 'JD'} - {revenue.type === 'income' ? (language === 'ar' ? 'إيراد' : 'Income') : (language === 'ar' ? 'صرف' : 'Expense')}
                                </span>
                                <span className="text-gray-500">{revenue.notes}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Period Report Section */}
            <Card className="card-shadow">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-blue-600 text-sm">
                  <FileText className="w-4 h-4" />
                  <span>{t('revenue.exportPeriodReport')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs"
                    placeholder={language === 'ar' ? 'من تاريخ' : 'From date'}
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs"
                    placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'}
                  />
                  <Button onClick={exportPeriodReport} size="sm" className="pharmacy-gradient text-xs px-2 py-1">
                    <FileText className="w-2 h-2 ml-1" />
                    {t('revenue.exportPdf')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-gray-600 relative z-10">
        <p>Ahmed A Alrjele</p>
        <p>Founder & CEO</p>
        <p>Al-tiryak Al-shafi Pharmacy</p>
      </div>
    </div>
  );
};

export default RevenueManager;
