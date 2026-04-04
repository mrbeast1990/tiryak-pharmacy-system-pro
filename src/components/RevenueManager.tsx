
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Wallet, BarChart3, Building2, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { useRevenueManager } from '@/hooks/useRevenueManager';
import { supabase } from '@/integrations/supabase/client';

import POSCashInput from './revenue/POSCashInput';
import POSDashboard from './revenue/POSDashboard';
import BankingServicesModal from './revenue/BankingServicesModal';
import POSTransactionList from './revenue/POSTransactionList';
import AdminRevenueDisplay from './revenue/AdminRevenueDisplay';
import RevenueReportSheet from './revenue/RevenueReportSheet';
import pharmacyLogo from '@/assets/pharmacy-logo.png';
import { Period } from '@/hooks/revenue/useRevenueState';

interface RevenueManagerProps {
  onBack: () => void;
}

const RevenueManager: React.FC<RevenueManagerProps> = ({ onBack }) => {
  const manager = useRevenueManager();
  const [bankingModalOpen, setBankingModalOpen] = useState(false);
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  const [showTransactions, setShowTransactions] = useState(false);

  // Fetch locks for the selected date
  const fetchLocks = useCallback(async () => {
    const { data } = await supabase
      .from('revenue_locks')
      .select('*')
      .eq('date', manager.selectedDate);
    if (data) {
      const lockMap: Record<string, boolean> = {};
      data.forEach((l: any) => { lockMap[l.period] = true; });
      setLocks(lockMap);
    }
  }, [manager.selectedDate]);

  useEffect(() => { fetchLocks(); }, [fetchLocks]);

  const isCurrentPeriodLocked = locks[manager.period] || false;

  // Check if ANY period is locked for the selected date (for dashboard display)
  const isAnyLocked = Object.values(locks).some(v => v);

  const handleRegisterCash = useCallback(async (amount: number) => {
    if (isCurrentPeriodLocked) {
      toast.error('هذه الوردية مقفلة');
      return;
    }
    const success = await manager.handleSubmitDirect(amount, 'income', null);
    if (success) toast.success('تم تسجيل الإيراد النقدي');
    else toast.error('فشل تسجيل الإيراد');
  }, [manager, isCurrentPeriodLocked]);

  const handleRegisterBanking = useCallback(async (service: string, amount: number) => {
    if (isCurrentPeriodLocked) {
      toast.error('هذه الوردية مقفلة');
      return;
    }
    const success = await manager.handleSubmitDirect(amount, 'banking_services', service);
    if (success) toast.success('تم تسجيل الخدمة المصرفية');
    else toast.error('فشل التسجيل');
  }, [manager, isCurrentPeriodLocked]);

  const handleToggleLock = useCallback(async () => {
    // Lock/unlock ALL periods for the date
    if (isAnyLocked) {
      // Unlock: delete all locks for this date
      await supabase.from('revenue_locks').delete().eq('date', manager.selectedDate);
      toast.success('تم فتح القفل');
    } else {
      // Lock: insert locks for all periods that have revenues
      const periods = ['morning', 'evening', 'night', 'ahmad_rajili', 'abdulwahab'];
      const userName = manager.userId ? 'Admin' : 'Unknown';
      const inserts = periods.map(p => ({
        date: manager.selectedDate,
        period: p,
        locked_by_id: manager.userId!,
        locked_by_name: userName,
      }));
      await supabase.from('revenue_locks').upsert(inserts, { onConflict: 'date,period' });
      toast.success('تم إقفال اليوم');
    }
    fetchLocks();
  }, [isAnyLocked, manager.selectedDate, manager.userId, fetchLocks]);

  const handleVerify = useCallback(async (id: string) => {
    await supabase.from('revenues').update({
      is_verified: true,
      verified_by_name: 'Admin',
    }).eq('id', id);
    await manager.refreshRevenues();
    toast.success('تم اعتماد العملية');
  }, [manager]);

  if (manager.revenuesLoading && !showTransactions) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <span className="text-sm text-muted-foreground">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (showTransactions) {
    return (
      <POSTransactionList
        onBack={() => setShowTransactions(false)}
        selectedDate={manager.selectedDate}
        dailyRevenues={manager.dailyRevenues}
        updateRevenue={manager.updateRevenue}
        deleteRevenue={manager.deleteRevenue}
        isAdmin={manager.isAdmin}
        userId={manager.userId}
        isLocked={isAnyLocked}
        onVerify={manager.isAdmin ? handleVerify : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 relative" dir="rtl">
      {/* Background Logo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${pharmacyLogo})`,
          backgroundSize: '400px 400px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.03,
        }}
      />

      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm shadow-sm border-b border-border/50 sticky top-0 z-20 safe-area-top">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Button onClick={onBack} variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4" />
              <span>العودة</span>
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground">نقطة البيع</h1>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 relative z-10 space-y-4">
        {/* Date + Period Selector */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground text-right block flex items-center justify-end gap-1">
              <span>التاريخ</span>
              <Calendar className="w-3 h-3 text-primary" />
            </label>
            <Input
              type="date"
              value={manager.selectedDate}
              onChange={e => manager.setSelectedDate(e.target.value)}
              className="text-xs text-right h-9 border-border/50 bg-muted/30 rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground text-right block">الفترة</label>
            {manager.canSelectPeriod ? (
              <Select value={manager.period} onValueChange={(v: Period) => manager.setPeriod(v)}>
                <SelectTrigger className="text-xs text-right h-9 border-border/50 bg-muted/30 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="morning">صباحية</SelectItem>
                  <SelectItem value="evening">مسائية</SelectItem>
                  <SelectItem value="night">ليلية</SelectItem>
                  <SelectItem value="ahmad_rajili">احمد الرجيلي</SelectItem>
                  <SelectItem value="abdulwahab">عبدالوهاب</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="h-9 flex items-center justify-end px-3 bg-primary/10 border border-primary/20 rounded-lg">
                <span className="text-xs font-medium text-primary">{manager.periodDisplayName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Dashboard */}
        <POSDashboard
          selectedDate={manager.selectedDate}
          dailyCash={manager.dailyRevenue}
          dailyServices={manager.dailyBankingServices}
          onShowDetails={() => setShowTransactions(true)}
          navigateDate={manager.navigateDate}
          canNavigateDate={manager.canNavigateDate}
          isAdmin={manager.isAdmin}
          isLocked={isAnyLocked}
          onToggleLock={manager.isAdmin ? handleToggleLock : undefined}
        />

        {/* Cash Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground text-right block">الإيراد النقدي</label>
          <POSCashInput onRegister={handleRegisterCash} disabled={isCurrentPeriodLocked} />
        </div>

        {/* Banking Services Button */}
        <button
          onClick={() => setBankingModalOpen(true)}
          disabled={isCurrentPeriodLocked}
          className="w-full h-16 rounded-2xl bg-gradient-to-l from-blue-500 to-blue-600 text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Building2 className="w-6 h-6" />
          <span>الخدمات المصرفية</span>
        </button>

        <BankingServicesModal
          open={bankingModalOpen}
          onOpenChange={setBankingModalOpen}
          onRegister={handleRegisterBanking}
          disabled={isCurrentPeriodLocked}
        />

        {/* Admin Period Breakdown */}
        {manager.isAdmin && (
          <AdminRevenueDisplay
            dailyRevenues={manager.dailyRevenues}
            selectedDate={manager.selectedDate}
            updateRevenue={manager.updateRevenue}
            deleteRevenue={manager.deleteRevenue}
          />
        )}
      </main>

      {/* FAB for Reports - Admin only */}
      {manager.isAdmin && (
        <RevenueReportSheet revenues={manager.revenues}>
          <button
            className="fixed bottom-6 left-6 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-105 active:scale-95"
            aria-label="التقارير"
          >
            <BarChart3 className="w-6 h-6" />
          </button>
        </RevenueReportSheet>
      )}
    </div>
  );
};

export default RevenueManager;
