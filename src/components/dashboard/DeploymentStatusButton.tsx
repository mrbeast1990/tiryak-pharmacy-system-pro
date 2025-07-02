import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud, Loader2 } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import DeploymentStatus from '@/components/DeploymentStatus';

const DeploymentStatusButton: React.FC = () => {
  const [showDeploymentStatus, setShowDeploymentStatus] = useState(false);
  const { language } = useLanguageStore();
  const { checkPermission } = useAuthStore();

  // Only show for users with admin permissions
  const canViewDeployment = checkPermission('manage_users') || checkPermission('view_all');

  if (!canViewDeployment) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setShowDeploymentStatus(true)}
        variant="ghost"
        size="sm"
        className="flex items-center space-x-2 space-x-reverse"
        title={language === 'ar' ? 'حالة النشر' : 'Deployment Status'}
      >
        <Cloud className="w-4 h-4" />
        <span className="hidden md:block text-xs">
          {language === 'ar' ? 'النشر' : 'Deploy'}
        </span>
      </Button>

      {showDeploymentStatus && (
        <DeploymentStatus onClose={() => setShowDeploymentStatus(false)} />
      )}
    </>
  );
};

export default DeploymentStatusButton;