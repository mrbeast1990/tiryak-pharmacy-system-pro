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

// Load letterhead image
const loadLetterhead = async (): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Could not load letterhead');
      resolve(null);
    };
    img.src = '/images/letterhead-tiryaq.jpg';
  });
};

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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // Letterhead margins
    const headerMargin = 45; // Space for letterhead header
    const footerMargin = 30; // Space for letterhead footer

    // Load and add letterhead background
    const letterhead = await loadLetterhead();
    
    const addLetterheadBackground = () => {
      if (letterhead) {
        doc.addImage(letterhead, 'JPEG', 0, 0, pageWidth, pageHeight);
      }
    };

    // Add letterhead to first page
    addLetterheadBackground();

    // Starting position after letterhead header
    let yPos = headerMargin;

    // === Supplier & Date Section ===
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const today = new Date().toLocaleDateString('ar-LY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    doc.text(`الشركة الموردة: ${supplierName || 'غير محدد'}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;
    doc.text(`التاريخ: ${today}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

    // === Products Table (LTR Layout) ===
    const tableData = selectedProducts.map((p, index) => [
      (index + 1).toString(),
      p.code || '-',
      p.name, // Full name with text wrap
      p.expiryDate || '-',
      p.price.toFixed(2),
      (p.price * p.quantity).toFixed(2),
    ]);

    const totalAmount = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

    // Track page additions for letterhead
    let currentPage = 1;
    
    autoTable(doc, {
      head: [['NO', 'CODE', 'ITEM DESCRIPTION', 'EXP', 'PRICE', 'T.PRICE']],
      body: tableData,
      startY: yPos,
      margin: { left: margin, right: margin, bottom: footerMargin + 15 },
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
        0: { halign: 'center', cellWidth: 10 },   // NO (~5%)
        1: { halign: 'center', cellWidth: 18 },   // CODE (~10%)
        2: { halign: 'left', cellWidth: 'auto' }, // ITEM DESCRIPTION - auto width with wrap
        3: { halign: 'center', cellWidth: 20 },   // EXP (~10%)
        4: { halign: 'center', cellWidth: 18 },   // PRICE (~10%)
        5: { halign: 'center', cellWidth: 20 },   // T.PRICE (~10%)
      },
      // Add letterhead to new pages
      didDrawPage: (data) => {
        const pageNumber = doc.getNumberOfPages();
        if (pageNumber > currentPage) {
          currentPage = pageNumber;
          addLetterheadBackground();
        }
      },
    });

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;
    yPos = finalY + 8;

    // Check if we need a new page for the total section
    if (yPos + 30 > pageHeight - footerMargin) {
      doc.addPage();
      addLetterheadBackground();
      yPos = headerMargin;
    }

    // === Total Section ===
    doc.setFillColor(16, 185, 129);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(`الإجمالي الكلي: ${totalAmount.toFixed(2)} د.ل`, pageWidth / 2, yPos + 8, { align: 'center' });
    yPos += 18;

    // === WhatsApp Notice (Red, Bold, below total) ===
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38); // Red color (#DC2626)
    doc.setFont('Amiri', 'bold');
    
    // Single line LTR: WhatsApp number + Arabic text
    const noteText = '0915938155  الرجاء ارسال نسخه PDF من الفاتورة عند صدورها مباشراً عبر واتس اب';
    doc.text(noteText, margin, yPos, { align: 'left' });

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
