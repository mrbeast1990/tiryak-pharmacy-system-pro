import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  const { toast } = useToast();

  useEffect(() => {
    const initializePushNotifications = async () => {
      // Check if we're running on a mobile platform
      if (!Capacitor.isNativePlatform()) {
        console.log('Push notifications only work on mobile platforms');
        return;
      }

      try {
        // Request permission for push notifications
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('Push notification permission denied');
          return;
        }

        // Request permission for local notifications
        await LocalNotifications.requestPermissions();

        // Register with FCM/APNS
        await PushNotifications.register();

        // Listen for registration
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push notification registration token:', token.value);
          
          // Save token to database
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({ fcm_token: token.value })
              .eq('id', user.id);
            console.log('FCM token saved to database');
          }
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push notification registration error:', error);
        });

        // Listen for push notifications received (show in system notification bar & lock screen)
        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          console.log('📱 Push notification received:', notification);
          
          // Check if notifications are enabled for this user
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('notifications_enabled')
              .eq('id', user.id)
              .single();
            
            if (profile && !profile.notifications_enabled) {
              console.log('🔕 Notifications disabled for this user, skipping notification display');
              return;
            }
          }
          
          // Schedule local notification to ensure it appears in:
          // - Status bar (notification tray)
          // - Lock screen
          // - Even when app is in background/closed
          try {
            await LocalNotifications.schedule({
              notifications: [{
                title: notification.title || 'نواقصي - إشعار جديد',
                body: notification.body || '',
                id: Date.now(),
                schedule: { at: new Date(Date.now() + 100) },
                sound: 'default', // Use system default sound (calm and professional)
                smallIcon: 'ic_stat_notification', // App icon in status bar
                iconColor: '#1EAEDB', // Notification icon color
                attachments: [],
                actionTypeId: '',
                extra: notification.data,
                // Ensure notification shows on lock screen
                ongoing: false,
                autoCancel: true,
              }]
            });
            console.log('✅ System notification scheduled successfully');
          } catch (error) {
            console.error('❌ Error scheduling local notification:', error);
          }

          // Also show toast for in-app visibility (when app is open)
          toast({
            title: notification.title || 'نواقصي - إشعار جديد',
            description: notification.body || '',
          });
        });

        // Listen for notification tap (when user taps notification)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('📲 Notification tapped:', notification);
          
          // Just open the app (no specific page navigation)
          // App will automatically open to dashboard
          toast({
            title: 'مرحباً بك',
            description: 'تم فتح التطبيق',
          });
        });

      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initializePushNotifications();

    // Cleanup
    return () => {
      PushNotifications.removeAllListeners();
      LocalNotifications.removeAllListeners();
    };
  }, [toast]);

  const sendLocalNotification = async (title: string, body: string, data?: any) => {
    try {
      // Show notification in system notification bar, lock screen, and status bar
      await LocalNotifications.schedule({
        notifications: [{
          title: title || 'نواقصي',
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 100) },
          sound: 'default', // Calm system notification sound
          smallIcon: 'ic_stat_notification', // App icon
          iconColor: '#1EAEDB',
          attachments: [],
          actionTypeId: '',
          extra: data,
          ongoing: false,
          autoCancel: true,
        }]
      });
      
      console.log('✅ Local notification scheduled successfully');
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  };

  return {
    sendLocalNotification
  };
};