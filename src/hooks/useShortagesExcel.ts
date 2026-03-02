import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Medicine, Supply } from '@/store/pharmacyStore';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export const useShortagesExcel = () => {
  
  const exportMedicinesExcel = async (medicines: Medicine[]) => {
    try {
      // Remove duplicates based on name
      const uniqueMedicines = medicines.reduce((acc, med) => {
        const existingMedicine = acc.find(m => m.name.toLowerCase() === med.name.toLowerCase());
        if (!existingMedicine) {
          acc.push(med);
        }
        return acc;
      }, [] as Medicine[]);

      const data = uniqueMedicines.map((med, index) => ({
        'No.': index + 1,
        'Drug Name': med.name,
        'Description': med.scientific_name || '-',
        'Status': (med as any).is_ordered ? 'Under Order' : '-',
      }));
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 5 },   // No.
        { wch: 30 },  // Drug Name
        { wch: 30 },  // Description
        { wch: 15 },  // Status
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Shortages');
      
      const filename = `medicines-shortages-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      if (Capacitor.isNativePlatform()) {
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        await Filesystem.writeFile({
          path: filename,
          data: excelBuffer,
          directory: Directory.Documents,
        });
        toast.success('تم حفظ ملف Excel في مجلد Documents');
      } else {
        XLSX.writeFile(wb, filename);
        toast.success('تم تصدير ملف Excel بنجاح');
      }
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('حدث خطأ أثناء تصدير ملف Excel');
    }
  };
  
  const exportSuppliesExcel = async (supplies: Supply[]) => {
    try {
      // Remove duplicates based on name
      const uniqueSupplies = supplies.reduce((acc, supply) => {
        const existingSupply = acc.find(s => s.name.toLowerCase() === supply.name.toLowerCase());
        if (!existingSupply) {
          acc.push(supply);
        }
        return acc;
      }, [] as Supply[]);

      const data = uniqueSupplies.map((supply, index) => ({
        'No.': index + 1,
        'Supply Name': supply.name,
        'Notes': supply.notes || '-',
      }));
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 5 },   // No.
        { wch: 35 },  // Supply Name
        { wch: 25 },  // Notes
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Supplies Shortages');
      
      const filename = `supplies-shortages-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      if (Capacitor.isNativePlatform()) {
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        await Filesystem.writeFile({
          path: filename,
          data: excelBuffer,
          directory: Directory.Documents,
        });
        toast.success('تم حفظ ملف Excel في مجلد Documents');
      } else {
        XLSX.writeFile(wb, filename);
        toast.success('تم تصدير ملف Excel بنجاح');
      }
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('حدث خطأ أثناء تصدير ملف Excel');
    }
  };
  
  return { exportMedicinesExcel, exportSuppliesExcel };
};
