import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Loader2, CheckCircle, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/store/languageStore';
import pharmacyLogo from '@/assets/pharmacy-logo.png';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguageStore();

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check URL hash for recovery token
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (type === 'recovery' && accessToken) {
        setIsValidSession(true);
      } else if (session) {
        setIsValidSession(true);
      }
      
      setIsCheckingSession(false);
    };

    checkSession();

    // Listen for auth state changes (for recovery flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setIsCheckingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' 
          : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'كلمتا المرور غير متطابقتين' 
          : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast({
        title: language === 'ar' ? 'تم بنجاح' : 'Success',
        description: language === 'ar' 
          ? 'تم تحديث كلمة المرور بنجاح' 
          : 'Password updated successfully',
      });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      console.error('Update password error:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'حدث خطأ أثناء تحديث كلمة المرور' : 'Failed to update password'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 px-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-6 text-center space-y-4">
          <h1 className="text-xl font-bold text-foreground">
            {language === 'ar' ? 'رابط غير صالح' : 'Invalid Link'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' 
              ? 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية' 
              : 'The password reset link is invalid or has expired'}
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </Button>
        </div>
      </div>
    );
  }

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
          <span className="text-sm">{language === 'ar' ? 'English' : 'العربية'}</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src={pharmacyLogo}
            alt="Al-Tiryak Al-Shafi Pharmacy" 
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* Form Card */}
        <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-6">
          {isSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {language === 'ar' ? 'تم بنجاح!' : 'Success!'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'تم تحديث كلمة المرور. جاري التوجيه...' 
                  : 'Password updated. Redirecting...'}
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-foreground text-center mb-2">
                {language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
              </h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {language === 'ar' 
                  ? 'أدخل كلمة المرور الجديدة' 
                  : 'Enter your new password'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} h-11 rounded-xl`}
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} h-11 rounded-xl`}
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl pharmacy-gradient text-base font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'
                  )}
                </Button>
              </form>
            </>
          )}
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

export default ResetPassword;
