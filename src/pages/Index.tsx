import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import SafeWrapper from '@/components/SafeWrapper';

const INIT_TIMEOUT = 3000; // 3 seconds max wait

const Index = () => {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [storesReady, setStoresReady] = useState(false);
  const [authState, setAuthState] = useState({ isAuthenticated: false, user: null as any });
  const [langState, setLangState] = useState({ language: 'ar' as 'ar' | 'en' });

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeApp = async () => {
      try {
        console.log('تهيئة التطبيق...');
        
        // Wait for hydration with timeout
        await Promise.race([
          new Promise<void>((resolve) => {
            // Check if already hydrated
            const authStore = useAuthStore.getState();
            if (authStore.user !== undefined) {
              resolve();
              return;
            }
            
            // Wait for hydration
            const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
              unsubscribe();
              resolve();
            });
          }),
          new Promise<void>((resolve) => setTimeout(resolve, 1500)) // 1.5s hydration timeout
        ]);

        if (!mounted) return;

        const authStore = useAuthStore.getState();
        const langStore = useLanguageStore.getState();
        
        setAuthState({
          isAuthenticated: authStore.isAuthenticated,
          user: authStore.user
        });
        
        setLangState({
          language: langStore.language
        });
        
        document.documentElement.lang = langStore.language;
        document.documentElement.dir = langStore.language === 'ar' ? 'rtl' : 'ltr';
        
        console.log('حالة المصادقة:', { isAuthenticated: authStore.isAuthenticated, user: !!authStore.user });
        console.log('حالة اللغة:', { language: langStore.language });
        
        setStoresReady(true);
        setIsReady(true);
        console.log('تم تهيئة التطبيق بنجاح');
      } catch (error) {
        console.error('خطأ في تهيئة الصفحة:', error);
        if (mounted) {
          setInitError('فشل في تهيئة التطبيق: ' + (error as Error).message);
          setIsReady(true);
        }
      }
    };

    // Fallback timeout - force app to load after INIT_TIMEOUT
    timeoutId = setTimeout(() => {
      if (!isReady && mounted) {
        console.warn('تجاوز وقت التهيئة، متابعة بالإعدادات الافتراضية');
        setStoresReady(true);
        setIsReady(true);
      }
    }, INIT_TIMEOUT);

    initializeApp();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

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

  if (!isReady || !storesReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">
            {langState.language === 'ar' ? 'جاري تحميل النظام...' : 'Loading system...'}
          </p>
        </div>
      </div>
    );
  }

  const handleSuccessfulLogin = () => {
    console.log('تم تسجيل الدخول بنجاح');
    const authStore = useAuthStore.getState();
    setAuthState({
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user
    });
  };

  return (
    <SafeWrapper name="Index Page">
      <div className="min-h-screen">
        {!authState.isAuthenticated ? (
          <SafeWrapper name="Login Form">
            <LoginForm onLogin={handleSuccessfulLogin} />
          </SafeWrapper>
        ) : (
          <SafeWrapper name="Dashboard">
            <Dashboard user={authState.user} />
          </SafeWrapper>
        )}
      </div>
    </SafeWrapper>
  );
};

export default Index;