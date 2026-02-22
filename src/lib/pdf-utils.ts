import jsPDF from 'jspdf';

let arabicFontBase64: string | null = null;

/**
 * Load Arabic font (Amiri) from file and convert to base64
 */
async function loadArabicFont(): Promise<string> {
  if (arabicFontBase64) {
    return arabicFontBase64;
  }

  try {
    const response = await fetch('/fonts/Amiri-Regular.ttf');
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        arabicFontBase64 = base64String;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading Arabic font:', error);
    throw error;
  }
}

/**
 * Add Arabic font support to jsPDF document
 * This function loads the Amiri font and configures it for use with Arabic text
 * 
 * @param doc - The jsPDF document instance
 * @returns Promise that resolves when font is added
 */
export async function addArabicFont(doc: jsPDF): Promise<void> {
  try {
    const fontBase64 = await loadArabicFont();
    
    // Add the font to jsPDF's virtual file system
    doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
    
    // Register the font with jsPDF (normal + bold using same file)
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Regular.ttf", "Amiri", "bold");
    
    // Set the font as active
    doc.setFont("Amiri");
  } catch (error) {
    console.error('Error adding Arabic font to PDF:', error);
    // Fallback to default font if Arabic font fails
    doc.setFont("helvetica");
  }
}

/**
 * Helper function to add text with proper RTL (right-to-left) alignment
 * Use this for Arabic text in PDFs
 * 
 * @param doc - The jsPDF document instance
 * @param text - The text to add
 * @param x - X coordinate (for RTL, this should be the right edge)
 * @param y - Y coordinate
 * @param options - Additional text options
 */
export function addRTLText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: { align?: 'left' | 'center' | 'right' }
) {
  doc.text(text, x, y, { 
    align: options?.align || 'right',
    ...options 
  });
}
