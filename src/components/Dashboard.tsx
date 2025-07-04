
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import ProfileModal from './ProfileModal';
import ShortageManager from './ShortageManager';
import RevenueManager from './RevenueManager';
import ReportsPage from './ReportsPage';
import NotificationSender from './NotificationSender';
import DashboardHeader from './dashboard/DashboardHeader';
import ActionCards from './dashboard/ActionCards';
import AdminTools from './dashboard/AdminTools';
import DashboardFooter from './dashboard/DashboardFooter';
import BackgroundLogo from './dashboard/BackgroundLogo';
import OfflineIndicator from './OfflineIndicator';

interface DashboardProps {
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const { logout } = useAuthStore();
  const { language, toggleLanguage, t } = useLanguageStore();
  const { syncOfflineData } = useOfflineSync();

  // الاستماع لأحداث المزامنة من Service Worker
  useEffect(() => {
    const handleSyncEvent = () => {
      syncOfflineData();
    };

    window.addEventListener('syncOfflineData', handleSyncEvent);
    return () => {
      window.removeEventListener('syncOfflineData', handleSyncEvent);
    };
  }, [syncOfflineData]);

  const handleLogout = () => {
    logout();
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
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

  if (currentPage === 'notifications') {
    return <NotificationSender onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <BackgroundLogo />

      <DashboardHeader
        onOpenProfile={() => setShowProfileModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <ActionCards onNavigate={handleNavigate} t={t} />
        <AdminTools onNavigate={handleNavigate} t={t} />
      </main>

      <DashboardFooter />

      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}
      
      <OfflineIndicator />
    </div>
  );
};

export default Dashboard;
