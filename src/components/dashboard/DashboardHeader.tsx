import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  user: any;
  t: (key: string) => string;
  language: 'ar' | 'en';
  onLogout: () => void;
  onToggleLanguage: () => void;
  onShowProfile: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  t,
  language,
  onLogout,
  onToggleLanguage,
  onShowProfile,
}) => {
  return (
    <header className="bg-white shadow-sm border-b relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 space-x-reverse">
            <img 
              src="/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png" 
              alt="Al-Tiryak Logo" 
              className="w-10 h-10 cursor-pointer"
              onClick={onShowProfile}
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {t('pharmacy.name')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('welcome')}{' '}
                {user?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              onClick={onToggleLanguage}
              variant="outline"
              size="sm"
              className="text-xs px-1.5 py-0.5 h-5"
            >
              {language === 'ar' ? 'English' : 'عربي'}
            </Button>
            
            <Button
              onClick={onLogout}
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
  );
};

export default DashboardHeader;
