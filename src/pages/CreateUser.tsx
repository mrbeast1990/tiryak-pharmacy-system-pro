import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CreateUser: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userCreated, setUserCreated] = useState<any>(null);
  const { toast } = useToast();

  const createUser = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {}
      });

      if (error) {
        console.error('خطأ في استدعاء الدالة:', error);
        toast({
          title: 'خطأ',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      if (data.success) {
        setUserCreated(data);
        toast({
          title: 'نجح',
          description: data.message
        });
      } else {
        toast({
          title: 'خطأ',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('خطأ عام:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء المستخدم',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">إنشاء مستخدم مدير</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!userCreated ? (
              <Button 
                onClick={createUser} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
              </Button>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="p-4 bg-green-50 rounded-lg space-y-2">
                  <h3 className="font-semibold text-green-800">تم إنشاء المستخدم بنجاح!</h3>
                  <div><strong>البريد الإلكتروني:</strong> {userCreated.email}</div>
                  <div><strong>كلمة المرور:</strong> {userCreated.password}</div>
                  <div><strong>الاسم:</strong> {userCreated.name}</div>
                  <div><strong>الدور:</strong> {userCreated.role}</div>
                  <div><strong>معرف المستخدم:</strong> {userCreated.user?.id}</div>
                </div>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  العودة للصفحة الرئيسية
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateUser;