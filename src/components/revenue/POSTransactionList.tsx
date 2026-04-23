
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowRight, Edit, Trash2, CheckCircle2, Clock, User, DollarSign, Building2, TrendingUp, PlusCircle, MinusCircle } from 'lucide-react';
import { Revenue } from '@/store/pharmacyStore';
import EditRevenueDialog from './EditRevenueDialog';
import { SERVICE_COLORS, SERVICE_LABELS } from './BankingServicesModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';

interface POSTransactionListProps {
  onBack: () => void;
  selectedDate: string;
  dailyRevenues: Revenue[];
  updateRevenue: (id: string, updates: Partial<Revenue>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  isAdmin: boolean;
  userId?: string;
  isLocked: boolean;
  onVerify?: (id: string) => Promise<void>;
  staffName?: string;
  onAdjust?: (id: string, adjustment: number, note: string) => Promise<void>;
}

const PERIOD_LABELS: Record<string, string> = {
  morning: 'صباحية',
  evening: 'مسائية',
  night: 'ليلية',
  ahmad_rajili: 'احمد الرجيلي',
  abdulwahab: 'عبدالوهاب',
};

const POSTransactionList: React.FC<POSTransactionListProps> = ({
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
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const totals = useMemo(() => {
    const cash = dailyRevenues.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const services = dailyRevenues.filter(r => r.type === 'banking_services').reduce((s, r) => s + r.amount, 0);
    return { cash, services, total: cash + services };
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

  const getServiceStyle = (rev: Revenue) => {
    if (rev.type === 'income') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    return SERVICE_COLORS[rev.service_name || ''] || 'text-blue-700 bg-blue-50 border-blue-200';
  };

  const getServiceLabel = (rev: Revenue) => {
    if (rev.type === 'income') return 'نقدي';
    return SERVICE_LABELS[rev.service_name || ''] || rev.service_name || 'خدمات';
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
              <h1 className="text-sm font-bold text-foreground">
                {staffName ? `إيراد ${staffName}` : `تفاصيل إيراد ${selectedDate}`}
              </h1>
              {staffName && <p className="text-[10px] text-muted-foreground">{selectedDate}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {/* Summary */}
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

        {/* Transactions */}
        {dailyRevenues.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-sm">لا توجد عمليات في هذا التاريخ</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {dailyRevenues.map((rev, index) => {
              const isVerified = rev.is_verified;
              const canEdit = !isLocked && !isVerified && (isAdmin || rev.created_by_id === userId);
              const canVerify = isAdmin && !isVerified && !isLocked;
              const canUnverify = isAdmin && isVerified && !isLocked;
              const adjustment = (rev as any).adjustment || 0;

              return (
                <Card key={rev.id} className={`border shadow-sm rounded-xl overflow-hidden transition-all ${isVerified ? 'border-emerald-300 bg-emerald-50/30' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {canVerify && onVerify && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:bg-emerald-100"
                            onClick={() => onVerify(rev.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        {isVerified && (
                          canUnverify && onVerify ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-600 hover:bg-red-100 hover:text-red-600"
                              onClick={() => onVerify(rev.id)}
                              title="إلغاء الاعتماد"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )
                        )}
                        {isAdmin && onAdjust && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-amber-600 hover:bg-amber-100"
                            onClick={() => { setAdjustingId(rev.id); setAdjustAmount(''); setAdjustNote(''); }}
                          >
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
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <span className="text-[10px] text-muted-foreground/50">#{index + 1}</span>
                          <span className="text-base font-bold text-foreground">{rev.amount.toFixed(2)} د</span>
                          <Badge className={`text-[10px] border ${getServiceStyle(rev)}`} variant="outline">
                            {getServiceLabel(rev)}
                          </Badge>
                        </div>
                        {/* Adjustment display */}
                        {adjustment !== 0 && (
                          <div className={`text-[10px] font-semibold mb-1 ${adjustment > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                            {adjustment > 0 ? `+${adjustment}` : adjustment} د (فرق)
                            {(rev as any).adjustment_note && <span className="text-muted-foreground mr-1">- {(rev as any).adjustment_note}</span>}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(rev.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {/* Only show user name if not in staffName mode */}
                          {!staffName && (
                            <span className="flex items-center gap-0.5">
                              <User className="w-2.5 h-2.5" />
                              {rev.createdBy}
                            </span>
                          )}
                          <span>{PERIOD_LABELS[rev.period] || rev.period}</span>
                        </div>
                        {rev.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{rev.notes}</p>}
                        {((rev as any).voice_note_url || (rev as any).attachment_url) && (
                          <div className="flex items-center justify-end gap-2 mt-1">
                            {(rev as any).voice_note_url && (
                              <audio controls src={(rev as any).voice_note_url} className="h-7 max-w-[180px]" />
                            )}
                            {(rev as any).attachment_url && (
                              <a href={(rev as any).attachment_url} target="_blank" rel="noopener noreferrer">
                                <img src={(rev as any).attachment_url} alt="مرفق" className="h-12 w-12 object-cover rounded border" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
              <Input
                type="number"
                value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)}
                placeholder="مثال: 5 أو -3"
                className="text-right"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ملاحظة (اختياري)</label>
              <Input
                value={adjustNote}
                onChange={e => setAdjustNote(e.target.value)}
                placeholder="سبب الفرق..."
                className="text-right"
              />
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

export default POSTransactionList;
