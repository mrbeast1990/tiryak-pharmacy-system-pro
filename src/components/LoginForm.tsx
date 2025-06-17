
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { Lock, Mail, Globe, UserPlus, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

interface LoginFormProps {
  onLogin: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  
  const { login, setRememberMe: setAuthRememberMe } = useAuthStore();
  const { language, toggleLanguage, t } = useLanguageStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Set remember me preference before login
    setAuthRememberMe(rememberMe);
    
    const success = await login(email, password);
    
    if (success) {
      toast({
        title: language === 'ar' ? "تم تسجيل الدخول بنجاح" : "Login Successful",
        description: language === 'ar' ? "مرحباً بك في نظام صيدلية الترياق الشافي" : "Welcome to Al-Tiryak Al-Shafi System",
      });
      onLogin();
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
    // التحقق من أن التطبيق يعمل على منصة الهاتف
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
    
    try {
      // Check if biometric is available
      const isAvailable = await NativeBiometric.isAvailable();
      
      if (!isAvailable.isAvailable) {
        toast({
          title: language === 'ar' ? "البصمة غير متاحة" : "Biometric Not Available",
          description: language === 'ar' ? "البصمة غير مدعومة على هذا الجهاز" : "Biometric authentication is not supported on this device",
          variant: "destructive",
        });
        setIsBiometricLoading(false);
        return;
      }

      // Perform biometric verification
      const result = await NativeBiometric.verifyIdentity({
        reason: language === 'ar' ? "استخدم البصمة لتسجيل الدخول" : "Use your biometric to authenticate",
        title: language === 'ar' ? "تسجيل الدخول بالبصمة" : "Biometric Login",
        subtitle: language === 'ar' ? "ضع إصبعك على المستشعر" : "Place your finger on the sensor",
        description: language === 'ar' ? "تأكيد الهوية للدخول إلى النظام" : "Verify your identity to access the system"
      });

      if (result) {
        // Get stored credentials (you might want to store these securely)
        const credentials = await NativeBiometric.getCredentials({
          server: "al-tiryak-pharmacy",
        });

        if (credentials.username && credentials.password) {
          setAuthRememberMe(true);
          const success = await login(credentials.username, credentials.password);
          
          if (success) {
            toast({
              title: language === 'ar' ? "تم تسجيل الدخول بالبصمة" : "Biometric Login Successful",
              description: language === 'ar' ? "تم التحقق من الهوية بنجاح" : "Identity verified successfully",
            });
            onLogin();
          } else {
            toast({
              title: language === 'ar' ? "خطأ في البيانات المحفوظة" : "Stored Credentials Error",
              description: language === 'ar' ? "يرجى تسجيل الدخول يدوياً لتحديث البيانات" : "Please login manually to update credentials",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: language === 'ar' ? "لا توجد بيانات محفوظة" : "No Stored Credentials",
            description: language === 'ar' ? "يرجى تسجيل الدخول يدوياً أولاً" : "Please login manually first to enable biometric login",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      toast({
        title: language === 'ar' ? "خطأ في البصمة" : "Biometric Error",
        description: language === 'ar' ? "فشل في التحقق من البصمة" : "Failed to verify biometric",
        variant: "destructive",
      });
    }
    
    setIsBiometricLoading(false);
  };

  const handleSignUpClick = () => {
    navigate('/signup');
  };

  // Store credentials for biometric login when successful login with remember me
  React.useEffect(() => {
    if (rememberMe && email && password && Capacitor.isNativePlatform()) {
      NativeBiometric.setCredentials({
        username: email,
        password: password,
        server: "al-tiryak-pharmacy",
      }).catch(console.error);
    }
  }, [rememberMe, email, password]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 relative pt-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Logo */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png)',
          backgroundSize: '400px 400px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Language Toggle - in foreground */}
      <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-20`}>
        <Button
          onClick={toggleLanguage}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2 bg-white shadow-lg"
        >
          <Globe className="w-3 h-3" />
          <span className="text-sm">{t('language')}</span>
        </Button>
      </div>

      <div className="flex flex-col items-center space-y-4 relative z-10 w-full max-w-md px-4">
        <Card className="w-full card-shadow">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mx-auto mb-1">
              <img 
                src="/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png" 
                alt="Al-Tiryak Logo" 
                className="w-40 h-40"
              />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900">
              {t('pharmacy.name')}
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              {language === 'ar' 
                ? 'مرحباً بك في عالم حيث التفاصيل الصغيرة تصنع فارقاً كبيراً... تسجيل دخولك اليوم هو بداية لرعاية أفضل...' 
                : 'Welcome to a world where small details make a big difference... Your login today is the start of better care...'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <div className="relative">
                  <Mail className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-gray-400`} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    className={`${language === 'ar' ? 'pr-10' : 'pl-10'} text-sm`}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-gray-400`} />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                    className={`${language === 'ar' ? 'pr-10' : 'pl-10'} text-sm`}
                    required
                  />
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label 
                  htmlFor="remember-me" 
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {language === 'ar' ? 'تذكرني' : 'Remember me'}
                </label>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full pharmacy-gradient"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  language === 'ar' ? 'تسجيل الدخول' : 'Sign In'
                )}
              </Button>

              {/* Biometric Login Button - فقط على الهاتف */}
              {Capacitor.isNativePlatform() && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleBiometricLogin}
                  disabled={isBiometricLoading}
                >
                  {isBiometricLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Fingerprint className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {language === 'ar' ? 'تسجيل الدخول بالبصمة' : 'Login with Biometric'}
                    </>
                  )}
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSignUpClick}
              >
                <UserPlus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Footer - now below the card */}
        <div className="text-center text-sm text-gray-700 bg-white/90 px-6 py-3 rounded-lg shadow-lg">
          <p className="font-semibold">Ahmed A Alrjele</p>
          <p>Founder & CEO</p>
          <p>Al-tiryak Al-shafi Pharmacy</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
