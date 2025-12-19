
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface AdminToolsProps {
  onNavigate: (page: string) => void;
  t: (key: string) => string;
}

const AdminTools: React.FC<AdminToolsProps> = ({ onNavigate, t }) => {
  const navigate = useNavigate();
  const { checkPermission, user } = useAuthStore();

  const cards = [
    {
      id: 'reports',
      title: t('dashboard.reports'),
      description: t('dashboard.reports.desc'),
      icon: FileText,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      show: checkPermission('view_reports') || user?.role === 'admin',
      onClick: () => onNavigate('reports'),
    },
    {
      id: 'requests',
      title: t('dashboard.reviewRequests.title'),
      description: t('dashboard.reviewRequests.desc'),
      icon: Users,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      show: checkPermission('manage_users') || user?.role === 'admin',
      onClick: () => navigate('/admin/requests'),
    },
    {
      id: 'notifications',
      title: t('dashboard.sendNotifications.title'),
      description: t('dashboard.sendNotifications.desc'),
      icon: MessageSquare,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      show: checkPermission('manage_users') || user?.role === 'admin',
      onClick: () => onNavigate('notifications'),
    },
  ];

  const visibleCards = cards.filter(card => card.show);

  if (visibleCards.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={card.onClick}
            className="bg-card rounded-xl shadow-sm border border-border/50 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
          >
            <div className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminTools;
