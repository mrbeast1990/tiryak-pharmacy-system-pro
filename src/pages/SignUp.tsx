
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/languageStore';
import { ArrowLeft, Globe, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { language, toggleLanguage, t } = useLanguageStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: language === 'ar' ? "خطأ في كلمة المرور" : "Password Error",
        description: language === 'ar' ? "كلمة المرور غير متطابقة" : "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulate sign up process
    setTimeout(() => {
      toast({
        title: language === 'ar' ? "تم إرسال الطلب" : "Application Submitted",
        description: language === 'ar' ? "سيتم مراجعة طلبك والتواصل معك قريباً" : "Your application will be reviewed and we'll contact you soon",
      });
      setIsLoading(false);
      navigate('/');
    }, 2000);
  };

  const handleBackToLogin = () => {
    navigate('/');
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

      {/* Back Button */}
      <Button
        onClick={handleBackToLogin}
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 flex items-center space-x-2"
      >
        <ArrowLeft className="w-3 h-3" />
        <span className="text-sm">{language === 'ar' ? 'العودة' : 'Back'}</span>
      </Button>

      <Card className="w-full max-w-md card-shadow relative z-10">
        <CardHeader className="text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
            <img 
              src="/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png" 
              alt="Al-Tiryak Logo" 
              className="w-16 h-16"
            />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
          </CardTitle>
          <CardDescription className="text-sm">
            {language === 'ar' ? 'املأ البيانات للتسجيل في النظام' : 'Fill the form to register in the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  className="pl-10 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  className="pl-10 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
                  className="pl-10 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {language === 'ar' ? 'العنوان' : 'Address'}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل عنوانك' : 'Enter your address'}
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
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                  className="pl-10 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'}
                  className="pl-10 text-sm"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full pharmacy-gradient"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                language === 'ar' ? 'إرسال الطلب' : 'Submit Application'
              )}
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

export default SignUp;
