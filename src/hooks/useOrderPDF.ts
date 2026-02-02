import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addArabicFont } from '@/lib/pdf-utils';
import { OrderProduct } from '@/store/orderBuilderStore';
import { toast } from 'sonner';

interface UseOrderPDFOptions {
  supplierName: string;
  products: OrderProduct[];
}

export const useOrderPDF = () => {
  const generatePDF = useCallback(async ({ supplierName, products }: UseOrderPDFOptions) => {
    // Filter out zero-quantity products
    const selectedProducts = products.filter(p => p.quantity > 0);
    
    if (selectedProducts.length === 0) {
      toast.error('لا توجد أصناف محددة للتصدير');
      return null;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add Arabic font support
    await addArabicFont(doc);
    doc.setFont('Amiri');

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // === Header Section ===
    // Add pharmacy logo
    try {
      const logoImg = new Image();
      logoImg.src = '/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png';
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });
      const logoWidth = 25;
      const logoHeight = 25;
      doc.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, yPos, logoWidth, logoHeight);
      yPos += logoHeight + 5;
    } catch (error) {
      console.warn('Could not load logo:', error);
      yPos += 10;
    }

    // Pharmacy name
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129); // Emerald green
    doc.text('صيدلية الترياق الشافي', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Document title
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('طلب فاتورة شراء', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // === Supplier & Date Section ===
    doc.setFontSize(11);
    const today = new Date().toLocaleDateString('ar-LY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    doc.text(`الشركة الموردة: ${supplierName || 'غير محدد'}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;
    doc.text(`التاريخ: ${today}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 12;

    // === Products Table (LTR Layout) ===
    const tableData = selectedProducts.map((p, index) => [
      (index + 1).toString(),
      p.name,
      p.code || '-',
      p.expiryDate || '-',
      p.price.toFixed(2),
      (p.price * p.quantity).toFixed(2),
    ]);

    const totalAmount = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

    autoTable(doc, {
      head: [['NO', 'ITEM DESCRIPTION', 'CODE', 'EXP', 'PRICE', 'T.PRICE']],
      body: tableData,
      startY: yPos,
      margin: { left: margin, right: margin },
      styles: {
        font: 'Amiri',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [16, 185, 129], // Emerald green
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244], // Light green
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 12 },      // NO
        1: { halign: 'left', cellWidth: 'auto' },  // ITEM DESCRIPTION
        2: { halign: 'center', cellWidth: 20 },    // CODE
        3: { halign: 'center', cellWidth: 22 },    // EXP
        4: { halign: 'center', cellWidth: 22 },    // PRICE
        5: { halign: 'center', cellWidth: 25 },    // T.PRICE
      },
    });

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;
    yPos = finalY + 10;

    // === Total Section ===
    doc.setFillColor(16, 185, 129);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(`الإجمالي الكلي: ${totalAmount.toFixed(2)} د.ل`, pageWidth / 2, yPos + 8, { align: 'center' });
    yPos += 20;

    // === Footer / WhatsApp Notice (LTR, Red, Bold) ===
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 25;
    
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38); // Red color (#DC2626)
    doc.setFont('Amiri', 'bold');
    
    // WhatsApp icon + number (left aligned)
    doc.text('0915938155', margin, footerY, { align: 'left' });
    
    // Arabic text (right-aligned for proper RTL display)
    doc.text(
      'الرجاء ارسال نسخه PDF من الفاتورة عند صدورها مباشراً عبر واتس اب',
      pageWidth - margin, 
      footerY, 
      { align: 'right' }
    );

    // Generate filename
    const filename = `طلبية-${supplierName || 'شراء'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    doc.save(filename);

    toast.success('تم توليد الطلبية بنجاح');
    
    return filename;
  }, []);

  const shareViaWhatsApp = useCallback((supplierName: string) => {
    const message = encodeURIComponent(
      `مرفق طلبية شراء من صيدلية الترياق الشافي - ${supplierName || 'طلبية جديدة'}`
    );
    const whatsappUrl = `https://wa.me/218915938155?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }, []);

  return { generatePDF, shareViaWhatsApp };
};
