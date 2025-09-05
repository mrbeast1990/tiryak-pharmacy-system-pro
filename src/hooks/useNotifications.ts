import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/store/languageStore';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { language } = useLanguageStore();

  // Fetch notifications
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
        .order('created_at', { foreignTable: 'notifications', ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      const formattedNotifications = data
        .filter(item => item.notifications)
        .map(item => ({
          id: item.notifications!.id,
          title: item.notifications!.title,
          message: item.notifications!.message,
          created_at: item.notifications!.created_at,
          is_read: item.is_read,
          read_at: item.read_at,
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };

  // Mark notification as read
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
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotificationIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);

      if (unreadNotificationIds.length === 0) return;

      const { error } = await supabase
        .from('notification_read_status')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .in('notification_id', unreadNotificationIds);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);

      toast({
        title: language === 'ar' ? "تم قراءة جميع الإشعارات" : "All notifications marked as read",
        description: language === 'ar' ? "تم تحديث حالة جميع الإشعارات" : "All notifications have been updated",
      });
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_read_status',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
          // Show toast for new notification
          toast({
            title: language === 'ar' ? "إشعار جديد" : "New Notification",
            description: language === 'ar' ? "لديك إشعار جديد" : "You have a new notification",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_read_status',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, language, toast]);

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};