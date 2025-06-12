import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Revenue } from '@/store/pharmacyStore';
import { ArrowRight, Plus, TrendingUp, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface RevenueManagerProps {
  onBack: () => void;
}

const RevenueManager: React.FC<RevenueManagerProps> = ({ onBack }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'morning' | 'evening' | 'night' | 'ahmad'>('morning');
  const [expense, setExpense] = useState('');
  const [income, setIncome] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { user, checkPermission } = useAuthStore();
  const { language, t } = useLanguageStore();
  const { revenues, addRevenue, updateRevenue, deleteRevenue, getRevenuesByDateRange } = usePharmacyStore();
  const { toast } = useToast();

  const canManageShift = (targetShift: string) => {
    if (checkPermission('register_revenue_all')) return true;
    
    const userShiftPermissions = {
      morning: 'register_revenue_morning',
      evening: 'register_revenue_evening', 
      night: 'register_revenue_night'
    };
    
    return checkPermission(userShiftPermissions[targetShift as keyof typeof userShiftPermissions]);
  };

  const filteredRevenues = useMemo(() => {
    return revenues.filter(rev => {
      if (checkPermission('view_all')) return true;
      return rev.createdBy === user?.name;
    });
  }, [revenues, user, checkPermission]);

  const getShiftTotals = (targetDate: string) => {
    const dayRevenues = revenues.filter(rev => rev.date === targetDate);
    const totals = {
      morning: dayRevenues.filter(rev => rev.shift === 'morning').reduce((sum, rev) => sum + rev.income, 0),
      evening: dayRevenues.filter(rev => rev.shift === 'evening').reduce((sum, rev) => sum + rev.income, 0),
      night: dayRevenues.filter(rev => rev.shift === 'night').reduce((sum, rev) => sum + rev.income, 0),
      ahmad: dayRevenues.filter(rev => rev.shift === 'ahmad').reduce((sum, rev) => sum + rev.income, 0)
    };
    return {
      ...totals,
      daily: totals.morning + totals.evening + totals.night + totals.ahmad
    };
  };

  const todayTotals = getShiftTotals(date);
  const dayRevenues = revenues.filter(rev => rev.date === date);

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(date);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setDate(currentDate.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!income || !expense) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال قيمة الإيراد والصرف" : "Please enter revenue and expense amounts",
        variant: "destructive",
      });
      return;
    }

    if (shift !== 'ahmad' && !canManageShift(shift)) {
      toast({
        title: language === 'ar' ? "غير مصرح" : "Unauthorized",
        description: language === 'ar' ? "لا يمكنك تسجيل إيراد لهذه الفترة" : "Cannot register revenue for this shift",
        variant: "destructive",
      });
      return;
    }

    const revenueData = {
      date,
      shift: shift as 'morning' | 'evening' | 'night' | 'ahmad',
      expense: parseFloat(expense),
      income: parseFloat(income),
      notes,
      createdBy: user?.name || '',
      createdAt: new Date().toISOString()
    };

    if (editingId) {
      updateRevenue(editingId, revenueData);
      toast({
        title: language === 'ar' ? "تم التحديث" : "Updated",
        description: language === 'ar' ? "تم تحديث الإيراد بنجاح" : "Revenue updated successfully",
      });
      setEditingId(null);
    } else {
      addRevenue(revenueData);
      toast({
        title: language === 'ar' ? "تم الإضافة" : "Added",
        description: language === 'ar' ? "تم إضافة الإيراد بنجاح" : "Revenue added successfully",
      });
    }

    setIncome('');
    setExpense('');
    setNotes('');
  };

  const exportTodayReport = () => {
    if (!checkPermission('export_pdf')) {
      toast({
        title: language === 'ar' ? "غير مصرح" : "Unauthorized",
        description: language === 'ar' ? "لا يمكنك تصدير التقارير" : "Cannot export reports",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Add logo
      const logoSize = 12;
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', 15, 10, logoSize, logoSize);
      
      // Header
      doc.setFontSize(12);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('Revenue Report', 105, 25, { align: 'center' });
      
      // Date information
      doc.setFontSize(9);
      doc.text(`Date: ${date}`, 20, 40);
      
      // Create table
      const dayRevenues = revenues.filter(rev => rev.date === date);
      let yPosition = 55;
      
      // Draw header background
      doc.setFillColor(65, 105, 225);
      doc.rect(20, yPosition - 8, 40, 15, 'F');
      doc.rect(60, yPosition - 8, 40, 15, 'F');
      doc.rect(100, yPosition - 8, 40, 15, 'F');
      doc.rect(140, yPosition - 8, 40, 15, 'F');
      
      // Header text - white color
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Period', 40, yPosition);
      doc.text('Change (LYD)', 80, yPosition);
      doc.text('Revenue (LYD)', 120, yPosition);
      doc.text('Notes', 160, yPosition);
      
      // Reset text color to black
      doc.setTextColor(0, 0, 0);
      
      // Content
      yPosition += 20;
      let totalRevenue = 0;
      
      dayRevenues.forEach(rev => {
        const periodName = 
          rev.shift === 'morning' ? 'Morning' :
          rev.shift === 'evening' ? 'Evening' :
          rev.shift === 'night' ? 'Night' : 'Ahmad Rajili';
        
        // Draw row borders
        doc.setDrawColor(220, 220, 220);
        doc.rect(20, yPosition - 10, 160, 15);
        doc.line(60, yPosition - 10, 60, yPosition + 5);
        doc.line(100, yPosition - 10, 100, yPosition + 5);
        doc.line(140, yPosition - 10, 140, yPosition + 5);
        
        doc.setFontSize(8);
        doc.text(periodName, 40, yPosition - 2);
        doc.text(rev.expense.toFixed(2), 80, yPosition - 2);
        doc.text(rev.income.toFixed(2), 120, yPosition - 2);
        doc.text(rev.notes || '-', 145, yPosition - 2);
        
        totalRevenue += rev.income;
        yPosition += 15;
      });
      
      // Daily total
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`Daily Total: ${totalRevenue.toFixed(2)} LYD`, 140, yPosition, { align: 'right' });
      
      // Generation info
      yPosition += 25;
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, 105, yPosition, { align: 'center' });
      
      yPosition += 12;
      doc.text('Manager: ___________________', 105, yPosition, { align: 'center' });
      
      doc.save(`revenue-${date}.pdf`);
      
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

  const exportPeriodReport = () => {
    if (!checkPermission('export_pdf')) {
      toast({
        title: language === 'ar' ? "غير مصرح" : "Unauthorized",
        description: language === 'ar' ? "لا يمكنك تصدير التقارير" : "Cannot export reports",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Add logo
      const logoSize = 12;
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', 15, 10, logoSize, logoSize);
      
      // Header
      doc.setFontSize(12);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('Revenue Report', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
      
      // Period information
      doc.setFontSize(9);
      doc.text(`Period: ${reportStartDate} - ${reportEndDate}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
      
      // Group revenues by date
      const periodRevenues = getRevenuesByDateRange(reportStartDate, reportEndDate);
      const revenuesByDate: Record<string, Revenue[]> = {};
      
      periodRevenues.forEach(rev => {
        if (!revenuesByDate[rev.date]) {
          revenuesByDate[rev.date] = [];
        }
        revenuesByDate[rev.date].push(rev);
      });
      
      let yPosition = 50;
      let totalRevenue = 0;
      
      Object.keys(revenuesByDate).sort().forEach(currentDate => {
        const dateRevenues = revenuesByDate[currentDate];
        
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.setFontSize(10);
        doc.text(`Date: ${currentDate}`, 20, yPosition);
        yPosition += 15;
        
        doc.setFillColor(65, 105, 225);
        doc.rect(20, yPosition - 8, 30, 15, 'F');
        doc.rect(50, yPosition - 8, 30, 15, 'F');
        doc.rect(80, yPosition - 8, 30, 15, 'F');
        doc.rect(110, yPosition - 8, 30, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('Period', 35, yPosition);
        doc.text('Change (LYD)', 65, yPosition);
        doc.text('Revenue (LYD)', 95, yPosition);
        doc.text('Notes', 125, yPosition);
        
        doc.setTextColor(0, 0, 0);
        
        yPosition += 15;
        let dailyTotal = 0;
        
        dateRevenues.forEach(rev => {
          const periodName = 
            rev.shift === 'morning' ? 'Morning' :
            rev.shift === 'evening' ? 'Evening' :
            rev.shift === 'night' ? 'Night' : 'Ahmad Rajili';
          
          doc.setDrawColor(220, 220, 220);
          doc.rect(20, yPosition - 10, 120, 15);
          doc.line(50, yPosition - 10, 50, yPosition + 5);
          doc.line(80, yPosition - 10, 80, yPosition + 5);
          doc.line(110, yPosition - 10, 110, yPosition + 5);
          
          doc.setFontSize(7);
          doc.text(periodName, 35, yPosition - 2);
          doc.text(rev.expense.toFixed(2), 65, yPosition - 2);
          doc.text(rev.income.toFixed(2), 95, yPosition - 2);
          doc.text(rev.notes || '-', 115, yPosition - 2);
          
          dailyTotal += rev.income - rev.expense;
          totalRevenue += rev.income - rev.expense;
          yPosition += 12;
        });
        
        yPosition += 5;
        doc.setFontSize(9);
        doc.text(`Daily Total: ${dailyTotal.toFixed(2)} LYD`, 120, yPosition, { align: 'right' });
        yPosition += 15;
      });
      
      yPosition += 10;
      doc.setFontSize(11);
      doc.setTextColor(0, 128, 0);
      doc.text(`Total Revenue: ${totalRevenue.toFixed(2)} LYD`, doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      yPosition += 15;
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' });
      
      yPosition += 12;
      doc.text('Manager: ___________________', doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' });
      
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

  const getShiftLabel = (shift: string) => {
    const labels = {
      morning: language === 'ar' ? 'صباحية' : 'Morning',
      evening: language === 'ar' ? 'مسائية' : 'Evening', 
      night: language === 'ar' ? 'ليلية' : 'Night',
      ahmad: language === 'ar' ? 'أحمد الرجيلي' : 'Ahmad Rajili'
    };
    return labels[shift as keyof typeof labels] || shift;
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
            <div className="flex items-center">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 space-x-reverse text-xs"
              >
                <ArrowRight className="w-2 h-2" />
                <span>{t('back')}</span>
              </Button>
              <h1 className="text-sm font-bold text-gray-900 mr-3">{t('revenue.title')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Form */}
          <div className="lg:col-span-1">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-sm">
                  {editingId ? (language === 'ar' ? 'تعديل الإيراد' : 'Edit Revenue') : (language === 'ar' ? 'تسجيل إيراد جديد' : 'Register New Revenue')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {t('revenue.date')}
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {t('revenue.shift')}
                    </label>
                    <Select value={shift} onValueChange={(value: 'morning' | 'evening' | 'night' | 'ahmad') => setShift(value)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">{getShiftLabel('morning')}</SelectItem>
                        <SelectItem value="evening">{getShiftLabel('evening')}</SelectItem>
                        <SelectItem value="night">{getShiftLabel('night')}</SelectItem>
                        <SelectItem value="ahmad">{getShiftLabel('ahmad')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {language === 'ar' ? 'الصرف (فكة)' : 'Expense (Change)'} (LYD)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={expense}
                      onChange={(e) => setExpense(e.target.value)}
                      placeholder="0.00"
                      required
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {t('revenue.revenue')} (LYD)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      placeholder="0.00"
                      required
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {t('revenue.notes')}
                    </label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل ملاحظات إضافية' : 'Enter additional notes'}
                      className="text-right text-sm"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full pharmacy-gradient">
                    <Plus className="w-4 h-4 ml-2" />
                    {editingId ? (language === 'ar' ? 'تحديث الإيراد' : 'Update Revenue') : (language === 'ar' ? 'إضافة الإيراد' : 'Add Revenue')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Daily Totals */}
            <Card className="card-shadow mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateDate('prev')}
                    className="p-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <CardTitle className="text-sm">{language === 'ar' ? `إجمالي يوم ${date}` : `Daily Total ${date}`}</CardTitle>
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
              <CardContent className="space-y-3">
                {dayRevenues.map((rev) => (
                  <div key={rev.id} className="p-2 rounded border bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{getShiftLabel(rev.shift)}</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-blue-600">{language === 'ar' ? 'الصرف:' : 'Expense:'}</span>
                        <span className="font-medium text-blue-600">{rev.expense.toFixed(2)} LYD</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'الإيراد:' : 'Revenue:'}</span>
                        <span className="font-medium text-green-600">{rev.income.toFixed(2)} LYD</span>
                      </div>
                      {rev.notes && (
                        <div className="text-gray-600">
                          <span>{language === 'ar' ? 'ملاحظة:' : 'Note:'}</span> {rev.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between text-base font-bold">
                  <span>{t('revenue.dailyTotal')}:</span>
                  <span className="text-green-600">{todayTotals.daily.toFixed(2)} LYD</span>
                </div>
              </CardContent>
            </Card>

            {/* Period Report Export */}
            {checkPermission('export_pdf') && (
              <Card className="card-shadow mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">{t('revenue.exportReport')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={exportTodayReport} className="w-full pharmacy-gradient text-xs">
                    <FileText className="w-3 h-3 ml-1" />
                    {language === 'ar' ? 'إيراد اليوم' : 'Today Revenue'}
                  </Button>
                  <div className="flex items-center space-x-2 text-xs">
                    <Input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-gray-500">
                      {language === 'ar' ? 'إلى' : 'to'}
                    </span>
                    <Input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Button onClick={exportPeriodReport} className="w-full pharmacy-gradient text-xs">
                    <FileText className="w-3 h-3 ml-1" />
                    {language === 'ar' ? 'تصدير فترة' : 'Export Period'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Revenue List */}
          <div className="lg:col-span-2">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 space-x-reverse text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>{language === 'ar' ? 'سجل الإيرادات' : 'Revenue Records'}</span>
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? `إجمالي السجلات: ${filteredRevenues.length}` : `Total Records: ${filteredRevenues.length}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredRevenues.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">
                      {language === 'ar' ? 'لا توجد إيرادات مسجلة' : 'No revenue records found'}
                    </p>
                  ) : (
                    filteredRevenues
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((rev) => (
                        <div
                          key={rev.id}
                          className="p-3 rounded-lg border-2 border-green-200 bg-green-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <div>
                                <div className="flex items-center space-x-2 space-x-reverse mb-1">
                                  <h3 className="font-medium text-gray-900 text-sm">
                                    {new Date(rev.date).toLocaleDateString('en-US')}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    {getShiftLabel(rev.shift)}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <p className="font-medium text-green-600">
                                    {language === 'ar' ? 'الإيراد:' : 'Revenue:'} {rev.income.toFixed(2)} LYD
                                  </p>
                                  <p className="font-medium text-blue-600">
                                    {language === 'ar' ? 'الصرف:' : 'Expense:'} {rev.expense.toFixed(2)} LYD
                                  </p>
                                  <p className="text-xs">
                                    {language === 'ar' ? 'بواسطة:' : 'By:'} {rev.createdBy}
                                  </p>
                                  {rev.notes && (
                                    <p className="text-gray-600">
                                      {language === 'ar' ? 'ملاحظة:' : 'Note:'} {rev.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
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
