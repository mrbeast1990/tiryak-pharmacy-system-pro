import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { ArrowRight, Users, BarChart3, FileText, Download, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { usePDFExport } from '@/hooks/usePDFExport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addArabicFont } from '@/lib/pdf-utils';

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

  const userStats = React.useMemo(() => {
    const stats: Record<string, { shortages: number }> = {};
    medicines.forEach(medicine => {
      if (medicine.updatedBy) {
        const shortageCount = medicine.repeat_count || 1;
        if (!stats[medicine.updatedBy]) {
          stats[medicine.updatedBy] = { shortages: 0 };
        }
        stats[medicine.updatedBy].shortages += shortageCount;
      }
    });
    return Object.entries(stats).map(([name, data]) => ({
      name,
      shortages: data.shortages,
      total: data.shortages
    }));
  }, [medicines]);

  const totalShortages = medicines.reduce((t, m) => t + (m.repeat_count || 1), 0);
  const avgPerformance = userStats.length > 0 ? (totalShortages / userStats.length).toFixed(1) : '0';
  const bestUser = userStats.length > 0 ? userStats.reduce((a, b) => a.total > b.total ? a : b) : null;

  const chartData = userStats.map(u => ({ name: u.name, النواقص: u.shortages }));
  const pieData = userStats.map(u => ({ name: u.name, value: u.total }));
  const COLORS = ['hsl(160, 60%, 45%)', 'hsl(175, 60%, 40%)', 'hsl(40, 90%, 55%)', 'hsl(15, 80%, 55%)', 'hsl(260, 50%, 60%)'];

  const getRating = (total: number) => {
    if (total > 20) return { label: 'ممتاز', cls: 'bg-emerald-100 text-emerald-700' };
    if (total > 10) return { label: 'جيد', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'متوسط', cls: 'bg-red-100 text-red-700' };
  };

  const generatePerformanceReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      toast({ title: "خطأ", description: "يرجى تحديد تاريخ البداية والنهاية", variant: "destructive" });
      return;
    }
    try {
      const doc = new jsPDF();
      await addArabicFont(doc);
      const logoSize = 30;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', (pageWidth / 2) - (logoSize / 2), 15, logoSize, logoSize);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', pageWidth / 2, 55, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.text('Staff Performance Report', pageWidth / 2, 68, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Report Period: ${reportStartDate} to ${reportEndDate}`, pageWidth / 2, 78, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US')}`, pageWidth / 2, 86, { align: 'center' });

      const filteredMedicines = medicines.filter(medicine => {
        if (!medicine.created_at) return false;
        const medicineDate = medicine.created_at.split('T')[0];
        return medicineDate >= reportStartDate && medicineDate <= reportEndDate;
      });

      const periodStats: Record<string, { shortages: number }> = {};
      filteredMedicines.forEach(medicine => {
        if (medicine.updatedBy) {
          const shortageCount = medicine.repeat_count || 1;
          if (!periodStats[medicine.updatedBy]) periodStats[medicine.updatedBy] = { shortages: 0 };
          periodStats[medicine.updatedBy].shortages += shortageCount;
        }
      });

      const head = [['Staff Member', 'Shortage Records', 'Performance Rating']];
      const body = Object.entries(periodStats).map(([name, data]) => {
        const total = data.shortages;
        const rating = total > 20 ? 'Excellent' : total > 10 ? 'Good' : total > 5 ? 'Average' : 'Needs Improvement';
        return [name, total.toString(), rating];
      });

      if (body.length > 0) {
        autoTable(doc, {
          head, body, startY: 100, theme: 'striped',
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 12 },
          styles: { font: 'helvetica', cellPadding: 5, fontSize: 11, halign: 'center' },
          columnStyles: { 0: { halign: 'left' }, 1: { halign: 'center' }, 2: { halign: 'center' } }
        });
      } else {
        doc.setFontSize(14);
        doc.text('No performance data available for the selected period.', pageWidth / 2, 110, { align: 'center' });
      }

      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Summary', 20, finalY + 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const totalStaff = Object.keys(periodStats).length;
      const totalEntries = Object.values(periodStats).reduce((s, st) => s + st.shortages, 0);
      const avg = totalStaff > 0 ? (totalEntries / totalStaff).toFixed(1) : '0';
      doc.text(`• Total Active Staff Members: ${totalStaff}`, 20, finalY + 32);
      doc.text(`• Total Shortage Records Processed: ${totalEntries}`, 20, finalY + 42);
      doc.text(`• Average Records per Staff Member: ${avg}`, 20, finalY + 52);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(10);
      doc.text(`Report generated by: ${user?.name || 'System Admin'}`, 20, pageHeight - 25);
      doc.text(`Date & Time: ${new Date().toLocaleString('en-US')}`, 20, pageHeight - 18);
      doc.text('Authorized Signature: ________________________', 20, pageHeight - 10);
      await exportPDF(doc, `staff-performance-report-${reportStartDate}-to-${reportEndDate}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "خطأ في التصدير", description: "حدث خطأ أثناء تصدير التقرير", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground -mr-2">
              <ArrowRight className="w-5 h-5 ml-1" />
              العودة
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">تقارير الأداء</h1>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-20 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 p-3">
            <Users className="w-5 h-5 mb-1 opacity-90" />
            <p className="text-xs opacity-80">الموظفين النشطين</p>
            <p className="text-2xl font-bold">{userStats.length}</p>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 p-3">
            <AlertTriangle className="w-5 h-5 mb-1 opacity-90" />
            <p className="text-xs opacity-80">إجمالي النواقص</p>
            <p className="text-2xl font-bold">{totalShortages}</p>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 p-3">
            <TrendingUp className="w-5 h-5 mb-1 opacity-90" />
            <p className="text-xs opacity-80">متوسط الأداء</p>
            <p className="text-2xl font-bold">{avgPerformance}</p>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 p-3">
            <Award className="w-5 h-5 mb-1 opacity-90" />
            <p className="text-xs opacity-80">الأفضل أداءً</p>
            <p className="text-lg font-bold truncate">{bestUser?.name || '-'}</p>
          </Card>
        </div>

        {/* PDF Export */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <p className="font-semibold text-sm text-foreground">تصدير تقرير PDF</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">من تاريخ</label>
              <Input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="text-xs h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">إلى تاريخ</label>
              <Input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="text-xs h-9" />
            </div>
          </div>
          <Button onClick={generatePerformanceReport} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            <Download className="w-4 h-4 ml-2" />
            تصدير التقرير
          </Button>
        </Card>

        {/* Performance Table */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              أداء الموظفين
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="py-2.5 px-4 text-right font-medium text-muted-foreground text-xs">الموظف</th>
                    <th className="py-2.5 px-3 text-center font-medium text-muted-foreground text-xs">النواقص</th>
                    <th className="py-2.5 px-3 text-center font-medium text-muted-foreground text-xs">التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((stat, i) => {
                    const rating = getRating(stat.total);
                    return (
                      <tr key={i} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                        <td className="py-2.5 px-4 font-medium text-foreground text-sm">{stat.name}</td>
                        <td className="py-2.5 px-3 text-center text-foreground">{stat.shortages}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rating.cls}`}>
                            {rating.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {userStats.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-muted-foreground text-sm">لا توجد بيانات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm text-foreground">مخطط الأداء</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="النواقص" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm text-foreground">توزيع الأنشطة</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(160, 60%, 45%)"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
