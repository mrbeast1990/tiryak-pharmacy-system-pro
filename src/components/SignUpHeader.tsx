
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/store/languageStore';
import { ArrowRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SignUpHeader: React.FC = () => {
  const { language, toggleLanguage } = useLanguageStore();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
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
  );
};

export default SignUpHeader;
