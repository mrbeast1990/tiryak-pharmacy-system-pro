
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { User, Fingerprint, Shield, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';
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

  const handleFingerprintToggle = () => {
    if (!fingerprintEnabled) {
      // Check if fingerprint API is available
      if ('credentials' in navigator && 'create' in navigator.credentials) {
        // Simulate fingerprint enrollment
        toast({
          title: language === 'ar' ? "تم تفعيل البصمة" : "Fingerprint Activated",
          description: language === 'ar' ? "تم تفعيل تسجيل الدخول بالبصمة بنجاح" : "Fingerprint login successfully activated",
        });
        setFingerprintEnabled(true);
      } else {
        toast({
          title: language === 'ar' ? "غير مدعوم" : "Not Supported",
          description: language === 'ar' ? "هذا الجهاز لا يدعم البصمة" : "This device doesn't support fingerprint",
          variant: "destructive",
        });
      }
    } else {
      setFingerprintEnabled(false);
      toast({
        title: language === 'ar' ? "تم إلغاء البصمة" : "Fingerprint Deactivated",
        description: language === 'ar' ? "تم إلغاء تفعيل البصمة" : "Fingerprint login deactivated",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 space-x-reverse">
            <User className="w-5 h-5" />
            <span>{language === 'ar' ? 'معلومات الحساب' : 'Profile Information'}</span>
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'عرض وإدارة معلومات حسابك الشخصي' : 'View and manage your personal account information'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2 space-x-reverse">
                <User className="w-4 h-4" />
                <span>{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{language === 'ar' ? 'الاسم:' : 'Name:'}</p>
                  <p className="text-sm text-gray-600">{user?.name || 'غير محدد'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</p>
                  <p className="text-sm text-gray-600">{user?.email || 'غير محدد'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Shield className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{language === 'ar' ? 'الدور:' : 'Role:'}</p>
                  <p className="text-sm text-gray-600">{user?.role || 'غير محدد'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{language === 'ar' ? 'آخر دخول:' : 'Last Login:'}</p>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fingerprint Security Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2 space-x-reverse">
                <Fingerprint className="w-4 h-4" />
                <span>{language === 'ar' ? 'الأمان البيومتري' : 'Biometric Security'}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {language === 'ar' ? 'إدارة تسجيل الدخول بالبصمة' : 'Manage fingerprint login'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Fingerprint className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {language === 'ar' ? 'تسجيل الدخول بالبصمة' : 'Fingerprint Login'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fingerprintEnabled 
                        ? (language === 'ar' ? 'مفعل' : 'Enabled')
                        : (language === 'ar' ? 'غير مفعل' : 'Disabled')
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {fingerprintEnabled ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <Button
                    size="sm"
                    variant={fingerprintEnabled ? "destructive" : "default"}
                    onClick={handleFingerprintToggle}
                    className="text-xs"
                  >
                    {fingerprintEnabled 
                      ? (language === 'ar' ? 'إلغاء' : 'Disable')
                      : (language === 'ar' ? 'تفعيل' : 'Enable')
                    }
                  </Button>
                </div>
              </div>
              
              {!fingerprintEnabled && (
                <div className="mt-3 p-2 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700">
                    {language === 'ar' 
                      ? 'تفعيل البصمة يتطلب جهاز يدعم الاستشعار البيومتري'
                      : 'Fingerprint activation requires a device with biometric sensor support'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
