import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, FileText, BarChart3, DollarSign, Building2, TrendingUp, Calendar } from 'lucide-react';
import { Revenue } from '@/store/pharmacyStore';
import { useRevenueExcel } from '@/hooks/useRevenueExcel';
import { useRevenuePDF } from '@/hooks/revenue/useRevenuePDF';

interface RevenueReportSheetProps {
  revenues: Revenue[];
  children: React.ReactNode;
}

const periodNames: Record<string, string> = {
  morning: 'صباحية',
  evening: 'مسائية',
  night: 'ليلية',
  ahmad_rajili: 'احمد الرجيلي',
  abdulwahab: 'عبدالوهاب',
};

const RevenueReportSheet: React.FC<RevenueReportSheetProps> = ({ revenues, children }) => {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);

  const { generateRevenueExcel } = useRevenueExcel();
  const { generatePeriodReport } = useRevenuePDF();

  const filtered = useMemo(() => {
    return revenues.filter(r => r.date >= startDate && r.date <= endDate);
  }, [revenues, startDate, endDate]);

  const totalCash = useMemo(() => filtered.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0), [filtered]);
  const totalServices = useMemo(() => filtered.filter(r => r.type === 'banking_services').reduce((s, r) => s + r.amount, 0), [filtered]);
  const grandTotal = totalCash + totalServices;

  const periodStats = useMemo(() => {
    const periods = ['morning', 'evening', 'night', 'ahmad_rajili', 'abdulwahab'];
    return periods.map(p => {
      const periodRevs = filtered.filter(r => r.period === p);
      const cash = periodRevs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const services = periodRevs.filter(r => r.type === 'banking_services').reduce((s, r) => s + r.amount, 0);
      return { period: p, name: periodNames[p], cash, services, total: cash + services };
    }).filter(p => p.total > 0);
  }, [filtered]);

  const serviceBreakdown = useMemo(() => {
    const serviceRevs = filtered.filter(r => r.type === 'banking_services' && r.service_name);
    const grouped = serviceRevs.reduce((acc, r) => {
      const name = r.service_name || 'أخرى';
      if (!acc[name]) acc[name] = { count: 0, total: 0 };
      acc[name].count++;
      acc[name].total += r.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);
    return Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
  }, [filtered]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl overflow-y-auto" dir="rtl">
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="text-right flex items-center justify-end gap-2">
            <span>تقارير الإيرادات</span>
            <BarChart3 className="w-5 h-5 text-primary" />
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-4 pb-8">
          {/* Date Range */}
          <Card className="bg-card border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-end gap-2 mb-3">
                <span className="text-sm font-semibold text-foreground">تحديد الفترة</span>
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground text-right block">من</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs text-right h-9 border-border/50 bg-muted/30 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground text-right block">إلى</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs text-right h-9 border-border/50 bg-muted/30 rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="bg-card border-0 shadow-sm rounded-xl overflow-hidden">
              <div className="flex h-full">
                <div className="w-1 bg-green-500" />
                <CardContent className="p-3 flex-1 text-center">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-[10px] text-muted-foreground block">كاش</span>
                  <span className="text-sm font-bold text-green-600">{totalCash.toFixed(0)}</span>
                </CardContent>
              </div>
            </Card>
            <Card className="bg-card border-0 shadow-sm rounded-xl overflow-hidden">
              <div className="flex h-full">
                <div className="w-1 bg-blue-500" />
                <CardContent className="p-3 flex-1 text-center">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-[10px] text-muted-foreground block">خدمات</span>
                  <span className="text-sm font-bold text-blue-600">{totalServices.toFixed(0)}</span>
                </CardContent>
              </div>
            </Card>
            <Card className="bg-card border-0 shadow-sm rounded-xl overflow-hidden">
              <div className="flex h-full">
                <div className="w-1 bg-primary" />
                <CardContent className="p-3 flex-1 text-center">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground block">إجمالي</span>
                  <span className="text-sm font-bold text-primary">{grandTotal.toFixed(0)}</span>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Period Comparison */}
          {periodStats.length > 0 && (
            <Card className="bg-card border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground text-right mb-3 flex items-center justify-end gap-2">
                  <span>مقارنة الفترات</span>
                  <BarChart3 className="w-4 h-4 text-primary" />
                </h3>
                <div className="space-y-2">
                  {periodStats.map(p => {
                    const percentage = grandTotal > 0 ? (p.total / grandTotal) * 100 : 0;
                    return (
                      <div key={p.period} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{p.total.toFixed(0)} د</span>
                          <span className="text-muted-foreground">{p.name}</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{percentage.toFixed(0)}%</span>
                          <span>كاش: {p.cash.toFixed(0)} | خدمات: {p.services.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Banking Service Breakdown */}
          {serviceBreakdown.length > 0 && (
            <Card className="bg-card border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground text-right mb-3 flex items-center justify-end gap-2">
                  <span>تفاصيل الخدمات المصرفية</span>
                  <Building2 className="w-4 h-4 text-blue-500" />
                </h3>
                <div className="space-y-2">
                  {serviceBreakdown.map(([name, data]) => (
                    <div key={name} className="flex items-center justify-between bg-muted/30 rounded-lg p-2.5">
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">{data.total.toFixed(0)} د</span>
                        <span className="text-[10px] text-muted-foreground mr-1">({data.count} معاملة)</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => generateRevenueExcel(revenues, startDate, endDate)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold h-12 rounded-xl shadow-md"
            >
              <FileSpreadsheet className="w-5 h-5 ml-2" />
              تصدير Excel
            </Button>
            <Button
              onClick={() => generatePeriodReport(startDate, endDate, revenues)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold h-12 rounded-xl shadow-md"
            >
              <FileText className="w-5 h-5 ml-2" />
              تصدير PDF
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RevenueReportSheet;
