
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
import { ArrowRight, Plus, TrendingUp, DollarSign, Calendar, FileText, ArrowLeft, Download } from 'lucide-react';
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
  const [showDailyDetails, setShowDailyDetails] = useState(false);
  
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
        description: language === 'ar' ? "يرجى إدخال مبلغ الصرف أو الإيراد" : "Please enter cash disbursement or income amount",
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

    // Add cash disbursement if entered (فكة - doesn't reduce from income)
    if (expenseAmount > 0) {
      addRevenue({
        amount: expenseAmount,
        type: 'expense',
        period,
        notes: notes + (notes ? ' - ' : '') + 'صرف فكة',
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
  const dailyRevenues = revenues.filter(revenue => revenue.date === selectedDate);

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
      
      // Configure font for Arabic support
      doc.setLanguage("ar");
      
      // Add logo - larger size
      const logoSize = 50;
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', 15, 10, logoSize, logoSize);
      
      // Header
      doc.setFontSize(16);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', 105, 30, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('Revenue Report', 105, 40, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Period: ${reportStartDate} - ${reportEndDate}`, 105, 50, { align: 'center' });
      
      // Get revenues for the period
      const periodRevenues = revenues.filter(revenue => 
        revenue.date >= reportStartDate && revenue.date <= reportEndDate
      );
      
      // Group revenues by date
      const revenuesByDate = periodRevenues.reduce((acc, revenue) => {
        if (!acc[revenue.date]) {
          acc[revenue.date] = [];
        }
        acc[revenue.date].push(revenue);
        return acc;
      }, {} as Record<string, Revenue[]>);
      
      let yPosition = 70;
      let totalRevenue = 0;
      
      // Process each date
      Object.keys(revenuesByDate).sort().forEach(date => {
        const dayRevenues = revenuesByDate[date];
        
        // Date header
        doc.setFontSize(12);
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPosition - 5, 170, 8, 'F');
        doc.text(`Date: ${date}`, 25, yPosition, { align: 'left' });
        yPosition += 15;
        
        // Table headers for this date
        doc.setFontSize(10);
        doc.setFillColor(70, 130, 180);
        doc.rect(20, yPosition - 5, 40, 8, 'F');
        doc.rect(60, yPosition - 5, 40, 8, 'F');
        doc.rect(100, yPosition - 5, 40, 8, 'F');
        doc.rect(140, yPosition - 5, 50, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.text('Period', 40, yPosition, { align: 'center' });
        doc.text('Change (LYD)', 80, yPosition, { align: 'center' });
        doc.text('Revenue (LYD)', 120, yPosition, { align: 'center' });
        doc.text('Notes', 165, yPosition, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        yPosition += 10;
        
        let dailyTotal = 0;
        
        dayRevenues.forEach(revenue => {
          // Draw row borders
          doc.setDrawColor(200, 200, 200);
          doc.line(20, yPosition - 3, 190, yPosition - 3);
          doc.line(20, yPosition + 5, 190, yPosition + 5);
          
          const periodText = revenue.period === 'morning' ? 'Morning' : 
                            revenue.period === 'evening' ? 'Evening' : 
                            revenue.period === 'night' ? 'Night' : 'Ahmad Rajili';
          doc.text(periodText, 40, yPosition, { align: 'center' });
          
          if (revenue.type === 'expense') {
            doc.text(`${revenue.amount}.00`, 80, yPosition, { align: 'center' });
            doc.text('-', 120, yPosition, { align: 'center' });
          } else {
            doc.text('-', 80, yPosition, { align: 'center' });
            doc.text(`${revenue.amount}.00`, 120, yPosition, { align: 'center' });
            dailyTotal += revenue.amount;
            totalRevenue += revenue.amount;
          }
          
          // Notes - handle Arabic text properly
          if (revenue.notes) {
            let noteText = revenue.notes.replace('- إيراد', '').replace('- صرف فكة', '').trim();
            if (noteText) {
              // For Arabic text, we need to handle it differently
              // Since jsPDF doesn't natively support Arabic, we'll encode it properly
              try {
                // Check if the text contains Arabic characters
                const hasArabic = /[\u0600-\u06FF]/.test(noteText);
                if (hasArabic) {
                  // For Arabic text, we'll use a different approach
                  doc.text(noteText, 165, yPosition, { align: 'center', lang: 'ar' });
                } else {
                  doc.text(noteText, 165, yPosition, { align: 'center' });
                }
              } catch (error) {
                // Fallback if Arabic rendering fails
                doc.text('[Arabic Text]', 165, yPosition, { align: 'center' });
              }
            } else {
              doc.text('-', 165, yPosition, { align: 'center' });
            }
          } else {
            doc.text('-', 165, yPosition, { align: 'center' });
          }
          
          yPosition += 10;
        });
        
        // Daily total
        doc.setFontSize(11);
        doc.setFillColor(220, 220, 220);
        doc.rect(20, yPosition - 3, 170, 8, 'F');
        doc.text(`Daily Total: ${dailyTotal}.00 LYD`, 105, yPosition, { align: 'center' });
        yPosition += 20;
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      // Summary
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFillColor(34, 139, 34);
      doc.rect(20, yPosition - 5, 170, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`Total Revenue: ${totalRevenue}.00 LYD`, 105, yPosition, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPosition += 20;
      
      // Footer
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US')}, ${new Date().toLocaleTimeString('en-US')}`, 105, yPosition, { align: 'center' });
      yPosition += 10;
      doc.text('Manager: ________________', 105, yPosition, { align: 'center' });
      
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

  if (showDailyDetails) {
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
                  onClick={() => setShowDailyDetails(false)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 space-x-reverse text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة</span>
                </Button>
                <h1 className="text-lg font-bold text-gray-900">تفاصيل إيراد {selectedDate}</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
          <div className="space-y-4">
            {dailyRevenues.map((revenue) => (
              <Card key={revenue.id} className="card-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {revenue.period === 'morning' ? 'صباحية' : 
                         revenue.period === 'evening' ? 'مسائية' : 
                         revenue.period === 'night' ? 'ليلية' : 'احمد الرجيلي'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {revenue.type === 'income' ? 'إيراد' : 'صرف فكة'}: {revenue.amount} دينار
                      </p>
                      {revenue.notes && (
                        <p className="text-sm text-gray-500 mt-1">{revenue.notes}</p>
                      )}
                    </div>
                    <Badge variant={revenue.type === 'income' ? 'default' : 'secondary'}>
                      {revenue.type === 'income' ? 'إيراد' : 'صرف'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {dailyRevenues.length === 0 && (
              <Card className="card-shadow">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">لا توجد معاملات في هذا التاريخ</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
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
                  صرف الفكة (دينار)
                </label>
                <Input
                  type="number"
                  value={expense}
                  onChange={(e) => setExpense(e.target.value)}
                  placeholder="أدخل مبلغ صرف الفكة"
                  className="text-sm text-right"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 text-right">
                  ملاحظة: صرف الفكة لا يُخصم من الإيراد
                </p>
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
                onClick={() => navigateDate('next')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-center cursor-pointer" onClick={() => setShowDailyDetails(true)}>
                <p className="text-sm text-gray-600">إيراد اليوم</p>
                <p className="text-lg font-bold text-green-600">{dailyRevenue} دينار</p>
                <p className="text-xs text-gray-500">{selectedDate}</p>
              </div>
              
              <Button
                onClick={() => navigateDate('prev')}
                variant="outline"
                size="sm"
              >
                <ArrowRight className="w-4 h-4" />
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
