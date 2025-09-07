import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

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
        PushNotifications.addListener('registration', (token) => {
          console.log('Push notification registration token:', token.value);
          // Here you could send the token to your backend
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push notification registration error:', error);
        });

        // Listen for push notifications received while app is open
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
          
          // Show local notification for immediate visibility
          LocalNotifications.schedule({
            notifications: [{
              title: notification.title || 'إشعار جديد',
              body: notification.body || '',
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 100) }, // Small delay
              sound: 'default',
              attachments: [],
              actionTypeId: '',
              extra: notification.data
            }]
          });

          // Also show toast for in-app notification
          toast({
            title: notification.title || 'إشعار جديد',
            description: notification.body || '',
          });
        });

        // Listen for notification tap (when user taps notification)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed:', notification);
          // Handle notification tap - could navigate to specific page
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
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 100) },
          sound: 'default',
          attachments: [],
          actionTypeId: '',
          extra: data
        }]
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  return {
    sendLocalNotification
  };
};