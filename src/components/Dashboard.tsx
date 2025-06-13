
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RevenueManager from './RevenueManager';
import ShortageManager from './ShortageManager';
import ReportsPage from './ReportsPage';

interface DashboardProps {
  onNavigate?: (route: string) => void;
  user?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user: propUser }) => {
  const { language, t } = useLanguageStore();
  const { user: storeUser } = useAuthStore();
  const { medicines, revenues } = usePharmacyStore();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const user = propUser || storeUser;

  // Fix: Use 'shortage' instead of 'out_of_stock'
  const shortagesCount = medicines.filter(medicine => medicine.status === 'shortage').length;
  const availableCount = medicines.filter(medicine => medicine.status === 'available').length;

  // Calculate today's revenue
  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = revenues.filter(revenue => revenue.date === today)
                             .reduce((sum, revenue) => sum + revenue.amount, 0);

  // Calculate total revenues
  const totalRevenues = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);

  const handleNavigation = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      setCurrentPage(route);
    }
  };

  const handleBack = () => {
    setCurrentPage('dashboard');
  };

  if (currentPage === 'shortages') {
    return <ShortageManager onBack={handleBack} />;
  }

  if (currentPage === 'revenue') {
    return <RevenueManager onBack={handleBack} />;
  }

  if (currentPage === 'reports') {
    return <ReportsPage onBack={handleBack} />;
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{t('welcome')} {user?.name}</h1>
            </div>
            <div>
              <Button onClick={() => {
                localStorage.removeItem('auth');
                navigate('/');
              }} variant="destructive" size="sm">
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Shortages */}
          <Card className="card-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{shortagesCount}</div>
              <div className="text-sm text-gray-600">{t('dashboard.shortages')}</div>
            </CardContent>
          </Card>

          {/* Available */}
          <Card className="card-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{availableCount}</div>
              <div className="text-sm text-gray-600">{t('dashboard.available')}</div>
            </CardContent>
          </Card>

          {/* Today Revenue */}
          <Card className="card-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{todayRevenue} JD</div>
              <div className="text-sm text-gray-600">{t('dashboard.todayRevenue')}</div>
            </CardContent>
          </Card>

          {/* Total Revenues */}
          <Card className="card-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{totalRevenues} JD</div>
              <div className="text-sm text-gray-600">{t('dashboard.totalRevenues')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Medicine Shortages Card */}
          <Card 
            className="card-shadow cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => handleNavigation('shortages')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('dashboard.registerShortage')}
              </h3>
            </CardContent>
          </Card>

          {/* Revenue Management Card */}
          <Card 
            className="card-shadow cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => handleNavigation('revenue')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('dashboard.registerRevenue')}
              </h3>
            </CardContent>
          </Card>

          {/* Reports Card - Smaller */}
          <Card 
            className="card-shadow cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => handleNavigation('reports')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {t('dashboard.reports')}
              </h3>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
