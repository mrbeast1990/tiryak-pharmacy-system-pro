
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/languageStore';
import { ArrowRight, User, Mail, Lock, Phone, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { language, toggleLanguage } = useLanguageStore();
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
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "كلمات المرور غير متطابقة" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await supabase.from('account_requests').insert({
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
    });
    
    if (error) {
      console.error('Error submitting account request:', error);
      toast({
        title: language === 'ar' ? "خطأ في الإرسال" : "Submission Error",
        description: language === 'ar' ? "حدث خطأ أثناء إرسال طلبك. قد يكون البريد الإلكتروني مسجلاً بالفعل." : "An error occurred while submitting your request. The email might already be registered.",
        variant: "destructive",
      });
    } else {
      toast({
        title: language === 'ar' ? "تم إرسال الطلب" : "Application Submitted",
        description: language === 'ar' 
          ? "تم إرسال طلب إنشاء الحساب بنجاح. سيتم مراجعته من قبل الإدارة." 
          : "Your account creation request has been submitted successfully. It will be reviewed by management.",
      });
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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

      {/* Header */}
      <header className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 space-x-reverse text-sm"
            >
              <ArrowRight className="w-3 h-3" />
              <span>{language === 'ar' ? 'العودة' : 'Back'}</span>
            </Button>
            
            <Button
              onClick={toggleLanguage}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Globe className="w-3 h-3" />
              <span className="text-sm">{language === 'ar' ? 'English' : 'العربية'}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center py-8 px-4 relative z-10">
        <div className="w-full max-w-md space-y-6">
          <Card className="card-shadow">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mx-auto mb-4">
                <img 
                  src="/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png" 
                  alt="Al-Tiryak Logo" 
                  className="w-24 h-24"
                />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900">
                {language === 'ar' ? 'طلب إنشاء حساب جديد' : 'New Account Application'}
              </CardTitle>
              <CardDescription className="text-sm">
                {language === 'ar' 
                  ? 'يرجى ملء النموذج التالي لطلب إنشاء حساب' 
                  : 'Please fill out the following form to request account creation'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-gray-400`} />
                    <Input
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} text-sm`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-gray-400`} />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} text-sm`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'الرقم السري' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-gray-400`} />
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل الرقم السري' : 'Enter your password'}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} text-sm`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'تكرار الرقم السري' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-gray-400`} />
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder={language === 'ar' ? 'أعد إدخال الرقم السري' : 'Confirm your password'}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} text-sm`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-gray-400`} />
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} text-sm`}
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
          
          {/* Footer - moved below the card */}
          <div className="text-center text-sm text-gray-600 bg-white/90 px-6 py-3 rounded-lg shadow-lg">
            <p className="font-semibold">Ahmed A Alrjele</p>
            <p>Founder & CEO</p>
            <p>Al-tiryak Al-shafi Pharmacy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
