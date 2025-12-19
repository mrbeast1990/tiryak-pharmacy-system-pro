import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe, LogOut } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import NotificationCenter from '@/components/NotificationCenter';
import pharmacyLogo from '@/assets/pharmacy-logo.png';

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
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Title */}
          <Button
            onClick={onOpenProfile}
            variant="ghost"
            className="flex items-center gap-2 hover:bg-accent/50 p-1.5 rounded-lg -ml-1.5"
          >
            <img 
              src={pharmacyLogo}
              alt="Al-Tiryak Logo" 
              className="w-9 h-9 object-contain"
            />
            <div className="text-right">
              <h1 className="text-sm font-bold text-foreground leading-tight">
                {t('pharmacy.name')}
              </h1>
              <p className="text-xs text-muted-foreground">
                مرحباً {user?.name || 'مدير'}
              </p>
            </div>
          </Button>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <NotificationCenter />
            
            <Button
              onClick={toggleLanguage}
              variant="ghost"
              size="icon"
              className="w-9 h-9"
            >
              <Globe className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
