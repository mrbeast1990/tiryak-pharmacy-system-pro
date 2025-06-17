
import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import LoadingFallback from '@/components/LoadingFallback';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { language } = useLanguageStore();
  const { isReady, isLoading, error, stage } = useAppInitialization();

  const handleSuccessfulLogin = () => {
    console.log('تم تسجيل الدخول بنجاح');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // عرض صفحة الخطأ
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            خطأ في تحميل التطبيق
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">المرحلة: {stage}</p>
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  // عرض شاشة التحميل
  if (isLoading || !isReady) {
    return (
      <LoadingFallback 
        message={stage} 
        showDetails={true}
      />
    );
  }

  // عرض التطبيق الرئيسي
  return (
    <ErrorBoundary>
      {!isAuthenticated ? (
        <LoginForm onLogin={handleSuccessfulLogin} />
      ) : (
        <Dashboard user={user} />
      )}
    </ErrorBoundary>
  );
};

export default Index;
