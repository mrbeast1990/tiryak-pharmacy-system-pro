
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
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

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => 
      supabase.functions.invoke('approve-request', {
        body: { requestId },
      }),
    onSuccess: (response) => {
      const { data, error } = response;
      if (error) {
        toast({ title: "خطأ", description: (error as any).message || "فشلت عملية القبول.", variant: "destructive" });
      } else {
        toast({ title: "نجاح", description: data.message || "تمت الموافقة على الطلب وإرسال دعوة للمستخدم." });
        queryClient.invalidateQueries({ queryKey: ['accountRequests'] });
      }
    },
    onError: (error) => {
      toast({ title: "خطأ فادح", description: error.message || "حدث خطأ غير متوقع.", variant: "destructive" });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => 
      supabase.functions.invoke('reject-request', {
        body: { requestId },
      }),
    onSuccess: (response) => {
      const { data, error } = response;
      if (error) {
        toast({ title: "خطأ", description: (error as any).message || "فشلت عملية الرفض.", variant: "destructive" });
      } else {
        toast({ title: "نجاح", description: "تم رفض الطلب بنجاح." });
        queryClient.invalidateQueries({ queryKey: ['accountRequests'] });
      }
    },
    onError: (error) => {
      toast({ title: "خطأ فادح", description: error.message || "حدث خطأ غير متوقع.", variant: "destructive" });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  const handleApprove = (id: string) => {
    setProcessingId(id);
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    setProcessingId(id);
    rejectMutation.mutate(id);
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" 
                            onClick={() => handleApprove(req.id)}
                            disabled={processingId === req.id}
                          >
                            {processingId === req.id && approveMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <UserCheck className="ml-2 h-4 w-4" />}
                            قبول
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" 
                            onClick={() => handleReject(req.id)}
                            disabled={processingId === req.id}
                          >
                            {processingId === req.id && rejectMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <UserX className="ml-2 h-4 w-4" />}
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
