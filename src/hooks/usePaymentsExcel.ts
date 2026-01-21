import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Payment } from '@/store/paymentsStore';

export const usePaymentsExcel = () => {
  const generatePaymentsExcel = (payments: Payment[]) => {
    if (payments.length === 0) {
      toast.error('لا توجد سدادات للتصدير');
      return;
    }

    try {
      // Prepare data for Excel
      const data = payments.map((payment) => ({
        'الشركة': payment.company_name,
        'المبلغ (د.ل)': Number(payment.amount),
        'التاريخ': format(parseISO(payment.payment_date), 'yyyy/MM/dd'),
        'النوع': payment.payment_type === 'cash' ? 'كاش' : 'مصرف',
        'ملاحظات': payment.notes || '-',
        'حالة الخصم': payment.is_deducted ? 'تم الخصم' : 'لم يُخصم',
        'تاريخ الخصم': payment.deducted_at 
          ? format(parseISO(payment.deducted_at), 'yyyy/MM/dd HH:mm') 
          : '-',
        'خُصم بواسطة': payment.deducted_by_name || '-',
        'تاريخ التسجيل': format(parseISO(payment.created_at), 'yyyy/MM/dd HH:mm'),
        'سُجل بواسطة': payment.created_by_name,
      }));

      // Calculate totals
      const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const deductedAmount = payments.filter(p => p.is_deducted).reduce((sum, p) => sum + Number(p.amount), 0);
      const undeductedAmount = payments.filter(p => !p.is_deducted).reduce((sum, p) => sum + Number(p.amount), 0);

      // Add summary row
      data.push({
        'الشركة': '',
        'المبلغ (د.ل)': 0,
        'التاريخ': '',
        'النوع': '',
        'ملاحظات': '',
        'حالة الخصم': '',
        'تاريخ الخصم': '',
        'خُصم بواسطة': '',
        'تاريخ التسجيل': '',
        'سُجل بواسطة': '',
      });
      
      data.push({
        'الشركة': 'الإجمالي',
        'المبلغ (د.ل)': totalAmount,
        'التاريخ': '',
        'النوع': '',
        'ملاحظات': `مخصوم: ${deductedAmount} | غير مخصوم: ${undeductedAmount}`,
        'حالة الخصم': '',
        'تاريخ الخصم': '',
        'خُصم بواسطة': '',
        'تاريخ التسجيل': '',
        'سُجل بواسطة': '',
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      ws['!cols'] = [
        { wch: 25 }, // الشركة
        { wch: 15 }, // المبلغ
        { wch: 12 }, // التاريخ
        { wch: 10 }, // النوع
        { wch: 30 }, // ملاحظات
        { wch: 12 }, // حالة الخصم
        { wch: 18 }, // تاريخ الخصم
        { wch: 15 }, // خُصم بواسطة
        { wch: 18 }, // تاريخ التسجيل
        { wch: 15 }, // سُجل بواسطة
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'السدادات');

      // Generate filename and save
      const filename = `payments-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Excel generation error:', error);
      toast.error('حدث خطأ أثناء إنشاء التقرير');
    }
  };

  return { generatePaymentsExcel };
};
