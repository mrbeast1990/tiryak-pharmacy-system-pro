
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import SafeWrapper from './SafeWrapper';
import ProfileModal from './ProfileModal';
import NotificationPromptCard from './NotificationPromptCard';
import ShortageManager from './ShortageManager';
import SuppliesShortageManager from './SuppliesShortageManager';
import RevenueManager from './RevenueManager';
import ReportsPage from './ReportsPage';
import NotificationSender from './NotificationSender';
import DashboardHeader from './dashboard/DashboardHeader';
import ActionCards from './dashboard/ActionCards';
import AdminTools from './dashboard/AdminTools';
import DashboardFooter from './dashboard/DashboardFooter';
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
  const { loadMedicines, fetchRevenues } = usePharmacyStore();
  
  usePushNotifications();

  useEffect(() => {
    loadMedicines();
    fetchRevenues();
  }, [loadMedicines, fetchRevenues]);

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

  if (currentPage === 'supplies-shortages') {
    return <SuppliesShortageManager onBack={handleBack} />;
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
    <SafeWrapper name="Dashboard">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DashboardHeader
          onOpenProfile={() => setShowProfileModal(true)}
        />

        <main className="max-w-3xl mx-auto px-4 py-4">
          <NotificationPromptCard />
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
    </SafeWrapper>
  );
};

export default Dashboard;
