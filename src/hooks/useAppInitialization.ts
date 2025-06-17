
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { supabase } from '@/integrations/supabase/client';

interface InitializationState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  stage: string;
}

export const useAppInitialization = () => {
  const [state, setState] = useState<InitializationState>({
    isReady: false,
    isLoading: true,
    error: null,
    stage: 'بدء التهيئة'
  });

  const { isAuthenticated } = useAuthStore();
  const { language } = useLanguageStore();
  const { fetchMedicines, fetchRevenues } = usePharmacyStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 بدء تهيئة التطبيق');
        setState(prev => ({ ...prev, stage: 'فحص حالة المصادقة' }));
        
        // فحص اتصال Supabase
        setState(prev => ({ ...prev, stage: 'فحص الاتصال بقاعدة البيانات' }));
        const { error: connectionError } = await supabase.from('profiles').select('count').limit(1);
        if (connectionError) {
          console.error('❌ خطأ في الاتصال بقاعدة البيانات:', connectionError);
          throw new Error('فشل في الاتصال بقاعدة البيانات');
        }
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

        // تهيئة اللغة
        setState(prev => ({ ...prev, stage: 'تهيئة اللغة' }));
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        console.log('✅ تم تهيئة اللغة:', language);

        // تحميل البيانات الأساسية إذا كان المستخدم مصادق عليه
        if (isAuthenticated) {
          setState(prev => ({ ...prev, stage: 'تحميل بيانات الأدوية' }));
          await fetchMedicines();
          console.log('✅ تم تحميل بيانات الأدوية');
          
          setState(prev => ({ ...prev, stage: 'تحميل بيانات الإيرادات' }));
          await fetchRevenues();
          console.log('✅ تم تحميل بيانات الإيرادات');
        }

        // تسجيل Service Worker
        setState(prev => ({ ...prev, stage: 'تسجيل Service Worker' }));
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ تم تسجيل Service Worker:', registration);
          } catch (swError) {
            console.warn('⚠️ فشل في تسجيل Service Worker:', swError);
            // لا نرمي خطأ هنا لأن Service Worker اختياري
          }
        }

        setState(prev => ({ ...prev, stage: 'اكتمل التحميل' }));
        
        // انتظار قصير للتأكد من اكتمال كل شيء
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setState({
          isReady: true,
          isLoading: false,
          error: null,
          stage: 'جاهز'
        });
        
        console.log('🎉 تم تهيئة التطبيق بنجاح');
        
      } catch (error) {
        console.error('❌ خطأ في تهيئة التطبيق:', error);
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
        setState({
          isReady: false,
          isLoading: false,
          error: errorMessage,
          stage: 'خطأ في التهيئة'
        });
      }
    };

    initializeApp();
  }, [isAuthenticated, language, fetchMedicines, fetchRevenues]);

  return state;
};
