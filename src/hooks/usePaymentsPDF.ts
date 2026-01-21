import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { Payment } from '@/store/paymentsStore';
import { addArabicFont, addRTLText } from '@/lib/pdf-utils';
import { usePDFExport } from '@/hooks/usePDFExport';

export const usePaymentsPDF = () => {
  const { exportPDF } = usePDFExport();

  const generatePaymentsReport = async (
    payments: Payment[],
    filters: {
      company?: string | null;
      dateFilter?: string;
      showUndeductedOnly?: boolean;
    }
  ) => {
    if (payments.length === 0) {
      toast.error('لا توجد سدادات للتصدير');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      await addArabicFont(doc);

      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // العنوان
      addRTLText(doc, 'تقرير السدادات - صيدلية الترياق الشافي', pageWidth - 15, yPos, { align: 'right' });
      yPos += 10;

      // معلومات التصفية
      doc.setFontSize(10);
      const filterInfo: string[] = [];
      
      if (filters.company) {
        filterInfo.push(`الشركة: ${filters.company}`);
      }
      if (filters.dateFilter && filters.dateFilter !== 'all') {
        const dateLabels: Record<string, string> = {
          today: 'اليوم',
          week: 'هذا الأسبوع',
          month: 'هذا الشهر',
        };
        filterInfo.push(`الفترة: ${dateLabels[filters.dateFilter] || 'الكل'}`);
      }
      if (filters.showUndeductedOnly) {
        filterInfo.push('غير المخصومة فقط');
      }
      
      if (filterInfo.length > 0) {
        addRTLText(doc, filterInfo.join(' | '), pageWidth - 15, yPos, { align: 'right' });
        yPos += 8;
      }

      addRTLText(doc, `تاريخ التقرير: ${format(new Date(), 'yyyy/MM/dd HH:mm', { locale: ar })}`, pageWidth - 15, yPos, { align: 'right' });
      yPos += 15;

      // الجدول
      const tableData = payments.map((payment) => [
        payment.is_deducted ? '✓' : '✗',
        payment.notes || '-',
        payment.payment_type === 'cash' ? 'كاش' : 'مصرف',
        format(parseISO(payment.payment_date), 'yyyy/MM/dd'),
        Number(payment.amount).toLocaleString('ar-LY'),
        payment.company_name,
      ]);

      autoTable(doc, {
        head: [['الحالة', 'ملاحظات', 'النوع', 'التاريخ', 'المبلغ (د.ل)', 'الشركة']],
        body: tableData,
        startY: yPos,
        styles: {
          font: 'Amiri',
          fontSize: 9,
          halign: 'right',
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [16, 185, 129], // Emerald-500
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [240, 253, 244], // Emerald-50
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          1: { cellWidth: 40 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'right', cellWidth: 30 },
          5: { halign: 'right', cellWidth: 40 },
        },
      });

      // الإجماليات
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const deductedAmount = payments.filter(p => p.is_deducted).reduce((sum, p) => sum + Number(p.amount), 0);
      const undeductedAmount = payments.filter(p => !p.is_deducted).reduce((sum, p) => sum + Number(p.amount), 0);

      doc.setFontSize(11);
      addRTLText(doc, `إجمالي السدادات: ${totalAmount.toLocaleString('ar-LY')} د.ل`, pageWidth - 15, finalY, { align: 'right' });
      addRTLText(doc, `المبالغ المخصومة: ${deductedAmount.toLocaleString('ar-LY')} د.ل`, pageWidth - 15, finalY + 7, { align: 'right' });
      addRTLText(doc, `المبالغ غير المخصومة: ${undeductedAmount.toLocaleString('ar-LY')} د.ل`, pageWidth - 15, finalY + 14, { align: 'right' });

      // التصدير
      const filename = `payments-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      await exportPDF(doc, filename);
      
      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('حدث خطأ أثناء إنشاء التقرير');
    }
  };

  return { generatePaymentsReport };
};
