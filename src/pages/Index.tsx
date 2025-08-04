import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const [isReady, setIsReady] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { language } = useLanguageStore();

  useEffect(() => {
    try {
      // Set document direction based on language
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      
      // Small delay to allow stores to initialize properly
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('خطأ في تهيئة الصفحة:', error);
      setIsReady(true); // السماح بالمتابعة حتى لو حدث خطأ
    }
  }, [language]);

  console.log('Index render:', { isReady, isAuthenticated, userExists: !!user });

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
    <div className="min-h-screen">
      {!isAuthenticated ? (
        <LoginForm onLogin={handleSuccessfulLogin} />
      ) : (
        <Dashboard user={user} />
      )}
    </div>
  );
};

export default Index;
