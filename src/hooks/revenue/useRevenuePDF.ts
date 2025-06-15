import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/store/languageStore';
import { Revenue } from '@/store/pharmacyStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const useRevenuePDF = () => {
  const { language } = useLanguageStore();
  const { toast } = useToast();

  const generatePeriodReport = async (reportStartDate: string, reportEndDate: string, revenues: Revenue[]) => {
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
      
      const logoSize = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', (pageWidth / 2) - (logoSize/2), 10, logoSize, logoSize);
      
      doc.setFontSize(18);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', pageWidth / 2, 60, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Revenue Report', pageWidth / 2, 70, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Period: ${reportStartDate} - ${reportEndDate}`, pageWidth / 2, 80, { align: 'center' });
      
      const periodRevenuesData = revenues.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
      
      const revenuesByDate = periodRevenuesData.reduce((acc, revenue) => {
        if (!acc[revenue.date]) acc[revenue.date] = [];
        acc[revenue.date].push(revenue);
        return acc;
      }, {} as Record<string, Revenue[]>);
      
      const head = [['Date', 'Period', 'Amount (LYD)', 'Notes']];
      const body: any[] = [];
      let totalRevenue = 0;

      Object.keys(revenuesByDate).sort().forEach(date => {
        const dayRevenues = revenuesByDate[date];
        let dailyTotalRevenue = 0;
        
        dayRevenues.forEach((revenue, index) => {
          const periodText = revenue.period === 'morning' ? 'Morning' : 
                            revenue.period === 'evening' ? 'Evening' : 
                            revenue.period === 'night' ? 'Night' : 'Ahmad Rajili';
          
          const amount = revenue.type === 'income' ? revenue.amount : -revenue.amount;
          
          dailyTotalRevenue += amount;
          totalRevenue += amount;

          let noteText = (revenue.notes || '').replace('- Income', '').replace('- Cash Disbursement', '').trim();
          
          noteText = noteText.replace(/[^\x00-\x7F]+/g, '').trim() || '-';
          
          body.push([
            index === 0 ? date : '',
            periodText,
            amount.toFixed(2),
            noteText
          ]);
        });
        
        if (dayRevenues.length > 0) {
          body.push([
            { content: 'Daily Total:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: dailyTotalRevenue.toFixed(2), styles: { fontStyle: 'bold' } },
            ''
          ]);
        }
      });

      autoTable(doc, {
        head: head,
        body: body,
        startY: 90,
        theme: 'grid',
        headStyles: { fillColor: [70, 130, 180], textColor: 255, font: 'helvetica', fontStyle: 'bold' },
        styles: { font: 'helvetica', cellPadding: 3, fontSize: 9 },
        columnStyles: { 3: { cellWidth: 'auto' } },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 100;
      
      doc.setFontSize(14);
      doc.setFillColor(34, 139, 34);
      doc.rect(20, finalY + 10, pageWidth - 40, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`Total Net Revenue: ${totalRevenue.toFixed(2)} LYD`, pageWidth / 2, finalY + 17, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US')}, ${new Date().toLocaleTimeString('en-US')}`, pageWidth / 2, finalY + 35, { align: 'center' });
      doc.text('Manager: ________________', pageWidth / 2, finalY + 45, { align: 'center' });
      
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

  return { generatePeriodReport };
};
