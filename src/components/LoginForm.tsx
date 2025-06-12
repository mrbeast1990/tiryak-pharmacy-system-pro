
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { Pill, Lock, Mail, Globe, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onLogin: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();
  const { language, toggleLanguage, t } = useLanguageStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await login(email, password, rememberMe);
    
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

  const handleSignUpClick = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 relative">
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
      
      {/* Language Toggle */}
      <Button
        onClick={toggleLanguage}
        variant="outline"
        size="sm"
        className="absolute top-4 right-4 flex items-center space-x-2"
      >
        <Globe className="w-3 h-3" />
        <span className="text-sm">{t('language')}</span>
      </Button>

      <Card className="w-full max-w-md card-shadow relative z-10">
        <CardHeader className="text-center">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
            <img 
              src="/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png" 
              alt="Al-Tiryak Logo" 
              className="w-24 h-24"
            />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            {t('pharmacy.name')}
          </CardTitle>
          <CardDescription className="text-sm">
            {language === 'ar' ? 'نظام إدارة متكامل' : 'Integrated Management System'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  className="pl-10 text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                  className="pl-10 text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label htmlFor="remember" className="text-sm text-gray-700">
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
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSignUpClick}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-gray-600">
        <p>Ahmed A Alrjele</p>
        <p>Founder & CEO</p>
        <p>Al-tiryak Al-shafi Pharmacy</p>
      </div>
    </div>
  );
};

export default LoginForm;
