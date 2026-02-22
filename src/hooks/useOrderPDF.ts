import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addArabicFont } from '@/lib/pdf-utils';
import { OrderProduct } from '@/store/orderBuilderStore';
import { toast } from 'sonner';

interface UseOrderPDFOptions {
  supplierName: string;
  supplierPhone: string;
  products: OrderProduct[];
}

// Helper: convert number to Arabic words
const numberToArabicWords = (num: number): string => {
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  const thousands = ['', 'ألف', 'ألفان', 'ثلاثة آلاف', 'أربعة آلاف', 'خمسة آلاف', 'ستة آلاف', 'سبعة آلاف', 'ثمانية آلاف', 'تسعة آلاف'];

  if (num === 0) return 'صفر';

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  let result = '';

  const th = Math.floor(intPart / 1000);
  const h = Math.floor((intPart % 1000) / 100);
  const t = Math.floor((intPart % 100) / 10);
  const o = intPart % 10;

  if (th > 0) result += thousands[th] + ' و ';
  if (h > 0) result += hundreds[h] + ' و ';
  if (t > 1) {
    if (o > 0) result += ones[o] + ' و ';
    result += tens[t];
  } else if (t === 1) {
    if (o === 0) result += 'عشرة';
    else result += ones[o] + ' عشر';
  } else if (o > 0) {
    result += ones[o];
  }

  result = result.replace(/ و $/, '');

  if (decPart > 0) {
    result += ` و ${decPart}/100`;
  }

  return result + ' دينار ليبي';
};

// Load logo image
const loadLogo = async (): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Could not load logo');
      resolve(null);
    };
    img.src = '/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png';
  });
};

export const useOrderPDF = () => {
  const generatePDF = useCallback(async ({ supplierName, supplierPhone, products }: UseOrderPDFOptions) => {
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

    await addArabicFont(doc);
    doc.setFont('Amiri');

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // === LOGO ===
    const logo = await loadLogo();
    let yPos = 15;
    
    if (logo) {
      const logoW = 25;
      const logoH = 25;
      doc.addImage(logo, 'PNG', (pageWidth - logoW) / 2, yPos, logoW, logoH);
      yPos += logoH + 3;
    }

    // === Pharmacy Name (Title) ===
    doc.setFontSize(20);
    doc.setTextColor(16, 120, 96); // Teal
    doc.text('صيدلية الترياق الشافي', pageWidth / 2, yPos + 7, { align: 'center' });
    yPos += 12;

    // === Pharmacy Info ===
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('هاتف: 0915938155', pageWidth / 2, yPos + 5, { align: 'center' });
    yPos += 10;

    // === Divider ===
    doc.setDrawColor(16, 120, 96);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // === Supplier Info + Date ===
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const today = new Date().toLocaleDateString('ar-LY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.text(`الشركة الموردة: ${supplierName || 'غير محدد'}`, pageWidth - margin, yPos, { align: 'right' });
    doc.text(`التاريخ: ${today}`, margin, yPos, { align: 'left' });
    yPos += 7;

    if (supplierPhone) {
      doc.text(`هاتف الشركة: ${supplierPhone}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
    }

    yPos += 3;

    // === Products Table ===
    const tableData = selectedProducts.map((p, index) => [
      (index + 1).toString(),
      p.code || '-',
      p.name,
      p.expiryDate || '-',
      p.price.toFixed(2),
      (p.price * p.quantity).toFixed(2),
    ]);

    const totalAmount = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

    autoTable(doc, {
      head: [['ر.م', 'الكود', 'اسم الصنف', 'الصلاحية', 'السعر', 'الإجمالي']],
      body: tableData,
      startY: yPos,
      margin: { left: margin, right: margin, bottom: 40 },
      styles: {
        font: 'Amiri',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [16, 120, 96],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'right', cellWidth: 'auto' },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 22 },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;
    yPos = finalY + 5;

    // === Total Box ===
    const pageHeight = doc.internal.pageSize.getHeight();
    if (yPos + 40 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    // Total in numbers
    doc.setFillColor(16, 120, 96);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 14, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`الإجمالي الكلي: ${totalAmount.toFixed(2)} د.ل`, pageWidth / 2, yPos + 9, { align: 'center' });
    yPos += 18;

    // Total in words
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const totalInWords = numberToArabicWords(totalAmount);
    doc.text(`فقط ${totalInWords} لا غير`, pageWidth / 2, yPos + 3, { align: 'center' });
    yPos += 14;

    // === Red Notice ===
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);
    doc.setFont('Amiri', 'bold');
    
    const noticeLines = doc.splitTextToSize(
      'الرجاء ارسال نسخة من الفاتورة عند اصدارها عبر واتس اب 0915938155',
      pageWidth - 2 * margin
    );
    doc.text(noticeLines, pageWidth / 2, yPos, { align: 'center' });

    // Generate filename
    const filename = `طلبية-${supplierName || 'شراء'}-${new Date().toISOString().split('T')[0]}.pdf`;
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
