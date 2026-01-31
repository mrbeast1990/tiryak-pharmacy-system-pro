import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Paperclip, Trash2, Check, Building2, Calendar, FileText, MoreVertical, Pencil } from 'lucide-react';
import { Payment, usePaymentsStore } from '@/store/paymentsStore';
import { useAuthStore } from '@/store/authStore';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import EditPaymentDialog from './EditPaymentDialog';

interface PaymentCardProps {
  payment: Payment;
  onViewAttachment?: (url: string) => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ payment, onViewAttachment }) => {
  const { toggleDeducted, deletePayment } = usePaymentsStore();
  const { user, checkPermission } = useAuthStore();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleToggleDeducted = async () => {
    if (user) {
      await toggleDeducted(payment.id, user.id, user.name);
    }
  };

  const handleDelete = async () => {
    if (confirm('هل أنت متأكد من حذف هذا السداد؟')) {
      const success = await deletePayment(payment.id);
      if (success) {
        toast.success('تم حذف السداد بنجاح');
      } else {
        toast.error('حدث خطأ أثناء الحذف');
      }
    }
  };

  const canDelete = checkPermission('delete_all') || user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'ahmad_rajili';

  return (
    <>
      <Card
        className={cn(
          'rounded-xl p-3 border transition-all duration-300',
          payment.is_deducted
            ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100'
            : 'bg-white border-gray-200 hover:shadow-md'
        )}
      >
        <div className="flex justify-between items-start gap-3">
          {/* معلومات السداد */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* الشركة والمبلغ */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  payment.is_deducted ? 'bg-emerald-200' : 'bg-gray-100'
                )}>
                  <Building2 className={cn(
                    'w-4 h-4',
                    payment.is_deducted ? 'text-emerald-700' : 'text-gray-600'
                  )} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{payment.company_name}</h3>
                  <p className={cn(
                    'text-lg font-bold',
                    payment.is_deducted ? 'text-emerald-700' : 'text-primary'
                  )}>
                    {formatCurrency(Number(payment.amount))} <span className="text-xs font-normal">د.ل</span>
                  </p>
                </div>
              </div>
            </div>

            {/* التاريخ ونوع السداد */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{format(parseISO(payment.payment_date), 'dd MMM yyyy', { locale: ar })}</span>
              </div>
              <Badge 
                variant={payment.payment_type === 'cash' ? 'default' : 'secondary'}
                className={cn(
                  'text-xs',
                  payment.payment_type === 'cash' 
                    ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                )}
              >
                {payment.payment_type === 'cash' ? 'كاش' : 'مصرف'}
              </Badge>
              {payment.attachment_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => onViewAttachment?.(payment.attachment_url!)}
                >
                  <Paperclip className="w-3 h-3 ml-1" />
                  مرفق
                </Button>
              )}
            </div>

            {/* الملاحظات */}
            {payment.notes && (
              <div className="flex items-start gap-1 text-xs text-muted-foreground bg-gray-50 rounded-lg p-2">
                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{payment.notes}</span>
            </div>
            )}

            {/* معلومات التسجيل */}
            {payment.created_by_name && (
              <p className="text-xs text-muted-foreground">
                📝 تم التسجيل بواسطة {payment.created_by_name}
              </p>
            )}

            {/* معلومات الخصم */}
            {payment.is_deducted && payment.deducted_by_name && (
              <p className="text-xs text-emerald-600">
                ✓ تم الخصم بواسطة {payment.deducted_by_name}
              </p>
            )}
          </div>

          {/* أزرار التحكم */}
          <div className="flex flex-col items-end gap-2">
            {/* القائمة المنسدلة */}
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-50">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Pencil className="w-4 h-4 ml-2" />
                    تعديل
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Toggle حالة الخصم */}
            <div className="flex flex-col items-center gap-1">
              <Switch
                checked={payment.is_deducted}
                onCheckedChange={handleToggleDeducted}
                className={cn(
                  payment.is_deducted && 'data-[state=checked]:bg-emerald-500'
                )}
              />
              <span className={cn(
                'text-[10px] font-medium',
                payment.is_deducted ? 'text-emerald-600' : 'text-muted-foreground'
              )}>
                {payment.is_deducted ? (
                  <span className="flex items-center gap-0.5">
                    <Check className="w-3 h-3" />
                    مخصوم
                  </span>
                ) : 'لم يُخصم'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Dialog التعديل */}
      <EditPaymentDialog
        payment={payment}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
};

export default PaymentCard;
