
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageState {
  language: 'ar' | 'en';
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  ar: {
    // Header
    'pharmacy.name': 'الترياق الشافي',
    'logout': 'تسجيل الخروج',
    'welcome': 'مرحباً،',
    
    // Dashboard
    'dashboard.shortages': 'النواقص',
    'dashboard.available': 'المتوفر',
    'dashboard.todayRevenue': 'إيراد اليوم',
    'dashboard.totalRevenues': 'إجمالي الإيرادات',
    'dashboard.registerShortage': 'تسجيل نواقص الأدوية',
    'dashboard.registerRevenue': 'تسجيل الإيرادات',
    'dashboard.reports': 'التقارير',
    'dashboard.exportUserReport': 'تصدير تقرير أداء المستخدمين',
    
    // Shortages
    'shortages.title': 'إدارة نواقص الأدوية',
    'shortages.addShortage': 'إضافة دواء ناقص',
    'shortages.medicineName': 'اسم الدواء',
    'shortages.notes': 'ملاحظات (اختياري)',
    'shortages.addMedicine': 'إضافة الدواء',
    'shortages.provided': 'تم توفيره',
    'shortages.outOfStock': 'نفد',
    'shortages.exportPdf': 'تصدير PDF',
    'shortages.repeated': 'مكرر',
    
    // Revenue
    'revenue.title': 'إدارة الإيرادات',
    'revenue.date': 'التاريخ',
    'revenue.shift': 'الفترة',
    'revenue.revenue': 'الإيراد',
    'revenue.notes': 'ملاحظات',
    'revenue.totalByShift': 'إجمالي الفترة',
    'revenue.dailyTotal': 'إجمالي اليوم',
    'revenue.exportReport': 'تصدير تقرير فترة محددة',
    
    // Shifts
    'shift.morning': 'صباحية',
    'shift.evening': 'مسائية', 
    'shift.night': 'ليلية',
    'shift.ahmad': 'أحمد الرجيلي',
    
    // Common
    'back': 'العودة للرئيسية',
    'edit': 'تعديل',
    'delete': 'حذف',
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'language': 'English'
  },
  en: {
    // Header
    'pharmacy.name': 'Al-Tiryak Al-Shafi',
    'logout': 'Logout',
    'welcome': 'Welcome,',
    
    // Dashboard
    'dashboard.shortages': 'Shortages',
    'dashboard.available': 'Available',
    'dashboard.todayRevenue': 'Today Revenue',
    'dashboard.totalRevenues': 'Total Revenues',
    'dashboard.registerShortage': 'Register Medicine Shortages',
    'dashboard.registerRevenue': 'Register Revenue',
    'dashboard.reports': 'Reports',
    'dashboard.exportUserReport': 'Export Staff Performance Report',
    
    // Shortages
    'shortages.title': 'Medicine Shortages Management',
    'shortages.addShortage': 'Add Medicine Shortage',
    'shortages.medicineName': 'Medicine Name',
    'shortages.notes': 'Notes (Optional)',
    'shortages.addMedicine': 'Add Medicine',
    'shortages.provided': 'Provided',
    'shortages.outOfStock': 'Out of Stock',
    'shortages.exportPdf': 'Export PDF',
    'shortages.repeated': 'Repeated',
    
    // Revenue
    'revenue.title': 'Revenue Management',
    'revenue.date': 'Date',
    'revenue.shift': 'Shift',
    'revenue.revenue': 'Revenue',
    'revenue.notes': 'Notes',
    'revenue.totalByShift': 'Shift Total',
    'revenue.dailyTotal': 'Daily Total',
    'revenue.exportReport': 'Export Period Report',
    
    // Shifts
    'shift.morning': 'Morning',
    'shift.evening': 'Evening',
    'shift.night': 'Night',
    'shift.ahmad': 'Ahmad Rajili',
    
    // Common
    'back': 'Back to Main',
    'edit': 'Edit',
    'delete': 'Delete',
    'save': 'Save',
    'cancel': 'Cancel',
    'language': 'عربي'
  }
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'ar',
      
      toggleLanguage: () => {
        set((state) => ({
          language: state.language === 'ar' ? 'en' : 'ar'
        }));
        
        // Update document direction and language
        const newLang = get().language;
        document.documentElement.lang = newLang;
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
      },
      
      t: (key: string) => {
        const { language } = get();
        return translations[language][key] || key;
      }
    }),
    {
      name: 'language-storage'
    }
  )
);
