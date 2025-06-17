
import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
}

const NotificationDisplay: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const { toast } = useToast();

  // جلب الإشعارات
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_read_status')
        .select(`
          notification_id,
          is_read,
          read_at,
          notifications (
            id,
            title,
            message,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false, foreignTable: 'notifications' });

      if (error) {
        console.error('خطأ في جلب الإشعارات:', error);
        return;
      }

      const formattedNotifications = data?.map(item => ({
        id: item.notifications?.id || '',
        title: item.notifications?.title || '',
        message: item.notifications?.message || '',
        created_at: item.notifications?.created_at || '',
        is_read: item.is_read,
        read_at: item.read_at
      })) || [];

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    }
  };

  // تحديد الإشعار كمقروء
  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_read_status')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('notification_id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('خطأ في تحديث الإشعار:', error);
        return;
      }

      // تحديث حالة الإشعارات محلياً
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('خطأ في تحديث الإشعار:', error);
    }
  };

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }

      toast({
        title: language === 'ar' ? "تم التحديث" : "Updated",
        description: language === 'ar' ? "تم تحديد جميع الإشعارات كمقروءة" : "All notifications marked as read",
      });
    } catch (error) {
      console.error('خطأ في تحديث الإشعارات:', error);
    }
  };

  // الاستماع للإشعارات الجديدة
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_read_status',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('تم تلقي إشعار جديد:', payload);
          fetchNotifications();
          
          // إظهار toast للإشعارات الجديدة
          if (payload.eventType === 'INSERT') {
            toast({
              title: language === 'ar' ? "إشعار جديد" : "New Notification",
              description: language === 'ar' ? "لديك إشعار جديد" : "You have a new notification",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, language, toast]);

  if (!user) return null;

  return (
    <div className="relative">
      {/* أيقونة الإشعارات */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* قائمة الإشعارات */}
      {showNotifications && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-hidden z-50">
          <Card className="shadow-lg">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {language === 'ar' ? 'قراءة الكل' : 'Mark all read'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className={`text-xs mt-1 ${
                            !notification.is_read ? 'text-blue-700' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationDisplay;
