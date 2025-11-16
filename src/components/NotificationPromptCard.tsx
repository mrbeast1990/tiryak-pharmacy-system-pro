import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { useToast } from '@/hooks/use-toast';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { checkNotificationPermissions, requestNotificationPermissions } from '@/hooks/usePushNotifications';

const DISMISS_KEY = 'notification_prompt_dismissed_until';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const NotificationPromptCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { language } = useLanguageStore();
  const { toast } = useToast();

  useEffect(() => {
    const checkVisibility = async () => {
      // Only show on mobile
      if (!Capacitor.isNativePlatform()) {
        setIsVisible(false);
        return;
      }

      try {
        // Check if dismissed recently
        const { value: dismissedUntil } = await Preferences.get({ key: DISMISS_KEY });
        if (dismissedUntil) {
          const dismissedTime = parseInt(dismissedUntil, 10);
          if (Date.now() < dismissedTime) {
            setIsVisible(false);
            return;
          }
        }

        // Check permission status
        const status = await checkNotificationPermissions();
        
        // Show card only if permission is 'prompt' (not granted or denied)
        setIsVisible(status === 'prompt');
      } catch (error) {
        console.error('❌ Error checking notification prompt visibility:', error);
        setIsVisible(false);
      }
    };

    checkVisibility();
  }, []);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    
    try {
      const success = await requestNotificationPermissions();
      
      if (success) {
        toast({
          title: language === 'ar' ? '✅ تم تفعيل الإشعارات' : '✅ Notifications Enabled',
          description: language === 'ar' 
            ? 'ستتلقى الآن إشعارات فورية' 
            : 'You will now receive instant notifications',
        });
        setIsVisible(false);
      } else {
        toast({
          title: language === 'ar' ? '❌ فشل تفعيل الإشعارات' : '❌ Failed to Enable Notifications',
          description: language === 'ar'
            ? 'يرجى المحاولة من إعدادات الحساب'
            : 'Please try again from account settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
      toast({
        title: language === 'ar' ? '❌ حدث خطأ' : '❌ Error Occurred',
        description: language === 'ar'
          ? 'تعذر تفعيل الإشعارات'
          : 'Could not enable notifications',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = async () => {
    try {
      const dismissUntil = Date.now() + DISMISS_DURATION;
      await Preferences.set({ 
        key: DISMISS_KEY, 
        value: dismissUntil.toString() 
      });
      setIsVisible(false);
      
      toast({
        title: language === 'ar' ? 'تم التأجيل' : 'Dismissed',
        description: language === 'ar'
          ? 'سنذكرك لاحقاً بتفعيل الإشعارات'
          : 'We\'ll remind you later to enable notifications',
      });
    } catch (error) {
      console.error('❌ Error dismissing notification prompt:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="mb-6 border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4 space-x-reverse">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-900 mb-1">
              {language === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}
            </h3>
            <p className="text-sm text-emerald-700 mb-3">
              {language === 'ar' 
                ? 'احصل على تحديثات فورية حول النواقص والإيرادات'
                : 'Get instant updates about shortages and revenues'}
            </p>
            
            <div className="flex space-x-2 space-x-reverse">
              <Button
                onClick={handleEnableNotifications}
                disabled={isRequesting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                {isRequesting 
                  ? (language === 'ar' ? 'جاري التفعيل...' : 'Enabling...')
                  : (language === 'ar' ? 'تفعيل الآن' : 'Enable Now')
                }
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-emerald-700 hover:text-emerald-900"
              >
                {language === 'ar' ? 'لاحقاً' : 'Later'}
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-emerald-600 hover:text-emerald-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPromptCard;
