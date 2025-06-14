
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { User, Shield, Clock, Fingerprint, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Preferences } from '@capacitor/preferences';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [isCheckingFingerprint, setIsCheckingFingerprint] = useState(true);
  const { language } = useLanguageStore();
  const { toast } = useToast();

  useEffect(() => {
    const checkFingerprintStatus = async () => {
      setIsCheckingFingerprint(true);
      const { value } = await Preferences.get({ key: 'fingerprint-enabled' });
      setFingerprintEnabled(value === 'true');
      setIsCheckingFingerprint(false);
    };

    if (isOpen) {
      checkFingerprintStatus();
    }
  }, [isOpen]);

  const handleFingerprintToggle = async (enabled: boolean) => {
    setFingerprintEnabled(enabled); // Optimistic UI update

    let NativeBiometric;
    try {
      const biometricModule = await import('capacitor-native-biometric');
      NativeBiometric = biometricModule.NativeBiometric;
    } catch (e) {
      console.error("Could not load capacitor-native-biometric. This is expected on web.", e);
      NativeBiometric = null;
    }

    if (!NativeBiometric) {
      toast({
        title: language === 'ar' ? 'غير مدعوم' : 'Not Supported',
        description: language === 'ar' ? 'تسجيل الدخول بالبصمة متاح فقط على تطبيق الجوال.' : 'Fingerprint login is only available on the mobile app.',
        variant: 'destructive',
      });
      setFingerprintEnabled(false);
      return;
    }

    try {
      const { isAvailable } = await NativeBiometric.isAvailable();
      if (!isAvailable) {
        toast({
          title: language === 'ar' ? "البصمة غير متاحة" : "Biometrics Not Available",
          description: language === 'ar' ? "جهازك لا يدعم المصادقة بالبصمة." : "Your device does not support biometric authentication.",
          variant: "destructive",
        });
        setFingerprintEnabled(false);
        return;
      }

      if (enabled) {
        await NativeBiometric.verifyIdentity({
          reason: language === 'ar' ? 'للسماح بتسجيل الدخول السريع' : 'To allow quick sign-in',
          title: language === 'ar' ? 'تأكيد الهوية' : 'Confirm Identity',
        });
        
        await Preferences.set({ key: 'fingerprint-enabled', value: 'true' });
        await Preferences.set({ key: 'fingerprint-user-id', value: user.id });

        toast({
          title: language === 'ar' ? "تم تفعيل البصمة" : "Fingerprint Enabled",
          description: language === 'ar' ? "يمكنك الآن تسجيل الدخول باستخدام بصمتك." : "You can now log in using your fingerprint.",
        });
      } else {
        await Preferences.remove({ key: 'fingerprint-enabled' });
        await Preferences.remove({ key: 'fingerprint-user-id' });

        toast({
          title: language === 'ar' ? "تم إلغاء تفعيل البصمة" : "Fingerprint Disabled",
        });
      }
    } catch (error) {
      setFingerprintEnabled(!enabled); // Revert on error
      
      toast({
        title: language === 'ar' ? "فشل التحقق" : "Verification Failed",
        description: language === 'ar' ? "لم نتمكن من التحقق من هويتك. يرجى المحاولة مرة أخرى." : "Could not verify your identity. Please try again.",
        variant: "destructive",
      });
      console.error("Biometric Error:", error);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: language === 'ar' ? 'مدير' : 'Admin',
      manager: language === 'ar' ? 'مدير فرع' : 'Manager',
      user: language === 'ar' ? 'مستخدم' : 'User',
      ahmad: language === 'ar' ? 'أحمد الرجيلي' : 'Ahmad Rajili',
      ahmad_rajili: language === 'ar' ? 'أحمد الرجيلي' : 'Ahmad Rajili',
      morning_shift: language === 'ar' ? 'فترة صباحية' : 'Morning Shift',
      evening_shift: language === 'ar' ? 'فترة مسائية' : 'Evening Shift',
      night_shift: language === 'ar' ? 'فترة ليلية' : 'Night Shift',
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 space-x-reverse">
            <User className="w-5 h-5" />
            <span>{language === 'ar' ? 'معلومات الحساب' : 'Account Information'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Profile Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      {language === 'ar' ? 'الدور' : 'Role'}
                    </span>
                  </div>
                  <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">
                      {language === 'ar' ? 'آخر دخول' : 'Last Login'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-US') : (language === 'ar' ? 'غير متوفر' : 'Not available')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fingerprint Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 space-x-reverse text-base">
                <Fingerprint className="w-5 h-5" />
                <span>{language === 'ar' ? 'إعدادات البصمة' : 'Fingerprint Settings'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {language === 'ar' ? 'تسجيل الدخول بالبصمة' : 'Fingerprint Login'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {language === 'ar' ? 'استخدم بصمة الإصبع لتسجيل الدخول' : 'Use fingerprint to sign in'}
                  </p>
                </div>
                <Switch
                  checked={fingerprintEnabled}
                  onCheckedChange={handleFingerprintToggle}
                  disabled={isCheckingFingerprint}
                />
              </div>
              
              {isCheckingFingerprint ? (
                 <div className="mt-3 p-2 bg-yellow-50 rounded-lg text-center">
                  <span className="text-sm text-yellow-700">
                    {language === 'ar' ? 'جارٍ التحقق من حالة البصمة...' : 'Checking fingerprint status...'}
                  </span>
                </div>
              ) : fingerprintEnabled && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      {language === 'ar' ? 'البصمة مفعلة' : 'Fingerprint Active'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full pharmacy-gradient">
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;

