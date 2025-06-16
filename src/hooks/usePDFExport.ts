
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/store/languageStore';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import jsPDF from 'jspdf';

export const usePDFExport = () => {
  const { language } = useLanguageStore();
  const { toast } = useToast();

  const exportPDF = async (doc: jsPDF, filename: string) => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Mobile platform - use Capacitor Filesystem
        const pdfData = doc.output('dataurlstring');
        const base64Data = pdfData.split(',')[1];

        const result = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        toast({
          title: language === 'ar' ? "تم التصدير" : "Exported",
          description: language === 'ar' ? 
            `تم حفظ الملف في: Documents/${filename}` : 
            `File saved to: Documents/${filename}`,
        });

        console.log('PDF saved to:', result.uri);
      } else {
        // Web platform - use traditional download
        doc.save(filename);
        
        toast({
          title: language === 'ar' ? "تم التصدير" : "Exported",
          description: language === 'ar' ? "تم تحميل الملف" : "File downloaded",
        });
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: language === 'ar' ? "خطأ في التصدير" : "Export Error",
        description: language === 'ar' ? 
          "حدث خطأ أثناء تصدير الملف" : 
          "Error occurred while exporting file",
        variant: "destructive",
      });
    }
  };

  return { exportPDF };
};
