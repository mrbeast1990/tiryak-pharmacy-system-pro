
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
import { usePDFExport } from '@/hooks/usePDFExport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsPageProps {
  onBack: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ onBack }) => {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const { medicines } = usePharmacyStore();
  const { toast } = useToast();
  const { exportPDF } = usePDFExport();
  
  const [reportStartDate, setReportStartDate] = React.useState('');
  const [reportEndDate, setReportEndDate] = React.useState('');

  // Calculate user statistics based only on shortage records
  const userStats = React.useMemo(() => {
    const stats: Record<string, { shortages: number }> = {};
    
    // Only count medicines that are currently in shortage status
    medicines.forEach(medicine => {
      if (medicine.updatedBy && medicine.status === 'shortage') {
        if (!stats[medicine.updatedBy]) {
          stats[medicine.updatedBy] = { shortages: 0 };
        }
        stats[medicine.updatedBy].shortages++;
      }
    });
    
    return Object.entries(stats).map(([name, data]) => ({
      name,
      shortages: data.shortages,
      total: data.shortages
    }));
  }, [medicines]);

  const chartData = userStats.map(user => ({
    name: user.name,
    النواقص: user.shortages,
  }));

  const pieData = userStats.map(user => ({
    name: user.name,
    value: user.total
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const generatePerformanceReport = async () => {
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
      
      // Header with logo
      const logoSize = 30;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', (pageWidth / 2) - (logoSize / 2), 15, logoSize, logoSize);
      
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', pageWidth / 2, 55, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.text('Staff Performance Report', pageWidth / 2, 68, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Report Period: ${reportStartDate} to ${reportEndDate}`, pageWidth / 2, 78, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US')}`, pageWidth / 2, 86, { align: 'center' });
      
      // Filter medicines by date range
      const filteredMedicines = medicines.filter(medicine => {
        if (!medicine.created_at) return false;
        const medicineDate = medicine.created_at.split('T')[0];
        return medicineDate >= reportStartDate && medicineDate <= reportEndDate;
      });
      
      // Calculate period statistics - only count shortage records
      const periodStats: Record<string, { shortages: number }> = {};
      
      filteredMedicines.forEach(medicine => {
        if (medicine.updatedBy && medicine.status === 'shortage') {
          if (!periodStats[medicine.updatedBy]) {
            periodStats[medicine.updatedBy] = { shortages: 0 };
          }
          periodStats[medicine.updatedBy].shortages++;
        }
      });
      
      // Create table data
      const head = [['Staff Member', 'Shortage Records', 'Performance Rating']];
      const body = Object.entries(periodStats).map(([name, data]) => {
          const total = data.shortages;
          const rating = total > 20 ? 'Excellent' : 
                        total > 10 ? 'Good' : 
                        total > 5 ? 'Average' : 'Needs Improvement';
          return [name, total.toString(), rating];
      });

      if (body.length > 0) {
        autoTable(doc, {
            head: head,
            body: body,
            startY: 100,
            theme: 'striped',
            headStyles: { 
              fillColor: [41, 128, 185], 
              textColor: 255, 
              fontStyle: 'bold',
              fontSize: 12
            },
            styles: { 
              font: 'helvetica', 
              cellPadding: 5, 
              fontSize: 11,
              halign: 'center'
            },
            columnStyles: {
              0: { halign: 'left' },
              1: { halign: 'center' },
              2: { halign: 'center' }
            }
        });
      } else {
        doc.setFontSize(14);
        doc.text('No performance data available for the selected period.', pageWidth / 2, 110, { align: 'center' });
      }

      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      
      // Summary section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Summary', 20, finalY + 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const totalStaff = Object.keys(periodStats).length;
      const totalShortageEntries = Object.values(periodStats).reduce((sum, stat) => sum + stat.shortages, 0);
      const avgPerformance = totalStaff > 0 ? (totalShortageEntries / totalStaff).toFixed(1) : '0';
      
      doc.text(`• Total Active Staff Members: ${totalStaff}`, 20, finalY + 32);
      doc.text(`• Total Shortage Records Processed: ${totalShortageEntries}`, 20, finalY + 42);
      doc.text(`• Average Records per Staff Member: ${avgPerformance}`, 20, finalY + 52);
      
      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(10);
      doc.text(`Report generated by: ${user?.name || 'System Admin'}`, 20, pageHeight - 25);
      doc.text(`Date & Time: ${new Date().toLocaleString('en-US')}`, 20, pageHeight - 18);
      doc.text('Authorized Signature: ________________________', 20, pageHeight - 10);

      await exportPDF(doc, `staff-performance-report-${reportStartDate}-to-${reportEndDate}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
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
                    <th className="py-3 px-4 font-medium text-gray-700">التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((userStat, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{userStat.name}</td>
                      <td className="py-3 px-4">{userStat.shortages}</td>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
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
                <p className="text-2xl font-bold text-red-600">{medicines.filter(m => m.status === 'shortage').length}</p>
                <p className="text-sm text-gray-600">إجمالي سجلات النواقص</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
