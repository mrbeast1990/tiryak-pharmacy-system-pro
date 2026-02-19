import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Building2, TrendingUp, ChevronDown, ChevronUp, Clock, User, Edit, Trash2 } from 'lucide-react';
import { Revenue } from '@/store/pharmacyStore';
import EditRevenueDialog from './EditRevenueDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

const PERIOD_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  morning: { label: 'صباحية', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  evening: { label: 'مسائية', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  ahmad_rajili: { label: 'احمد الرجيلي', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  abdulwahab: { label: 'عبدالوهاب', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  night: { label: 'ليلية', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
};

const SERVICE_NAMES: Record<string, string> = {
  mobi_cash: 'موبي كاش',
  yser_pay: 'يسر باي',
  mobi_nab: 'موبي ناب',
  bank_transfer: 'تحويل مصرفي',
  pay_for_me: 'ادفع لي',
};

interface AdminRevenueDisplayProps {
  dailyRevenues: Revenue[];
  selectedDate: string;
  updateRevenue: (id: string, updates: Partial<Revenue>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
}

const AdminRevenueDisplay: React.FC<AdminRevenueDisplayProps> = ({
  dailyRevenues,
  selectedDate,
  updateRevenue,
  deleteRevenue,
}) => {
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const { toast } = useToast();

  const periodData = useMemo(() => {
    const periods = ['morning', 'evening', 'ahmad_rajili', 'abdulwahab', 'night'];
    return periods.map(p => {
      const revs = dailyRevenues.filter(r => r.period === p);
      const cash = revs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const banking = revs.filter(r => r.type === 'banking_services').reduce((s, r) => s + r.amount, 0);
      const createdBy = revs.length > 0 ? revs[0].createdBy : '';
      return { period: p, revs, cash, banking, total: cash + banking, createdBy };
    }).filter(p => p.revs.length > 0);
  }, [dailyRevenues]);

  const dayTotal = useMemo(() => {
    const cash = dailyRevenues.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const banking = dailyRevenues.filter(r => r.type === 'banking_services').reduce((s, r) => s + r.amount, 0);
    return { cash, banking, total: cash + banking };
  }, [dailyRevenues]);

  const handleUpdate = async (id: string, updates: Partial<Revenue>) => {
    await updateRevenue(id, updates);
    toast({ title: 'تم التحديث', description: 'تم تحديث السجل بنجاح' });
  };

  const handleDelete = async (id: string) => {
    await deleteRevenue(id);
    toast({ title: 'تم الحذف', description: 'تم حذف السجل بنجاح' });
  };

  if (periodData.length === 0) {
    return (
      <Card className="bg-card border-0 shadow-md rounded-xl">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground text-sm">لا توجد إيرادات مسجلة لهذا اليوم</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Day Total Card */}
      <Card className="bg-gradient-to-l from-primary/10 to-primary/5 border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          <div className="text-center mb-3">
            <p className="text-xs text-muted-foreground mb-1">إجمالي اليوم</p>
            <p className="text-3xl font-bold text-primary">{dayTotal.total.toFixed(0)} <span className="text-lg">د</span></p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-2.5 text-center border border-green-200/50">
              <DollarSign className="w-4 h-4 text-green-600 mx-auto mb-0.5" />
              <p className="text-[10px] text-muted-foreground">كاش</p>
              <p className="text-sm font-bold text-green-600">{dayTotal.cash.toFixed(0)} د</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-2.5 text-center border border-blue-200/50">
              <Building2 className="w-4 h-4 text-blue-600 mx-auto mb-0.5" />
              <p className="text-[10px] text-muted-foreground">خدمات</p>
              <p className="text-sm font-bold text-blue-600">{dayTotal.banking.toFixed(0)} د</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Cards */}
      {periodData.map(({ period, revs, cash, banking, total, createdBy }) => {
        const config = PERIOD_CONFIG[period] || { label: period, color: 'text-foreground', bg: 'bg-muted' };
        const isExpanded = expandedPeriod === period;

        return (
          <Card key={period} className={`border shadow-sm rounded-xl overflow-hidden ${config.bg}`}>
            <CardContent className="p-0">
              {/* Period Header - clickable */}
              <button
                onClick={() => setExpandedPeriod(isExpanded ? null : period)}
                className="w-full p-4 flex items-center justify-between text-right"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  <span className={`text-lg font-bold ${config.color}`}>{total.toFixed(0)} د</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
                  {createdBy && (
                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                      <span>{createdBy}</span>
                      <User className="w-3 h-3" />
                    </p>
                  )}
                </div>
              </button>

              {/* Summary Row */}
              <div className="px-4 pb-3 flex justify-end gap-4 text-xs text-muted-foreground">
                <span>كاش: {cash.toFixed(0)} د</span>
                <span>خدمات: {banking.toFixed(0)} د</span>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-2 bg-card/50">
                  {revs.map(rev => (
                    <div key={rev.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingRevenue(rev)}>
                          <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                              <AlertDialogDescription>سيؤدي هذا إلى حذف السجل نهائيًا.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(rev.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Badge variant={rev.type === 'income' ? 'default' : 'secondary'} className="text-[10px]">
                          {rev.type === 'income' ? 'نقدي' : (rev.service_name ? SERVICE_NAMES[rev.service_name] || rev.service_name : 'خدمات مصرفية')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{rev.amount.toFixed(2)} د</span>
                        {rev.notes && <p className="text-[10px] text-muted-foreground">{rev.notes}</p>}
                        <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                          <span>{new Date(rev.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                          <Clock className="w-2.5 h-2.5" />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <EditRevenueDialog
        isOpen={!!editingRevenue}
        onClose={() => setEditingRevenue(null)}
        revenue={editingRevenue}
        onSave={handleUpdate}
      />
    </div>
  );
};

export default AdminRevenueDisplay;
