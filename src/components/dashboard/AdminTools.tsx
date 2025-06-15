
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface AdminToolsProps {
  onNavigate: (page: string) => void;
  t: (key: string) => string;
}

const AdminTools: React.FC<AdminToolsProps> = ({ onNavigate, t }) => {
  const navigate = useNavigate();
  const { checkPermission, user } = useAuthStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {(checkPermission('view_reports') || user?.role === 'admin') && (
        <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('reports')}>
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
                  {t('dashboard.reports.desc')}
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
                  {t('dashboard.reviewRequests.title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('dashboard.reviewRequests.desc')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {(checkPermission('manage_users') || user?.role === 'admin') && (
        <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('notifications')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t('dashboard.sendNotifications.title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('dashboard.sendNotifications.desc')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminTools;
