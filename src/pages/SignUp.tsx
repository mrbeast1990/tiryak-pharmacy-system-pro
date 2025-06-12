
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguageStore } from '@/store/languageStore';
import { ArrowRight, User, Mail, Lock, Phone, Globe, MapPin, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    experience: '',
    previousWork: '',
    reason: '',
    references: ''
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
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: language === 'ar' ? "تم إرسال الطلب" : "Application Submitted",
        description: language === 'ar' 
          ? "تم إرسال طلب إنشاء الحساب بنجاح. سيتم مراجعته من قبل الإدارة." 
          : "Your account creation request has been submitted successfully. It will be reviewed by management.",
      });
      setIsLoading(false);
      navigate('/');
    }, 2000);
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

      <div className="flex items-center justify-center py-12 px-4 relative z-10">
        <Card className="w-full max-w-2xl card-shadow">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mx-auto mb-4">
              <img 
                src="/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png" 
                alt="Al-Tiryak Logo" 
                className="w-32 h-32"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'طلب إنشاء حساب جديد' : 'New Account Application'}
            </CardTitle>
            <CardDescription className="text-sm">
              {language === 'ar' 
                ? 'يرجى ملء النموذج التالي لطلب إنشاء حساب في نظام صيدلية الترياق الشافي' 
                : 'Please fill out the following form to request account creation in Al-Tiryak Al-Shafi Pharmacy System'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2 space-x-reverse">
                  <User className="w-5 h-5" />
                  <span>{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'العنوان' : 'Address'}
                    </label>
                    <div className="relative">
                      <MapPin className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-gray-400`} />
                      <Input
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder={language === 'ar' ? 'أدخل عنوانك' : 'Enter your address'}
                        className={`${language === 'ar' ? 'pr-10' : 'pl-10'} text-sm`}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2 space-x-reverse">
                  <FileText className="w-5 h-5" />
                  <span>{language === 'ar' ? 'المعلومات المهنية' : 'Professional Information'}</span>
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'سنوات الخبرة في مجال الصيدلة' : 'Years of Experience in Pharmacy'}
                    </label>
                    <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر سنوات الخبرة' : 'Select years of experience'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">{language === 'ar' ? 'أقل من سنة' : 'Less than 1 year'}</SelectItem>
                        <SelectItem value="1-3">{language === 'ar' ? '1-3 سنوات' : '1-3 years'}</SelectItem>
                        <SelectItem value="3-5">{language === 'ar' ? '3-5 سنوات' : '3-5 years'}</SelectItem>
                        <SelectItem value="5+">{language === 'ar' ? 'أكثر من 5 سنوات' : 'More than 5 years'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'أماكن العمل السابقة' : 'Previous Work Places'}
                    </label>
                    <Textarea
                      value={formData.previousWork}
                      onChange={(e) => handleInputChange('previousWork', e.target.value)}
                      placeholder={language === 'ar' ? 'اذكر أماكن عملك السابقة والمدة' : 'Mention your previous workplaces and duration'}
                      className="text-right text-sm"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'سبب الرغبة في العمل مع صيدلية الترياق الشافي' : 'Reason for wanting to work with Al-Tiryak Al-Shafi Pharmacy'}
                    </label>
                    <Textarea
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder={language === 'ar' ? 'وضح سبب رغبتك في الانضمام لفريقنا' : 'Explain why you want to join our team'}
                      className="text-right text-sm"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'المراجع (اختياري)' : 'References (Optional)'}
                    </label>
                    <Textarea
                      value={formData.references}
                      onChange={(e) => handleInputChange('references', e.target.value)}
                      placeholder={language === 'ar' ? 'أسماء وأرقام هواتف المراجع' : 'Names and phone numbers of references'}
                      className="text-right text-sm"
                      rows={2}
                    />
                  </div>
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
      </div>
      
      {/* Footer */}
      <div className={`absolute bottom-4 ${language === 'ar' ? 'right-4' : 'left-4'} text-${language === 'ar' ? 'right' : 'left'} text-sm text-gray-600 relative z-10`}>
        <p>Ahmed A Alrjele</p>
        <p>Founder & CEO</p>
        <p>Al-tiryak Al-shafi Pharmacy</p>
      </div>
    </div>
  );
};

export default SignUp;
