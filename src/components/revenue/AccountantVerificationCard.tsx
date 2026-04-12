
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ClipboardCheck, TrendingUp, TrendingDown, Equal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccountantVerificationCardProps {
  selectedDate: string;
  period: string;
  targetUserId: string;
  staffName: string;
  cashTotal: number;
  isAdmin: boolean;
  verifierUserId?: string;
  verifierName?: string;
}

interface Verification {
  id: string;
  reported_amount: number;
  verified_by_name: string;
  notes: string | null;
}

const AccountantVerificationCard: React.FC<AccountantVerificationCardProps> = ({
  selectedDate,
  period,
  targetUserId,
  staffName,
  cashTotal,
  isAdmin,
  verifierUserId,
  verifierName,
}) => {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchVerification = useCallback(async () => {
    const { data } = await supabase
      .from('accountant_verifications')
      .select('id, reported_amount, verified_by_name, notes')
      .eq('date', selectedDate)
      .eq('target_user_id', targetUserId)
      .maybeSingle();
    
    if (data) {
      setVerification(data as Verification);
    } else {
      setVerification(null);
    }
  }, [selectedDate, targetUserId]);

  useEffect(() => { fetchVerification(); }, [fetchVerification]);

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    setSaving(true);
    try {
      if (verification) {
        await supabase
          .from('accountant_verifications')
          .update({ reported_amount: numAmount, notes: notes || null, verified_by_name: verifierName || 'المدير' })
          .eq('id', verification.id);
      } else {
        await supabase
          .from('accountant_verifications')
          .insert({
            date: selectedDate,
            period,
            target_user_id: targetUserId,
            reported_amount: numAmount,
            verified_by_id: verifierUserId || '',
            verified_by_name: verifierName || 'المدير',
            notes: notes || null,
          });
      }
      toast.success('تم حفظ مطابقة المحاسب');
      setDialogOpen(false);
      await fetchVerification();
    } catch (err) {
      toast.error('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const diff = verification ? verification.reported_amount - cashTotal : null;

  return (
    <>
      {/* Verification Result Card */}
      {verification && (
        <Card className={`border-2 shadow-sm rounded-xl ${
          diff! > 0 ? 'border-emerald-300 bg-emerald-50/50' :
          diff! < 0 ? 'border-destructive/40 bg-red-50/50' :
          'border-muted-foreground/30 bg-muted/30'
        }`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {diff! > 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> :
                 diff! < 0 ? <TrendingDown className="w-4 h-4 text-destructive" /> :
                 <Equal className="w-4 h-4 text-muted-foreground" />}
                <span className={`text-lg font-black ${
                  diff! > 0 ? 'text-emerald-600' :
                  diff! < 0 ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                  {diff! > 0 ? '+' : ''}{diff!.toFixed(0)} د
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">مطابقة المحاسب</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-card rounded-lg p-2 border">
                <p className="text-[10px] text-muted-foreground">المحاسب 3</p>
                <p className="text-sm font-bold text-primary">{verification.reported_amount.toFixed(0)} د</p>
              </div>
              <div className="bg-card rounded-lg p-2 border">
                <p className="text-[10px] text-muted-foreground">كاش الموظف</p>
                <p className="text-sm font-bold text-emerald-600">{cashTotal.toFixed(0)} د</p>
              </div>
            </div>
            {verification.notes && (
              <p className="text-[10px] text-muted-foreground mt-2 text-right">📝 {verification.notes}</p>
            )}
            <p className="text-[9px] text-muted-foreground/60 mt-1 text-left">بواسطة: {verification.verified_by_name}</p>
          </CardContent>
        </Card>
      )}

      {/* Admin Button */}
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAmount(verification ? String(verification.reported_amount) : '');
            setNotes(verification?.notes || '');
            setDialogOpen(true);
          }}
          className="w-full gap-2 h-10 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span className="text-xs font-bold">{verification ? 'تعديل مطابقة المحاسب' : 'مطابقة المحاسب 3'}</span>
        </Button>
      )}

      {/* Input Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              <span>مطابقة المحاسب - {staffName}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">المبلغ الذي أبلغ عنه المحاسب 3</label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="أدخل المبلغ..."
                className="text-right text-lg font-bold"
                dir="ltr"
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-muted-foreground">إجمالي كاش {staffName}</p>
              <p className="text-base font-bold text-emerald-600">{cashTotal.toFixed(0)} د</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ملاحظة (اختياري)</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظة..." className="text-right" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'جاري الحفظ...' : 'حفظ المطابقة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountantVerificationCard;
