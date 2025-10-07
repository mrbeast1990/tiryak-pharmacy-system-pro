
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Pill, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface ActionCardsProps {
  onNavigate: (page: string) => void;
  t: (key: string) => string;
}

const ActionCards: React.FC<ActionCardsProps> = ({ onNavigate, t }) => {
  const { checkPermission, user } = useAuthStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {(checkPermission('manage_shortages') || user?.role === 'admin') && (
        <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('shortages')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-gray-700">{t('dashboard.registerShortage')}</p>
                <p className="text-xs text-gray-500">
                  {t('dashboard.registerShortage.desc')}
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
        <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('revenue')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-gray-700">{t('dashboard.registerRevenue')}</p>
                <p className="text-xs text-gray-500">
                  {t('dashboard.registerRevenue.desc')}
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
  );
};

export default ActionCards;
