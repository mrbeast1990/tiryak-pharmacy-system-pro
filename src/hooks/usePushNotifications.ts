import { useEffect } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

// Constants
const PERMISSION_KEY = 'push_notification_permission_requested';
const PERMISSION_STATUS_KEY = 'notification_permission_status';
const CRASH_COUNT_KEY = 'notification_crash_count';
const LAST_REQUEST_TIME_KEY = 'last_permission_request_time';

// Helper function to check if app is in foreground
const isAppInForeground = () => {
  return document.visibilityState === 'visible';
};

// Helper function to prevent rapid requests
const canRequestPermission = async (): Promise<boolean> => {
  const { value } = await Preferences.get({ key: LAST_REQUEST_TIME_KEY });
  if (!value) return true;
  
  const lastRequestTime = parseInt(value, 10);
  const now = Date.now();
  const timeDiff = now - lastRequestTime;
  
  // Prevent requests within 5 seconds
  return timeDiff > 5000;
};

// Check notification permissions status
export const checkNotificationPermissions = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  // Web platform - use browser Notification API
  if (!Capacitor.isNativePlatform()) {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission === 'default' ? 'prompt' : Notification.permission as 'granted' | 'denied';
  }

  try {
    const { value } = await Preferences.get({ key: PERMISSION_STATUS_KEY });
    if (value) {
      return value as 'granted' | 'denied' | 'prompt';
    }

    // Check actual permission status
    const result = await PushNotifications.checkPermissions();
    const status = result.receive === 'granted' ? 'granted' : 
                   result.receive === 'denied' ? 'denied' : 'prompt';
    
    await Preferences.set({ key: PERMISSION_STATUS_KEY, value: status });
    return status;
  } catch (error) {
    console.error('❌ Error checking notification permissions:', error);
    return 'prompt';
  }
};

// Request notification permissions (manual trigger only)
export const requestNotificationPermissions = async (): Promise<boolean> => {
  // Web platform - use browser Notification API
  if (!Capacitor.isNativePlatform()) {
    if (!('Notification' in window)) {
      console.log('⚠️ Browser does not support notifications');
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      console.log('🌐 Web notification permission result:', result);
      return result === 'granted';
    } catch (error) {
      console.error('❌ Error requesting web notification permission:', error);
      return false;
    }
  }

  try {
    // Pre-request checks
    if (!isAppInForeground()) {
      console.log('⚠️ App not in foreground - skipping permission request');
      return false;
    }

    const canRequest = await canRequestPermission();
    if (!canRequest) {
      console.log('⚠️ Recent permission request detected - skipping');
      return false;
    }

    const currentStatus = await checkNotificationPermissions();
    if (currentStatus === 'denied') {
      console.log('⚠️ Permission already denied - user must enable manually');
      return false;
    }

    if (currentStatus === 'granted') {
      console.log('✅ Permission already granted');
      return true;
    }

    // Check crash count
    const { value: crashCountValue } = await Preferences.get({ key: CRASH_COUNT_KEY });
    const crashCount = parseInt(crashCountValue || '0', 10);
    
    if (crashCount > 2) {
      console.log('⚠️ Too many crashes detected - manual setup required');
      await Preferences.set({ key: PERMISSION_STATUS_KEY, value: 'denied' });
      return false;
    }

    console.log('📱 Requesting notification permissions...');
    
    // Save request time
    await Preferences.set({ 
      key: LAST_REQUEST_TIME_KEY, 
      value: Date.now().toString() 
    });

    // Wait before requesting
    await new Promise(resolve => setTimeout(resolve, 500));

    // Request push notification permission
    const pushResult = await PushNotifications.requestPermissions();
    console.log('Push permission result:', pushResult);

    if (pushResult.receive !== 'granted') {
      await Preferences.set({ key: PERMISSION_STATUS_KEY, value: 'denied' });
      return false;
    }

    // CRITICAL: Wait after granting permission to prevent crash
    console.log('⏳ Waiting 3 seconds after permission grant...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Request local notification permission
    await LocalNotifications.requestPermissions();
    
    // Wait before registration
    await new Promise(resolve => setTimeout(resolve, 500));

    // Register for push notifications
    await PushNotifications.register();
    console.log('✅ Push notifications registered');

    // Wait after registration
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Save success status
    await Preferences.set({ key: PERMISSION_STATUS_KEY, value: 'granted' });
    await Preferences.set({ key: PERMISSION_KEY, value: 'true' });
    await Preferences.set({ key: CRASH_COUNT_KEY, value: '0' }); // Reset crash count

    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    
    // Increment crash count
    const { value: crashCountValue } = await Preferences.get({ key: CRASH_COUNT_KEY });
    const crashCount = parseInt(crashCountValue || '0', 10);
    await Preferences.set({ key: CRASH_COUNT_KEY, value: (crashCount + 1).toString() });
    
    return false;
  }
};

// Send local notification (can be used without permission request)
export const sendLocalNotification = async (title: string, body: string, data?: any): Promise<void> => {
  // Web platform - use browser Notification API
  if (!Capacitor.isNativePlatform()) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: '/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png' });
      console.log('✅ Web notification sent:', title);
    } catch (error) {
      console.error('❌ Error sending web notification:', error);
    }
    return;
  }

  try {
    const status = await checkNotificationPermissions();
    if (status !== 'granted') {
      console.log('⚠️ Notification permission not granted');
      return;
    }

    await LocalNotifications.schedule({
      notifications: [{
        title,
        body,
        id: Math.floor(Math.random() * 100000),
        schedule: { at: new Date(Date.now() + 100) },
        sound: 'default',
        attachments: undefined,
        actionTypeId: '',
        extra: data || {},
      }],
    });
    
    console.log('✅ Local notification sent:', title);
  } catch (error) {
    console.error('❌ Error sending local notification:', error);
  }
};

