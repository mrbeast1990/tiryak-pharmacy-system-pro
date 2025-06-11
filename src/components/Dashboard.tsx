
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { LogOut, TrendingUp, Users, AlertCircle, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ShortageManager from './ShortageManager';
import RevenueManager from './RevenueManager';

const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'shortage' | 'revenue'>('dashboard');
  const { user, logout, checkPermission } = useAuthStore();
  const { language, toggleLanguage, t } = useLanguageStore();
  const { medicines, revenues, getTotalDailyRevenue } = usePharmacyStore();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: language === 'ar' ? "تم تسجيل الخروج" : "Logged Out",
      description: language === 'ar' ? "شكراً لاستخدامك نظام صيدلية الترياق الشافي" : "Thank you for using Al-Tiryak Al-Shafi System",
    });
  };

  const generateUserReport = () => {
    toast({
      title: language === 'ar' ? "تصدير التقرير" : "Export Report",
      description: language === 'ar' ? "سيتم إضافة هذه الميزة قريباً" : "This feature will be added soon",
    });
  };

  if (activeView === 'shortage') {
    return <ShortageManager onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'revenue') {
    return <RevenueManager onBack={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative">
      {/* Background Logo */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png)',
          backgroundSize: '600px 600px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                <img 
                  src="/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png" 
                  alt="Al-Tiryak Logo" 
                  className="w-8 h-8"
                />
              </div>
              <div>
                <h1 className="text-xs font-bold text-gray-900">{t('pharmacy.name')}</h1>
                <p className="text-xs text-gray-500">{t('welcome')} {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                onClick={toggleLanguage}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 text-xs px-2 py-1"
              >
                <Globe className="w-2 h-2" />
                <span className="text-xs">{t('language')}</span>
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 space-x-reverse text-xs px-2 py-1"
              >
                <LogOut className="w-2 h-2" />
                <span className="text-xs">{t('logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => setActiveView('shortage')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <span>{t('dashboard.registerShortage')}</span>
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'إدارة الأدوية الناقصة والمتوفرة في الصيدلية' : 'Manage shortage and available medicines in pharmacy'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveView('revenue')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span>{t('dashboard.registerRevenue')}</span>
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تسجيل الإيرادات والمصروفات حسب الفترات' : 'Register revenues and expenses by shifts'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Reports Section - Only for Admin and Ahmad */}
        {(checkPermission('export_pdf')) && (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse">
                <Users className="w-6 h-6 text-blue-500" />
                <span>{t('dashboard.reports')}</span>
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تصدير تقارير الأداء (متاح للمدير وأحمد الرجيلي فقط)' : 'Export performance reports (Available for admin and Ahmad Rajili only)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateUserReport} className="pharmacy-gradient">
                <Users className="w-4 h-4 ml-2" />
                {t('dashboard.exportUserReport')}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-gray-600 relative z-10">
        <p>Ahmed A Alrjele</p>
        <p>Founder & CEO</p>
        <p>Al-tiryak Al-shafi Pharmacy</p>
      </div>
    </div>
  );
};

export default Dashboard;
