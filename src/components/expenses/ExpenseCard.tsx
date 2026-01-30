import React, { useState } from 'react';
import { Expense, useExpensesStore } from '@/store/expensesStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Pencil, 
  Trash2, 
  CheckCircle2,
  Receipt,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import EditExpenseDialog from './EditExpenseDialog';

interface ExpenseCardProps {
  expense: Expense;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense }) => {
  const { toggleDeducted, deleteExpense } = useExpensesStore();
  const { user, checkPermission } = useAuthStore();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleToggleDeducted = async () => {
    if (!user) return;
    
    const success = await toggleDeducted(expense.id, user.id, user.name || 'مستخدم');
    if (success) {
      toast.success(expense.is_deducted ? 'تم إلغاء الخصم' : 'تم تأكيد الخصم من المنظومة');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      const success = await deleteExpense(expense.id);
      if (success) {
        toast.success('تم حذف المصروف بنجاح');
      } else {
        toast.error('حدث خطأ أثناء الحذف');
      }
    }
  };

  const canDelete = user?.role === 'admin' || checkPermission('delete_all');

  return (
    <>
      <Card className={`transition-all duration-200 ${
        expense.is_deducted 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-white border-border/50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Right Side - Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span className="font-semibold text-foreground truncate">
                  {expense.description}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Calendar className="w-3 h-3" />
                <span>{format(parseISO(expense.expense_date), 'PPP', { locale: ar })}</span>
              </div>

              {expense.notes && (
                <p className="text-xs text-muted-foreground line-clamp-1">{expense.notes}</p>
              )}

              {/* Deduction Toggle */}
              <div className="flex items-center gap-2 mt-3">
                <Switch 
                  checked={expense.is_deducted}
                  onCheckedChange={handleToggleDeducted}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <span className="text-xs text-muted-foreground">
                  {expense.is_deducted ? 'تم الخصم من المنظومة' : 'لم يتم الخصم بعد'}
                </span>
                {expense.is_deducted && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Left Side - Amount and Actions */}
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className="bg-rose-100 text-rose-700 font-bold text-sm px-3">
                {Number(expense.amount).toLocaleString('ar-LY')} د.ل
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            </div>
          </div>
        </CardContent>
      </Card>

      <EditExpenseDialog
        expense={expense}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
};

export default ExpenseCard;