// Initialize push notification system (for event listeners only)
export const usePushNotifications = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) {
      return;
    }

    console.log('🔔 Initializing push notification listeners...');

    let listenerHandles: any[] = [];

    const setupListeners = async () => {
      try {
        // Registration success
        const registrationHandle = await PushNotifications.addListener(
          'registration',
          async (token: Token) => {
            console.log('✅ Push registration success, token:', token.value);
            
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ fcm_token: token.value })
                .eq('id', user.id);

              if (error) {
                console.error('❌ Error saving FCM token:', error);
              } else {
                console.log('✅ FCM token saved to database');
              }
            } catch (error) {
              console.error('❌ Error in token save:', error);
            }
          }
        );
        listenerHandles.push(registrationHandle);

        // Registration error
        const registrationErrorHandle = await PushNotifications.addListener(
          'registrationError',
          (error: any) => {
            console.error('❌ Push registration error:', error);
          }
        );
        listenerHandles.push(registrationErrorHandle);

        // Push notification received
        const pushReceivedHandle = await PushNotifications.addListener(
          'pushNotificationReceived',
          async (notification: PushNotificationSchema) => {
            console.log('📩 Push notification received:', notification);
            
            // Show local notification when app is in foreground
            if (isAppInForeground()) {
              await sendLocalNotification(
                notification.title || 'New Notification',
                notification.body || '',
                notification.data
              );
            }
          }
        );
        listenerHandles.push(pushReceivedHandle);

        // Push notification action performed
        const pushActionHandle = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('👆 Push notification action performed:', notification);
          }
        );
        listenerHandles.push(pushActionHandle);

        console.log('✅ Push notification listeners registered');
      } catch (error) {
        console.error('❌ Error setting up push notification listeners:', error);
      }
    };

    setupListeners();

    return () => {
      console.log('🧹 Cleaning up push notification listeners...');
      listenerHandles.forEach(handle => {
        if (handle && typeof handle.remove === 'function') {
          handle.remove();
        }
      });
    };
  }, [user]);

  return {
    sendLocalNotification,
  };
};
