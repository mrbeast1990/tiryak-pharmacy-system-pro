
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/store/languageStore';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import jsPDF from 'jspdf';

export const usePDFExport = () => {
  const { language } = useLanguageStore();
  const { toast } = useToast();

  const exportPDF = async (doc: jsPDF, filename: string) => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Mobile platform - use Capacitor Filesystem
        console.log('Starting PDF export on mobile...');
        
        const pdfArrayBuffer = doc.output('arraybuffer');
        const base64Data = btoa(
          new Uint8Array(pdfArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        console.log('PDF converted to base64, size:', base64Data.length);
        
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents
          // Removed encoding parameter as it's not needed for base64 data
        });

        console.log('PDF saved successfully:', result.uri);

        toast({
          title: language === 'ar' ? "تم التصدير" : "Exported",
          description: language === 'ar' ? 
            `تم حفظ الملف في: Documents/${filename}` : 
            `File saved to: Documents/${filename}`,
        });

        // Try to open the file
        try {
          console.log('Attempting to open PDF file...');
          await FileOpener.open({
            filePath: result.uri,
            contentType: 'application/pdf'
          });
          console.log('PDF opened successfully');
        } catch (openError) {
          console.log('Could not open file directly:', openError);
          // Show additional message about manual opening
          toast({
            title: language === 'ar' ? "ملاحظة" : "Note",
            description: language === 'ar' ? 
              "يمكنك العثور على الملف في مجلد المستندات" : 
              "You can find the file in Documents folder",
          });
        }
      } else {
        // Web platform - use traditional download
        console.log('Exporting PDF on web platform...');
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
