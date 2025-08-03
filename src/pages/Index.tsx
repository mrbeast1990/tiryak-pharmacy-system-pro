import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import SafeWrapper from '@/components/SafeWrapper';

const Index = () => {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // استخدام مصادر الحالة بشكل منفصل لتجنب مشاكل الحالة
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const language = useLanguageStore(state => state.language);

  useEffect(() => {
    try {
      console.log('تهيئة التطبيق...');
      
      // Set document direction based on language
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      
      // التحقق من حالة المتاجر
      const authState = useAuthStore.getState();
      const langState = useLanguageStore.getState();
      
      console.log('حالة المصادقة:', { isAuthenticated, user: !!user });
      console.log('حالة اللغة:', { language });
      
      // Small delay to allow stores to initialize properly
      const timer = setTimeout(() => {
        setIsReady(true);
        console.log('تم تهيئة التطبيق بنجاح');
      }, 100);
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('خطأ في تهيئة الصفحة:', error);
      setInitError('فشل في تهيئة التطبيق: ' + (error as Error).message);
      setIsReady(true); // السماح بالمتابعة حتى لو حدث خطأ
    }
  }, [language, isAuthenticated, user]);

  // إذا حدث خطأ في التهيئة
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">خطأ في تهيئة التطبيق</h2>
          <p className="text-gray-600 mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    );
  }

  console.log('Index render:', { isReady, isAuthenticated, userExists: !!user, initError });

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">
            {language === 'ar' ? 'جاري تحميل النظام...' : 'Loading system...'}
          </p>
        </div>
      </div>
    );
  }

  const handleSuccessfulLogin = () => {
    console.log('تم تسجيل الدخول بنجاح');
  };

  return (
    <SafeWrapper name="Index Page">
      <div className="min-h-screen">
        {!isAuthenticated ? (
          <SafeWrapper name="Login Form">
            <LoginForm onLogin={handleSuccessfulLogin} />
          </SafeWrapper>
        ) : (
          <SafeWrapper name="Dashboard">
            <Dashboard user={user} />
          </SafeWrapper>
        )}
      </div>
    </SafeWrapper>
  );
};

export default Index;
