
import React from 'react';
import { Pill, DollarSign, CheckCircle, Package, BookOpen, CreditCard, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

interface ActionCardsProps {
  onNavigate: (page: string) => void;
  t: (key: string) => string;
}

const ActionCards: React.FC<ActionCardsProps> = ({ onNavigate, t }) => {
  const { checkPermission, user } = useAuthStore();
  const navigate = useNavigate();

  const cards = [
    {
      id: 'shortages',
      title: t('dashboard.registerShortage'),
      description: t('dashboard.registerShortage.desc'),
      icon: Pill,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      show: checkPermission('manage_shortages') || user?.role === 'admin',
      onClick: () => onNavigate('shortages'),
    },
    {
      id: 'supplies',
      title: 'تسجيل نواقص المستلزمات',
      description: 'إدارة وتسجيل نواقص المستلزمات',
      icon: Package,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      show: checkPermission('manage_shortages') || user?.role === 'admin',
      onClick: () => onNavigate('supplies-shortages'),
    },
    {
      id: 'tiryak-guide',
      title: 'دليل الترياق',
      description: 'البحث عن الأدوية والبدائل ومستشار AI',
      icon: BookOpen,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      show: true,
      onClick: () => onNavigate('tiryak-guide'),
    },
    {
      id: 'revenue',
      title: t('dashboard.registerRevenue'),
      description: t('dashboard.registerRevenue.desc'),
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      show: checkPermission('register_revenue_all') || 
            checkPermission('register_revenue_morning') || 
            checkPermission('register_revenue_evening') || 
            checkPermission('register_revenue_night') || 
            user?.role === 'admin' || 
            user?.role === 'ahmad_rajili',
      onClick: () => onNavigate('revenue'),
    },
    {
      id: 'payments',
      title: 'السدادات والمصاريف',
      description: 'سدادات الشركات وإدارة المصاريف',
      icon: CreditCard,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      show: user?.role === 'admin' || user?.role === 'ahmad_rajili',
      onClick: () => onNavigate('payments'),
    },
    {
      id: 'order-builder',
      title: 'إنشاء الطلبيات',
      description: 'تحويل عروض الأسعار إلى طلبيات شراء',
      icon: ShoppingCart,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      show: user?.role === 'admin' || user?.role === 'ahmad_rajili',
      onClick: () => onNavigate('order-builder'),
    },
    {
      id: 'available',
      title: 'الأصناف التي تم توفيرها',
      description: 'عرض وإدارة الأصناف المتوفرة',
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      show: true,
      onClick: () => navigate('/available-medicines'),
    },
  ];

  return (
    <div className="space-y-2 mb-4">
      {cards.filter(card => card.show).map((card) => {
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

export default ActionCards;
