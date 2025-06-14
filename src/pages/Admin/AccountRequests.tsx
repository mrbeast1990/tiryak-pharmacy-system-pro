
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const fetchAccountRequests = async () => {
  const { data, error } = await supabase
    .from('account_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
    
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const AccountRequests: React.FC = () => {
  const { checkPermission } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const canManageUsers = checkPermission('manage_users'); 

  useEffect(() => {
    if (!canManageUsers) {
      toast({
        title: "غير مصرح به",
        description: "ليس لديك الصلاحية للوصول إلى هذه الصفحة.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [canManageUsers, navigate, toast]);

  const { data: requests, isLoading, isError, error } = useQuery({
      queryKey: ['accountRequests'], 
      queryFn: fetchAccountRequests,
      enabled: canManageUsers,
  });

  const handleApprove = (id: string) => {
    console.log(`Approving request ${id}`);
    toast({ title: "قيد التطوير", description: "سيتم تنفيذ وظيفة القبول قريبًا." });
  };

  const handleReject = (id: string) => {
    console.log(`Rejecting request ${id}`);
    toast({ title: "قيد التطوير", description: "سيتم تنفيذ وظيفة الرفض قريبًا." });
  };
  
  if (!canManageUsers) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>مراجعة طلبات الحسابات الجديدة</CardTitle>
            <CardDescription>الطلبات التالية في انتظار المراجعة للقبول أو الرفض.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="flex justify-center items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {isError && <div className="text-red-600 bg-red-50 p-4 rounded-md text-center">حدث خطأ أثناء جلب البيانات: {error.message}</div>}
            {requests && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم الكامل</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>تاريخ الطلب</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length > 0 ? requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.full_name}</TableCell>
                        <TableCell>{req.email}</TableCell>
                        <TableCell>{req.phone}</TableCell>
                        <TableCell>{new Date(req.created_at).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="text-center space-x-2 space-x-reverse">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleApprove(req.id)}>
                            <UserCheck className="ml-2 h-4 w-4" />
                            قبول
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleReject(req.id)}>
                            <UserX className="ml-2 h-4 w-4" />
                            رفض
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-16">
                          لا توجد طلبات جديدة للمراجعة حاليًا.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountRequests;

