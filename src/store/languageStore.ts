
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageState {
  language: 'ar' | 'en';
  toggleLanguage: () => void;
  setLanguage: (lang: 'ar' | 'en') => void;
  t: (key: string) => string;
}

const translations = {
  ar: {
    // Header
    'pharmacy.name': 'الترياق الشافي',
    'logout': 'تسجيل الخروج',
    'welcome': 'مرحباً،',
    'user.role.manager': 'مدير',
    'profile.title': 'الملف الشخصي',
    
    // Dashboard
    'dashboard.shortages': 'النواقص',
    'dashboard.available': 'المتوفر',
    'dashboard.todayRevenue': 'إيراد اليوم',
    'dashboard.totalRevenues': 'إجمالي الإيرادات',
    'dashboard.registerShortage': 'تسجيل نواقص الأدوية',
    'dashboard.registerRevenue': 'تسجيل الإيرادات',
    'dashboard.reports': 'التقارير',
    'dashboard.exportUserReport': 'تصدير تقرير أداء المستخدمين',
    'dashboard.registerShortage.desc': 'إضافة وإدارة نواقص الأدوية',
    'dashboard.registerRevenue.desc': 'تسجيل وإدارة الإيرادات اليومية',
    'dashboard.reports.desc': 'عرض التقارير وإحصائيات الأداء',
    'dashboard.reviewRequests.title': 'مراجعة الطلبات',
    'dashboard.reviewRequests.desc': 'مراجعة وقبول طلبات الحسابات الجديدة',
    'dashboard.sendNotifications.title': 'إرسال الإشعارات',
    'dashboard.sendNotifications.desc': 'إرسال رسائل وتنبيهات للمستخدمين',
    
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
    'user.role.manager': 'Manager',
    'profile.title': 'Profile',
    
    // Dashboard
    'dashboard.shortages': 'Shortages',
    'dashboard.available': 'Available',
    'dashboard.todayRevenue': 'Today Revenue',
    'dashboard.totalRevenues': 'Total Revenues',
    'dashboard.registerShortage': 'Register Medicine Shortages',
    'dashboard.registerRevenue': 'Register Revenue',
    'dashboard.reports': 'Reports',
    'dashboard.exportUserReport': 'Export Staff Performance Report',
    'dashboard.registerShortage.desc': 'Add and manage medicine shortages',
    'dashboard.registerRevenue.desc': 'Register and manage daily revenues',
    'dashboard.reports.desc': 'View reports and performance statistics',
    'dashboard.reviewRequests.title': 'Review Requests',
    'dashboard.reviewRequests.desc': 'Review and approve new account requests',
    'dashboard.sendNotifications.title': 'Send Notifications',
    'dashboard.sendNotifications.desc': 'Send messages and alerts to users',
    
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
        const currentLang = get().language;
        const newLang = currentLang === 'ar' ? 'en' : 'ar';
        
        set({ language: newLang });
        
        // Update document direction and language
        document.documentElement.lang = newLang;
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
      },

      setLanguage: (lang: 'ar' | 'en') => {
        set({ language: lang });
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      },
      
      t: (key: string) => {
        const { language } = get();
        const languageTranslations = translations[language];
        if (!languageTranslations) return key;
        return languageTranslations[key as keyof typeof languageTranslations] || key;
      }
    }),
    {
      name: 'language-storage'
    }
  )
);
