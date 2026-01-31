import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'ar' | 'en';
  defaultEmail?: string;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  open,
  onOpenChange,
  language,
  defaultEmail = ''
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setIsSent(true);
      toast({
        title: language === 'ar' ? 'تم الإرسال' : 'Email Sent',
        description: language === 'ar' 
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' 
          : 'Password reset link has been sent to your email',
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'حدث خطأ أثناء إرسال الرابط' : 'Failed to send reset link'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSent(false);
    setEmail(defaultEmail);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'ar' 
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور' 
              : 'Enter your email and we will send you a link to reset your password'}
          </DialogDescription>
        </DialogHeader>

        {isSent ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور' 
                : 'Check your email for the password reset link'}
            </p>
            <Button onClick={handleClose} className="w-full">
              {language === 'ar' ? 'حسناً' : 'OK'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  className={`${language === 'ar' ? 'pr-10' : 'pl-10'} h-11`}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                language === 'ar' ? 'إرسال رابط الاستعادة' : 'Send Reset Link'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
