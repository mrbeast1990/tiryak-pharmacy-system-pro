import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, DollarSign, Building2, TrendingUp, ChevronDown, ChevronUp, Clock, Edit, Trash2, CheckCircle2, PlusCircle, MinusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Revenue } from '@/store/pharmacyStore';
import EditRevenueDialog from './EditRevenueDialog';
import { SERVICE_COLORS, SERVICE_LABELS } from './BankingServicesModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';

interface ServiceGroup {
  key: string;
  label: string;
  colorClass: string;
  total: number;
  count: number;
  revenues: Revenue[];
}

interface UserServicesDashboardProps {
  onBack: () => void;
  selectedDate: string;
  dailyRevenues: Revenue[];
  updateRevenue: (id: string, updates: Partial<Revenue>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  isAdmin: boolean;
  userId?: string;
  isLocked: boolean;
  onVerify?: (id: string) => Promise<void>;
  staffName: string;
  onAdjust?: (id: string, adjustment: number, note: string) => Promise<void>;
}

const PERIOD_LABELS: Record<string, string> = {
  morning: 'صباحية',
  evening: 'مسائية',
  night: 'ليلية',
  ahmad_rajili: 'احمد الرجيلي',
  abdulwahab: 'عبدالوهاب',
};

const UserServicesDashboard: React.FC<UserServicesDashboardProps> = ({
  onBack,
  selectedDate,
  dailyRevenues,
  updateRevenue,
  deleteRevenue,
  isAdmin,
  userId,
  isLocked,
  onVerify,
  staffName,
  onAdjust,
}) => {
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const totals = useMemo(() => {
    const cash = dailyRevenues.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const services = dailyRevenues.filter(r => r.type === 'banking_services').reduce((s, r) => s + r.amount, 0);
    return { cash, services, total: cash + services };
  }, [dailyRevenues]);

  const serviceGroups = useMemo(() => {
    const groups = new Map<string, ServiceGroup>();

    dailyRevenues.forEach(rev => {
      const key = rev.type === 'income' ? 'income' : (rev.service_name || 'other');
      const existing = groups.get(key);

      if (existing) {
        existing.total += rev.amount;
        existing.count += 1;
        existing.revenues.push(rev);
      } else {
        const label = rev.type === 'income' ? 'نقدي' : (SERVICE_LABELS[rev.service_name || ''] || rev.service_name || 'خدمات');
        const colorClass = rev.type === 'income'
          ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
          : (SERVICE_COLORS[rev.service_name || ''] || 'text-blue-600 bg-blue-50 border-blue-200');

        groups.set(key, {
          key,
          label,
          colorClass,
          total: rev.amount,
          count: 1,
          revenues: [rev],
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => b.total - a.total);
  }, [dailyRevenues]);

  const handleUpdate = async (id: string, updates: Partial<Revenue>) => {
    await updateRevenue(id, updates);
    toast.success('تم تحديث السجل');
  };

  const handleDelete = async (id: string) => {
    await deleteRevenue(id);
    toast.success('تم حذف السجل');
  };

  const handleAdjustSubmit = async () => {
    if (!adjustingId || !onAdjust) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('يرجى إدخال قيمة صحيحة');
      return;
    }
    await onAdjust(adjustingId, amount, adjustNote);
    setAdjustingId(null);
    setAdjustAmount('');
    setAdjustNote('');
    toast.success('تم تسجيل الفرق');
  };

  const getTextColor = (colorClass: string) => {
    const match = colorClass.match(/text-(\w+-\d+)/);
    return match ? match[0] : 'text-primary';
  };

  const getBgColor = (colorClass: string) => {
    const match = colorClass.match(/bg-(\w+-\d+)/);
    return match ? match[0] : 'bg-muted';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10" dir="rtl">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm shadow-sm border-b border-border/50 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Button onClick={onBack} variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground">
              <ArrowRight className="w-4 h-4" />
              <span>العودة</span>
            </Button>
            <div className="text-right">
              <h1 className="text-sm font-bold text-foreground">إيراد {staffName}</h1>
              <p className="text-[10px] text-muted-foreground">{selectedDate}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {/* Summary Card */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">كاش</p>
                  <p className="text-sm font-bold text-emerald-600">{totals.cash.toFixed(0)} د</p>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-primary">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">الإجمالي</span>
                </div>
                <p className="text-xl font-black text-primary">{totals.total.toFixed(0)} د</p>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground text-left">خدمات</p>
                  <p className="text-sm font-bold text-blue-600">{totals.services.toFixed(0)} د</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Group Cards */}
        {serviceGroups.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-sm">لا توجد عمليات</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {serviceGroups.map(group => {
              const isExpanded = expandedService === group.key;
              const textColor = getTextColor(group.colorClass);
              const bgColor = getBgColor(group.colorClass);

              return (
                <Card key={group.key} className={`border shadow-sm rounded-xl overflow-hidden ${group.colorClass}`}>
                  <CardContent className="p-0">
                    {/* Service Header - clickable */}
                    <button
                      onClick={() => setExpandedService(isExpanded ? null : group.key)}
                      className="w-full p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
                        <span className="text-lg font-black">{group.total.toFixed(0)} د</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="text-sm font-bold">{group.label}</span>
                          <p className="text-[10px] opacity-70">{group.count} عملية</p>
                        </div>
                        <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
                          {group.key === 'income' ? (
                            <DollarSign className={`w-4 h-4 ${textColor}`} />
                          ) : (
                            <Building2 className={`w-4 h-4 ${textColor}`} />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Transactions */}
                    {isExpanded && (
                      <div className="border-t px-3 py-2 space-y-1.5 bg-card/80">
                        {group.revenues.map((rev, idx) => {
                          const isVerified = rev.is_verified;
                          const canEdit = !isLocked && !isVerified && (isAdmin || rev.created_by_id === userId);
                          const canVerify = isAdmin && !isVerified && !isLocked;
                          const adjustment = (rev as any).adjustment || 0;

                          return (
                            <div key={rev.id} className={`p-2.5 rounded-lg border transition-all ${isVerified ? 'border-emerald-300 bg-emerald-50/50' : 'border-border/30 bg-card'}`}>
                              <div className="flex items-center justify-between">
                                {/* Actions */}
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {canVerify && onVerify && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-100" onClick={() => onVerify(rev.id)}>
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                  {isAdmin && onAdjust && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:bg-amber-100" onClick={() => { setAdjustingId(rev.id); setAdjustAmount(''); setAdjustNote(''); }}>
                                      {adjustment !== 0 ? <MinusCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                                    </Button>
                                  )}
                                  {canEdit && (
                                    <>
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
                                    </>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="text-right flex-1 mr-2">
                                  <div className="flex items-center justify-end gap-2 mb-0.5">
                                    <span className="text-[10px] text-muted-foreground/50">#{idx + 1}</span>
                                    <span className="text-base font-bold text-foreground">{rev.amount.toFixed(2)} د</span>
                                  </div>
                                  {adjustment !== 0 && (
                                    <div className={`text-[10px] font-semibold mb-0.5 ${adjustment > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                                      {adjustment > 0 ? `+${adjustment}` : adjustment} د (فرق)
                                      {(rev as any).adjustment_note && <span className="text-muted-foreground mr-1">- {(rev as any).adjustment_note}</span>}
                                    </div>
                                  )}
                                  <div className="flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" />
                                      {new Date(rev.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span>{PERIOD_LABELS[rev.period] || rev.period}</span>
                                  </div>
                                  {rev.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{rev.notes}</p>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <EditRevenueDialog
        isOpen={!!editingRevenue}
        onClose={() => setEditingRevenue(null)}
        revenue={editingRevenue}
        onSave={handleUpdate}
      />

      {/* Adjustment Dialog */}
      <Dialog open={!!adjustingId} onOpenChange={(open) => { if (!open) setAdjustingId(null); }}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل زيادة / نقصان</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">المبلغ (موجب = زيادة، سالب = نقصان)</label>
              <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="مثال: 5 أو -3" className="text-right" dir="ltr" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ملاحظة (اختياري)</label>
              <Input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="سبب الفرق..." className="text-right" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdjustSubmit} className="w-full">تسجيل الفرق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserServicesDashboard;
