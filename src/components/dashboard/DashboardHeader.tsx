
import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Settings, LogOut, User } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import NotificationDisplay from '@/components/NotificationDisplay';

interface DashboardHeaderProps {
  onOpenProfile: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onOpenProfile }) => {
  const { language, toggleLanguage, t } = useLanguageStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 space-x-reverse">
            <img 
              src="/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png" 
              alt="Al-Tiryak Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-gray-900">
              {t('pharmacy.name')}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-sm text-gray-600">
              {language === 'ar' ? 'مرحباً' : 'Welcome'}, {user?.name}
            </span>
            
            <NotificationDisplay />
            
            <Button
              onClick={toggleLanguage}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm">{t('language')}</span>
            </Button>
            
            <Button
              onClick={onOpenProfile}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">{t('profile.title')}</span>
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">{t('logout')}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
