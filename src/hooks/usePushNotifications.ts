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
        // Wait for platform to be ready (critical for Android 13+)
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Platform ready, checking notification permissions...');

        // Request permission for push notifications
        let permStatus = await PushNotifications.checkPermissions();
        console.log('📋 Current permission status:', permStatus);

        if (permStatus.receive === 'prompt') {
          try {
            console.log('🔔 Requesting push notification permission...');
            permStatus = await PushNotifications.requestPermissions();
            console.log('✅ Push notification permission result:', permStatus);
            
            // CRITICAL: Wait after permission grant to prevent crash on Android 13+
            // This allows Android to complete the permission lifecycle
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('✅ Permission lifecycle completed');
          } catch (permError) {
            console.error('❌ Error requesting push notification permission:', permError);
            return;
          }
        }

        if (permStatus.receive !== 'granted') {
          console.log('❌ Push notification permission denied or not granted');
          return;
        }

        console.log('✅ Push notification permission granted, proceeding with setup...');

        // Request permission for local notifications with error handling
        try {
          // Add delay before local notification permission request
          await new Promise(resolve => setTimeout(resolve, 300));
          const localPermStatus = await LocalNotifications.requestPermissions();
          console.log('✅ Local notification permission:', localPermStatus);
          
          // Wait after local permission
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (localError) {
          console.error('❌ Error requesting local notification permission:', localError);
          // Continue even if local notifications fail
        }

        // Register with FCM/APNS with error handling
        try {
          console.log('📱 Starting FCM/APNS registration...');
          await PushNotifications.register();
          console.log('✅ Push notifications registration initiated');
          
          // Wait after registration
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (registerError) {
          console.error('❌ Error registering push notifications:', registerError);
          return;
        }

        // Listen for registration
        PushNotifications.addListener('registration', async (token) => {
          console.log('✅ Push notification registration token:', token.value);
          
          // Save token to database with error handling
          try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
              console.error('❌ Error getting user:', userError);
              return;
            }
            
            if (user) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ fcm_token: token.value })
                .eq('id', user.id);
              
              if (updateError) {
                console.error('❌ Error saving FCM token:', updateError);
              } else {
                console.log('✅ FCM token saved to database successfully');
              }
            }
          } catch (dbError) {
            console.error('❌ Database error while saving FCM token:', dbError);
          }
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push notification registration error:', error);
        });

        // Listen for push notifications received (show in system notification bar & lock screen)
        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          console.log('📱 Push notification received:', notification);
          
          try {
            // Check if notifications are enabled for this user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (!userError && user) {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('notifications_enabled')
                .eq('id', user.id)
                .single();
              
              if (!profileError && profile && !profile.notifications_enabled) {
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
          } catch (error) {
            console.error('❌ Error handling push notification:', error);
          }
        });

        // Listen for notification tap (when user taps notification)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('📲 Notification tapped:', notification);
          
          // Open the app - it will automatically navigate to dashboard if logged in
          // The app's main routing will handle navigation based on auth state
          console.log('✅ App opened from notification');
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