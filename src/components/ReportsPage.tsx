import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { ArrowRight, Users, BarChart3, FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface ReportsPageProps {
  onBack: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ onBack }) => {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const { medicines, revenues } = usePharmacyStore();
  const { toast } = useToast();
  
  const [reportStartDate, setReportStartDate] = React.useState('');
  const [reportEndDate, setReportEndDate] = React.useState('');

  // Calculate user statistics
  const userStats = React.useMemo(() => {
    const stats: Record<string, { shortages: number; revenues: number }> = {};
    
    medicines.forEach(medicine => {
      if (medicine.updatedBy) {
        if (!stats[medicine.updatedBy]) {
          stats[medicine.updatedBy] = { shortages: 0, revenues: 0 };
        }
        stats[medicine.updatedBy].shortages++;
      }
    });
    
    revenues.forEach(revenue => {
      if (revenue.createdBy) {
        if (!stats[revenue.createdBy]) {
          stats[revenue.createdBy] = { shortages: 0, revenues: 0 };
        }
        stats[revenue.createdBy].revenues++;
      }
    });
    
    return Object.entries(stats).map(([name, data]) => ({
      name,
      shortages: data.shortages,
      revenues: data.revenues,
      total: data.shortages + data.revenues
    }));
  }, [medicines, revenues]);

  const chartData = userStats.map(user => ({
    name: user.name,
    النواقص: user.shortages,
    الإيرادات: user.revenues
  }));

  const pieData = userStats.map(user => ({
    name: user.name,
    value: user.total
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const generatePerformanceReport = () => {
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
      doc.setFont('helvetica');
      doc.setFontSize(16);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', 105, 20, { align: 'center' });
      doc.text('صيدلية الترياق الشافي', 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`تقرير أداء الموظفين من ${reportStartDate} إلى ${reportEndDate}`, 105, 40, { align: 'center' });
      doc.text(`Staff Performance Report: ${reportStartDate} to ${reportEndDate}`, 105, 50, { align: 'center' });
      
      // Filter data by date range
      const filteredMedicines = medicines.filter(medicine => {
        if (!medicine.created_at) return false;
        const medicineDate = medicine.created_at.split('T')[0];
        return medicineDate >= reportStartDate && medicineDate <= reportEndDate;
      });
      
      const filteredRevenues = revenues.filter(revenue => 
        revenue.date >= reportStartDate && revenue.date <= reportEndDate
      );
      
      // Recalculate stats for the period
      const periodStats: Record<string, { shortages: number; revenues: number }> = {};
      
      filteredMedicines.forEach(medicine => {
        if (medicine.updatedBy) {
          if (!periodStats[medicine.updatedBy]) {
            periodStats[medicine.updatedBy] = { shortages: 0, revenues: 0 };
          }
          periodStats[medicine.updatedBy].shortages++;
        }
      });
      
      filteredRevenues.forEach(revenue => {
        if (revenue.createdBy) {
          if (!periodStats[revenue.createdBy]) {
            periodStats[revenue.createdBy] = { shortages: 0, revenues: 0 };
          }
          periodStats[revenue.createdBy].revenues++;
        }
      });
      
      let yPosition = 70;
      
      // Headers
      doc.setFontSize(10);
      doc.text('اسم الموظف / Staff Name', 20, yPosition);
      doc.text('النواقص / Shortages', 80, yPosition);
      doc.text('الإيرادات / Revenues', 120, yPosition);
      doc.text('المجموع / Total', 160, yPosition);
      doc.text('التقييم / Rating', 180, yPosition);
      
      yPosition += 10;
      
      Object.entries(periodStats).forEach(([name, data]) => {
        const total = data.shortages + data.revenues;
        const rating = total > 20 ? 'ممتاز/Excellent' : 
                      total > 10 ? 'جيد/Good' : 'متوسط/Average';
        
        doc.text(name, 20, yPosition);
        doc.text(data.shortages.toString(), 80, yPosition);
        doc.text(data.revenues.toString(), 120, yPosition);
        doc.text(total.toString(), 160, yPosition);
        doc.text(rating, 180, yPosition);
        
        yPosition += 8;
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      // Summary
      yPosition += 10;
      doc.setFontSize(12);
      const totalStaff = Object.keys(periodStats).length;
      const totalShortageEntries = Object.values(periodStats).reduce((sum, stat) => sum + stat.shortages, 0);
      const totalRevenueEntries = Object.values(periodStats).reduce((sum, stat) => sum + stat.revenues, 0);
      
      doc.text(`إجمالي الموظفين النشطين / Active Staff: ${totalStaff}`, 20, yPosition);
      yPosition += 8;
      doc.text(`إجمالي سجلات النواقص / Total Shortage Records: ${totalShortageEntries}`, 20, yPosition);
      yPosition += 8;
      doc.text(`إجمالي سجلات الإيرادات / Total Revenue Records: ${totalRevenueEntries}`, 20, yPosition);
      
      doc.save(`staff-performance-report-${reportStartDate}-to-${reportEndDate}.pdf`);
      
      toast({
        title: language === 'ar' ? "تم التصدير" : "Exported",
        description: language === 'ar' ? "تم تصدير تقرير الأداء بنجاح" : "Performance report exported successfully",
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
              <h1 className="text-lg font-bold text-gray-900">تقارير الأداء</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Export Section */}
        <Card className="card-shadow mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 space-x-reverse text-right">
              <Download className="w-6 h-6 text-blue-500" />
              <span>تصدير تقارير PDF</span>
            </CardTitle>
            <CardDescription className="text-right">
              اختر فترة زمنية لتصدير تقرير أداء مفصل
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-4 space-x-reverse">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  من تاريخ
                </label>
                <Input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="text-sm text-right"
                />
              </div>
              
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  إلى تاريخ
                </label>
                <Input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="text-sm text-right"
                />
              </div>
              
              <Button
                onClick={generatePerformanceReport}
                className="pharmacy-gradient text-white"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Statistics Table */}
        <Card className="card-shadow mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 space-x-reverse text-right">
              <Users className="w-6 h-6 text-blue-500" />
              <span>إحصائيات المستخدمين</span>
            </CardTitle>
            <CardDescription className="text-right">
              عرض تفصيلي لأداء كل مستخدم في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 font-medium text-gray-700">اسم المستخدم</th>
                    <th className="py-3 px-4 font-medium text-gray-700">سجلات النواقص</th>
                    <th className="py-3 px-4 font-medium text-gray-700">سجلات الإيرادات</th>
                    <th className="py-3 px-4 font-medium text-gray-700">إجمالي السجلات</th>
                    <th className="py-3 px-4 font-medium text-gray-700">التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((userStat, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{userStat.name}</td>
                      <td className="py-3 px-4">{userStat.shortages}</td>
                      <td className="py-3 px-4">{userStat.revenues}</td>
                      <td className="py-3 px-4 font-semibold">{userStat.total}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          userStat.total > 20 ? 'bg-green-100 text-green-800' :
                          userStat.total > 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {userStat.total > 20 ? 'ممتاز' : userStat.total > 10 ? 'جيد' : 'متوسط'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse text-right">
                <BarChart3 className="w-6 h-6 text-green-500" />
                <span>مخطط الأداء التفصيلي</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="النواقص" fill="#8884d8" />
                    <Bar dataKey="الإيرادات" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse text-right">
                <FileText className="w-6 h-6 text-purple-500" />
                <span>توزيع الأنشطة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="card-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{userStats.length}</p>
                <p className="text-sm text-gray-600">إجمالي المستخدمين النشطين</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{medicines.length}</p>
                <p className="text-sm text-gray-600">إجمالي سجلات النواقص</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{revenues.length}</p>
                <p className="text-sm text-gray-600">إجمالي سجلات الإيرادات</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
