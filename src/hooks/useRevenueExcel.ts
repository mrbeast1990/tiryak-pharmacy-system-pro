import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Revenue } from '@/store/pharmacyStore';

export const useRevenueExcel = () => {
  const generateRevenueExcel = (
    revenues: Revenue[],
    startDate: string,
    endDate: string
  ) => {
    const filtered = revenues.filter(r => r.date >= startDate && r.date <= endDate);

    if (filtered.length === 0) {
      toast.error('لا توجد إيرادات في الفترة المحددة');
      return;
    }

    try {
      // Group by date
      const byDate = filtered.reduce((acc, r) => {
        if (!acc[r.date]) acc[r.date] = [];
        acc[r.date].push(r);
        return acc;
      }, {} as Record<string, Revenue[]>);

      // Daily summary sheet
      const dailySummary = Object.keys(byDate).sort().map(date => {
        const dayRevs = byDate[date];
        const cash = dayRevs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
        const services = dayRevs.filter(r => r.type === 'banking_services').reduce((s, r) => s + r.amount, 0);
        return {
          'التاريخ': date,
          'كاش (د.ل)': cash,
          'خدمات مصرفية (د.ل)': services,
          'الإجمالي (د.ل)': cash + services,
        };
      });

      const totalCash = filtered.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const totalServices = filtered.filter(r => r.type === 'banking_services').reduce((s, r) => s + r.amount, 0);
      dailySummary.push({
        'التاريخ': 'الإجمالي',
        'كاش (د.ل)': totalCash,
        'خدمات مصرفية (د.ل)': totalServices,
        'الإجمالي (د.ل)': totalCash + totalServices,
      });

      // Period comparison sheet
      const periods = ['morning', 'evening', 'night', 'ahmad_rajili', 'abdulwahab'];
      const periodNames: Record<string, string> = {
        morning: 'صباحية',
        evening: 'مسائية',
        night: 'ليلية',
        ahmad_rajili: 'احمد الرجيلي',
        abdulwahab: 'عبدالوهاب',
      };

      const periodComparison = periods.map(p => {
        const periodRevs = filtered.filter(r => r.period === p);
        const cash = periodRevs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
        const services = periodRevs.filter(r => r.type === 'banking_services').reduce((s, r) => s + r.amount, 0);
        return {
          'الفترة': periodNames[p] || p,
          'كاش (د.ل)': cash,
          'خدمات مصرفية (د.ل)': services,
          'الإجمالي (د.ل)': cash + services,
          'عدد الأيام': new Set(periodRevs.map(r => r.date)).size,
        };
      }).filter(p => p['الإجمالي (د.ل)'] > 0);

      // Banking details sheet
      const bankingDetails = filtered
        .filter(r => r.type === 'banking_services')
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(r => ({
          'التاريخ': r.date,
          'الفترة': periodNames[r.period] || r.period,
          'الخدمة': r.service_name || '-',
          'المبلغ (د.ل)': r.amount,
          'بواسطة': r.createdBy,
        }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.json_to_sheet(dailySummary);
      ws1['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'ملخص يومي');

      const ws2 = XLSX.utils.json_to_sheet(periodComparison);
      ws2['!cols'] = [{ wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'مقارنة الفترات');

      if (bankingDetails.length > 0) {
        const ws3 = XLSX.utils.json_to_sheet(bankingDetails);
        ws3['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'تفاصيل الخدمات');
      }

      const filename = `revenue-report-${startDate}-to-${endDate}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Excel generation error:', error);
      toast.error('حدث خطأ أثناء إنشاء التقرير');
    }
  };

  return { generateRevenueExcel };
};
