
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Revenue } from '@/store/pharmacyStore';
import { ArrowRight, Plus, TrendingUp, FileText, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface RevenueManagerProps {
  onBack: () => void;
}

const RevenueManager: React.FC<RevenueManagerProps> = ({ onBack }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'morning' | 'evening' | 'night' | 'ahmad'>('morning');
  const [revenue, setRevenue] = useState('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!revenue) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال قيمة الإيراد" : "Please enter revenue amount",
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
      income: parseFloat(revenue),
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

    setRevenue('');
    setNotes('');
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
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', 20, 20);
      doc.text('Revenue Report', 20, 30);
      
      doc.setFontSize(12);
      doc.text(`Period: ${reportStartDate} to ${reportEndDate}`, 20, 45);
      doc.text(`Generated by: ${user?.name}`, 20, 55);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 65);
      
      const periodRevenues = getRevenuesByDateRange(reportStartDate, reportEndDate);
      let yPosition = 85;
      
      if (periodRevenues.length === 0) {
        doc.text('No revenue records found for this period', 20, yPosition);
      } else {
        // Group by date
        const groupedByDate = periodRevenues.reduce((acc, rev) => {
          if (!acc[rev.date]) acc[rev.date] = [];
          acc[rev.date].push(rev);
          return acc;
        }, {} as Record<string, Revenue[]>);
        
        let totalRevenue = 0;
        
        Object.keys(groupedByDate).sort().forEach(date => {
          doc.setFontSize(14);
          doc.text(`Date: ${date}`, 20, yPosition);
          yPosition += 15;
          
          // Headers
          doc.setFontSize(11);
          doc.text('Shift', 30, yPosition);
          doc.text('Revenue', 100, yPosition);
          doc.text('Notes', 150, yPosition);
          yPosition += 10;
          
          let dailyTotal = 0;
          
          groupedByDate[date].forEach(rev => {
            const shiftName = rev.shift === 'ahmad' ? 'Ahmad Rajili' : 
                             rev.shift === 'morning' ? 'Morning' :
                             rev.shift === 'evening' ? 'Evening' : 'Night';
            
            doc.text(shiftName, 30, yPosition);
            doc.text(rev.income.toFixed(2), 100, yPosition);
            doc.text(rev.notes || '-', 150, yPosition);
            
            dailyTotal += rev.income;
            yPosition += 12;
          });
          
          // Daily total
          doc.setFontSize(12);
          doc.text(`Daily Total: ${dailyTotal.toFixed(2)} SAR`, 30, yPosition);
          totalRevenue += dailyTotal;
          yPosition += 20;
          
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        });
        
        // Grand total
        doc.setFontSize(14);
        doc.text(`Total Revenue: ${totalRevenue.toFixed(2)} SAR`, 20, yPosition);
      }
      
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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                onClick={onBack}
                variant="ghost"
                className="flex items-center space-x-2 space-x-reverse"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{t('back')}</span>
              </Button>
              <h1 className="text-xl font-bold text-gray-900 mr-4">{t('revenue.title')}</h1>
            </div>
            
            {checkPermission('export_pdf') && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <Input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-40"
                />
                <span className="text-sm text-gray-500">
                  {language === 'ar' ? 'إلى' : 'to'}
                </span>
                <Input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-40"
                />
                <Button onClick={exportPeriodReport} className="pharmacy-gradient">
                  <FileText className="w-4 h-4 ml-2" />
                  {t('revenue.exportReport')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Form */}
          <div className="lg:col-span-1">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>
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
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {t('revenue.shift')}
                    </label>
                    <Select value={shift} onValueChange={(value: 'morning' | 'evening' | 'night' | 'ahmad') => setShift(value)}>
                      <SelectTrigger>
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
                      {t('revenue.revenue')} ({language === 'ar' ? 'ريال سعودي' : 'SAR'})
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      placeholder="0.00"
                      required
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
                      className="text-right"
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
                <CardTitle>{language === 'ar' ? `إجمالي يوم ${date}` : `Daily Total ${date}`}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>{getShiftLabel('morning')}:</span>
                  <span className="font-medium">{todayTotals.morning.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{getShiftLabel('evening')}:</span>
                  <span className="font-medium">{todayTotals.evening.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{getShiftLabel('night')}:</span>
                  <span className="font-medium">{todayTotals.night.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{getShiftLabel('ahmad')}:</span>
                  <span className="font-medium">{todayTotals.ahmad.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('revenue.dailyTotal')}:</span>
                  <span className="text-green-600">{todayTotals.daily.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue List */}
          <div className="lg:col-span-2">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 space-x-reverse">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <span>{language === 'ar' ? 'سجل الإيرادات' : 'Revenue Records'}</span>
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? `إجمالي السجلات: ${filteredRevenues.length}` : `Total Records: ${filteredRevenues.length}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredRevenues.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {language === 'ar' ? 'لا توجد إيرادات مسجلة' : 'No revenue records found'}
                    </p>
                  ) : (
                    filteredRevenues
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((rev) => (
                        <div
                          key={rev.id}
                          className="p-4 rounded-lg border-2 border-green-200 bg-green-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <TrendingUp className="w-5 h-5 text-green-500" />
                              <div>
                                <div className="flex items-center space-x-2 space-x-reverse mb-1">
                                  <h3 className="font-medium text-gray-900">
                                    {new Date(rev.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                  </h3>
                                  <Badge variant="outline">
                                    {getShiftLabel(rev.shift)}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p className="font-medium text-green-600">
                                    {language === 'ar' ? 'الإيراد:' : 'Revenue:'} {rev.income.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}
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
    </div>
  );
};

export default RevenueManager;
