import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { 
  Pill, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  FileText,
  Users,
  LogOut,
  User,
  Settings,
  MessageSquare,
} from 'lucide-react';
import ProfileModal from './ProfileModal';
import ShortageManager from './ShortageManager';
import RevenueManager from './RevenueManager';
import ReportsPage from './ReportsPage';
import NotificationSender from './NotificationSender';

interface DashboardProps {
  onNavigate: (page: string) => void;
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  
  const { logout, checkPermission } = useAuthStore();
  const { language, toggleLanguage, t } = useLanguageStore();
  const { medicines, revenues, getTotalRevenue, getTodayRevenue } = usePharmacyStore();

  const handleLogout = () => {
    logout();
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    setCurrentPage('dashboard');
  };

  // Calculate statistics
  const shortageCount = medicines.filter(medicine => medicine.status === 'shortage').length;
  const availableCount = medicines.filter(medicine => medicine.status === 'available').length;
  const totalRevenue = getTotalRevenue();
  const todayRevenue = getTodayRevenue();

  if (currentPage === 'shortages') {
    return <ShortageManager onBack={handleBack} />;
  }

  if (currentPage === 'notifications') {
    return <NotificationSender onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <img 
                src="/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png" 
                alt="Al-Tiryak Logo" 
                className="w-10 h-10 cursor-pointer"
                onClick={() => setShowProfileModal(true)}
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {t('pharmacy.name')}
                </h1>
                <p className="text-sm text-gray-600">
                  {t('welcome')}{' '}
                  {user?.email === 'deltanorthpharm@gmail.com' ? 'مدير' : user?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                onClick={toggleLanguage}
                variant="outline"
                size="sm"
                className="text-xs px-1.5 py-0.5 h-5"
              >
                {language === 'ar' ? 'English' : 'عربي'}
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 space-x-reverse text-red-600 hover:text-red-700 text-xs px-1.5 py-0.5 h-5"
              >
                <LogOut className="w-3 h-3" />
                <span>{t('logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {(checkPermission('manage_shortages') || user?.role === 'admin') && (
            <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigate('shortages')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-medium text-gray-700">تسجيل نواقص الأدوية</p>
                    <p className="text-xs text-gray-500">
                      {language === 'ar' ? 'إضافة وإدارة نواقص الأدوية' : 'Add and manage medicine shortages'}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Pill className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(checkPermission('register_revenue_all') || 
            checkPermission('register_revenue_morning') || 
            checkPermission('register_revenue_evening') || 
            checkPermission('register_revenue_night') || 
            user?.role === 'admin' || 
            user?.role === 'ahmad_rajili') && (
            <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigate('revenue')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-medium text-gray-700">تسجيل الإيرادات</p>
                    <p className="text-xs text-gray-500">
                      {language === 'ar' ? 'تسجيل وإدارة الإيرادات اليومية' : 'Register and manage daily revenues'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reports & Admin Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {(checkPermission('view_reports') || user?.role === 'admin') && (
            <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigate('reports')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {t('dashboard.reports')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'عرض التقارير وإحصائيات الأداء' : 'View reports and performance statistics'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(checkPermission('manage_users') || user?.role === 'admin') && (
            <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/requests')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Users className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      مراجعة الطلبات
                    </h3>
                    <p className="text-sm text-gray-600">
                      مراجعة وقبول طلبات الحسابات الجديدة
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {(checkPermission('manage_users') || user?.role === 'admin') && (
            <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigate('notifications')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      إرسال الإشعارات
                    </h3>
                    <p className="text-sm text-gray-600">
                      إرسال رسائل وتنبيهات للمستخدمين
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-gray-600 relative z-10">
        <p>Ahmed A Alrjele</p>
        <p>Founder & CEO</p>
        <p>Al-tiryak Al-shafi Pharmacy</p>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}
    </div>
  );
};

export default Dashboard;
