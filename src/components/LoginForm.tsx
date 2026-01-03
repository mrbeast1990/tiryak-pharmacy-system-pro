import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { Lock, Mail, Globe, UserPlus, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import pharmacyLogo from '@/assets/pharmacy-logo.png';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  
  const { user, login, setRememberMe: setAuthRememberMe } = useAuthStore();
  const { language, toggleLanguage, t } = useLanguageStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setAuthRememberMe(rememberMe);
    
    const success = await login(email, password);
    
    if (success) {
      toast({
        title: language === 'ar' ? "تم تسجيل الدخول بنجاح" : "Login Successful",
        description: language === 'ar' ? "مرحباً بك في نظام صيدلية الترياق الشافي" : "Welcome to Al-Tiryak Al-Shafi System",
      });
    } else {
      toast({
        title: language === 'ar' ? "خطأ في تسجيل الدخول" : "Login Error",
        description: language === 'ar' ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleBiometricLogin = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: language === 'ar' ? "غير مدعوم" : "Not Supported",
        description: language === 'ar' ? 
          "تسجيل الدخول بالبصمة مفعل فقط على تطبيق الهاتف" : 
          "Biometric login is only available on mobile app",
        variant: "destructive",
      });
      return;
    }

    setIsBiometricLoading(true);
    console.log('🔐 Starting biometric login...');
    
    try {
      const isAvailable = await NativeBiometric.isAvailable();
      
      if (!isAvailable.isAvailable) {
        console.log('❌ Biometric not available on this device');
        toast({
          title: language === 'ar' ? "البصمة غير متاحة" : "Biometric Not Available",
          description: language === 'ar' ? "البصمة غير مدعومة على هذا الجهاز" : "Biometric authentication is not supported on this device",
          variant: "destructive",
        });
        setIsBiometricLoading(false);
        return;
      }

      console.log('✅ Biometric available, showing verification...');

      try {
        await NativeBiometric.verifyIdentity({
          reason: language === 'ar' ? "استخدم البصمة لتسجيل الدخول" : "Use your biometric to authenticate",
          title: language === 'ar' ? "تسجيل الدخول بالبصمة" : "Biometric Login",
          subtitle: language === 'ar' ? "ضع إصبعك على المستشعر" : "Place your finger on the sensor",
          description: language === 'ar' ? "تأكيد الهوية للدخول إلى النظام" : "Verify your identity to access the system"
        });
        
        console.log('✅ Biometric verification successful!');

        const credentials = await NativeBiometric.getCredentials({
          server: "al-tiryak-pharmacy",
        });

        console.log('📧 Retrieved credentials for:', credentials.username);

        if (credentials.username && credentials.password) {
          console.log('🔑 Attempting login with saved credentials...');
          setAuthRememberMe(true);
          const success = await login(credentials.username, credentials.password);
          
          if (success) {
            console.log('✅ Login successful!');
            toast({
              title: '✅ ' + (language === 'ar' ? "تم تسجيل الدخول بالبصمة" : "Biometric Login Successful"),
              description: language === 'ar' ? "تم التحقق من الهوية بنجاح" : "Identity verified successfully",
            });
          } else {
            console.error('❌ Login failed with saved credentials');
            toast({
              title: language === 'ar' ? "خطأ في البيانات المحفوظة" : "Stored Credentials Error",
              description: language === 'ar' ? "بيانات الدخول المحفوظة غير صحيحة - يرجى تسجيل الدخول يدوياً" : "Stored credentials are invalid - please login manually",
              variant: "destructive",
            });
          }
        } else {
          console.warn('⚠️ No credentials found');
          toast({
            title: language === 'ar' ? "لا توجد بيانات محفوظة" : "No Stored Credentials",
            description: language === 'ar' ? "يرجى تسجيل الدخول يدوياً أولاً مع تفعيل 'تذكرني'" : "Please login manually first with 'Remember me' enabled",
            variant: "destructive",
          });
        }
      } catch (verifyError: any) {
        console.error('❌ Biometric verification error:', verifyError);
        
        if (verifyError.code === 10 || verifyError.message?.includes('cancel') || verifyError.message?.includes('user')) {
          console.log('❌ Biometric verification cancelled by user');
          toast({
            title: language === 'ar' ? "تم الإلغاء" : "Cancelled",
            description: language === 'ar' ? "تم إلغاء التحقق من البصمة" : "Biometric verification cancelled",
          });
        } else {
          toast({
            title: language === 'ar' ? "فشل التحقق من البصمة" : "Biometric Verification Failed",
            description: language === 'ar' ? "فشل التحقق من البصمة - يرجى المحاولة مرة أخرى" : "Failed to verify biometric - please try again",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('❌ Biometric login error:', error);
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "حدث خطأ أثناء تسجيل الدخول بالبصمة" : "An error occurred during biometric login",
        variant: "destructive",
      });
    }
    
    setIsBiometricLoading(false);
  };

  const handleSignUpClick = () => {
    navigate('/signup');
  };

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    
    if (newEmail.length >= 2) {
      const availableEmails = [
        'deltanorthpharm@gmail.com',
        'thepanaceapharmacy@gmail.com', 
        'ahmad@tiryak.com',
        'morning@tiryak.com',
        'evening@tiryak.com',
        'night@tiryak.com'
      ];
      
      const matchingEmail = availableEmails.find(email => 
        email.toLowerCase().startsWith(newEmail.toLowerCase())
      );
      
      if (matchingEmail && matchingEmail !== newEmail) {
        setEmail(matchingEmail);
        
        const savedData = JSON.parse(localStorage.getItem('saved-credentials') || '{}');
        if (savedData[matchingEmail]) {
          setPassword(savedData[matchingEmail].password);
          setRememberMe(true);
        }
      }
    }
  };

  React.useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const credentials = await NativeBiometric.getCredentials({
            server: "al-tiryak-pharmacy",
          });
          
          if (credentials && credentials.username && credentials.password) {
            setEmail(credentials.username);
            setPassword(credentials.password);
            setRememberMe(true);
          }
        } else {
          const savedEmail = localStorage.getItem('last-email');
          const savedCredentials = JSON.parse(localStorage.getItem('saved-credentials') || '{}');
          
          if (savedEmail && savedCredentials[savedEmail]) {
            setEmail(savedEmail);
            setPassword(savedCredentials[savedEmail].password);
            setRememberMe(true);
          }
        }
      } catch (error) {
        // No saved credentials
      }
    };

    loadSavedCredentials();
  }, []);

  const storeCredentials = React.useCallback(async () => {
    if (rememberMe && email && password) {
      if (Capacitor.isNativePlatform()) {
        try {
          await NativeBiometric.setCredentials({
            username: email,
            password: password,
            server: "al-tiryak-pharmacy",
          });
        } catch (error) {
          console.error('Failed to store biometric credentials:', error);
        }
      } else {
        const existingCredentials = JSON.parse(localStorage.getItem('saved-credentials') || '{}');
        existingCredentials[email] = { password, rememberMe: true };
        localStorage.setItem('saved-credentials', JSON.stringify(existingCredentials));
        localStorage.setItem('last-email', email);
      }
    } else if (!rememberMe) {
      if (Capacitor.isNativePlatform()) {
        try {
          await NativeBiometric.deleteCredentials({
            server: "al-tiryak-pharmacy",
          });
        } catch (error) {
          console.error('Failed to delete biometric credentials:', error);
        }
      } else {
        const existingCredentials = JSON.parse(localStorage.getItem('saved-credentials') || '{}');
        delete existingCredentials[email];
        localStorage.setItem('saved-credentials', JSON.stringify(existingCredentials));
        if (localStorage.getItem('last-email') === email) {
          localStorage.removeItem('last-email');
        }
      }
    }
  }, [rememberMe, email, password]);

  React.useEffect(() => {
    if (user && rememberMe && email && password) {
      console.log('💾 Saving credentials for biometric login...');
      storeCredentials();
      toast({
        title: '✅ ' + (language === 'ar' ? 'تم حفظ بيانات الدخول' : 'Credentials Saved'),
        description: language === 'ar' ? 'يمكنك الآن استخدام البصمة لتسجيل الدخول' : 'You can now use biometric login',
      });
    }
  }, [user, storeCredentials, rememberMe, email, password, toast, language]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-teal-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language Toggle */}
      <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-20`}>
        <Button
          onClick={toggleLanguage}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border-border/50 shadow-sm"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm">{t('language')}</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src={pharmacyLogo}
            alt="Al-Tiryak Al-Shafi Pharmacy" 
            className="w-32 h-32 object-contain"
          />
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t('pharmacy.name')}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs leading-relaxed">
          {language === 'ar' 
            ? 'مرحباً بك في عالم حيث التفاصيل الصغيرة تصنع فارقاً كبيراً... تسجيل دخولك اليوم هو بداية لرعاية أفضل...' 
            : 'Welcome to a world where small details make a big difference... Your login today is the start of better care...'
          }
        </p>
        
        {/* Form Card */}
        <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <div className="relative">
                <Mail className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  className={`${language === 'ar' ? 'pr-10' : 'pl-10'} h-11 rounded-xl border-border/50 bg-background`}
                  autoComplete="email"
                  list="email-suggestions"
                  required
                />
                <datalist id="email-suggestions">
                  <option value="deltanorthpharm@gmail.com" />
                  <option value="thepanaceapharmacy@gmail.com" />
                  <option value="ahmad@tiryak.com" />
                  <option value="morning@tiryak.com" />
                  <option value="evening@tiryak.com" />
                  <option value="night@tiryak.com" />
                </datalist>
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                  className={`${language === 'ar' ? 'pr-10' : 'pl-10'} h-11 rounded-xl border-border/50 bg-background`}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <Checkbox 
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label 
                htmlFor="remember-me" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {language === 'ar' ? 'تذكرني' : 'Remember me'}
              </label>
            </div>
            
            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl pharmacy-gradient text-base font-medium"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                language === 'ar' ? 'تسجيل الدخول' : 'Sign In'
              )}
            </Button>

            {/* Biometric Login Button */}
            {Capacitor.isNativePlatform() && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl border-border/50"
                onClick={handleBiometricLogin}
                disabled={isBiometricLoading}
              >
                {isBiometricLoading ? (
                  <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Fingerprint className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'تسجيل الدخول بالبصمة' : 'Login with Biometric'}
                  </>
                )}
              </Button>
            )}
            
            {/* Sign Up Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl border-border/50"
              onClick={handleSignUpClick}
            >
              <UserPlus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
            </Button>
          </form>
        </div>
      </div>
      
      {/* Footer */}
      <div className="py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Ahmed A Alrjele • Founder & CEO
        </p>
        <p className="text-xs text-muted-foreground">
          Al-tiryak Al-shafi Pharmacy
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
