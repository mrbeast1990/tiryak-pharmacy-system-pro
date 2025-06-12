
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { User, Shield, Clock, Fingerprint, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const { toast } = useToast();

  const handleFingerprintToggle = (enabled: boolean) => {
    setFingerprintEnabled(enabled);
    toast({
      title: language === 'ar' ? (enabled ? "تم تفعيل البصمة" : "تم إلغاء تفعيل البصمة") : (enabled ? "Fingerprint Enabled" : "Fingerprint Disabled"),
      description: language === 'ar' ? 
        (enabled ? "تم تفعيل تسجيل الدخول بالبصمة بنجاح" : "تم إلغاء تفعيل تسجيل الدخول بالبصمة") :
        (enabled ? "Fingerprint login has been enabled" : "Fingerprint login has been disabled"),
    });
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: language === 'ar' ? 'مدير' : 'Admin',
      manager: language === 'ar' ? 'مدير فرع' : 'Manager',
      user: language === 'ar' ? 'مستخدم' : 'User',
      ahmad: language === 'ar' ? 'أحمد الرجيلي' : 'Ahmad Rajili'
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
                />
              </div>
              
              {fingerprintEnabled && (
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
