import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Lock, LockOpen, User, DollarSign, Building2, Stamp } from 'lucide-react';
import { Revenue } from '@/store/pharmacyStore';

interface StaffGroup {
  userId: string;
  userName: string;
  totalCash: number;
  totalServices: number;
  total: number;
  count: number;
  isLocked: boolean;
  totalAdjustment: number;
}

interface StaffSummaryViewProps {
  onBack: () => void;
  selectedDate: string;
  dailyRevenues: Revenue[];
  locks: Record<string, boolean>;
  onSelectUser: (userId: string, userName: string) => void;
  isAdmin: boolean;
  onToggleLockForPeriod?: (period: string) => void;
}

const StaffSummaryView: React.FC<StaffSummaryViewProps> = ({
  onBack,
  selectedDate,
  dailyRevenues,
  locks,
  onSelectUser,
  isAdmin,
}) => {
  const staffGroups = useMemo(() => {
    const groupMap = new Map<string, StaffGroup>();

    dailyRevenues.forEach(rev => {
      const key = rev.created_by_id;
      const existing = groupMap.get(key);
      const cash = rev.type === 'income' ? rev.amount : 0;
      const services = rev.type === 'banking_services' ? rev.amount : 0;
      const adjustment = (rev as any).adjustment || 0;
      const isLocked = locks[rev.period] || false;

      if (existing) {
        existing.totalCash += cash;
        existing.totalServices += services;
        existing.total += rev.amount;
        existing.count += 1;
        existing.totalAdjustment += adjustment;
        if (isLocked) existing.isLocked = true;
      } else {
        groupMap.set(key, {
          userId: key,
          userName: rev.createdBy,
          totalCash: cash,
          totalServices: services,
          total: rev.amount,
          count: 1,
          isLocked,
          totalAdjustment: adjustment,
        });
      }
    });

    return Array.from(groupMap.values()).sort((a, b) => b.total - a.total);
  }, [dailyRevenues, locks]);

  const grandTotal = useMemo(() => dailyRevenues.reduce((s, r) => s + r.amount, 0), [dailyRevenues]);
  const grandCash = useMemo(() => dailyRevenues.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0), [dailyRevenues]);
  const grandAdjustment = useMemo(() => dailyRevenues.reduce((s, r) => s + ((r as any).adjustment || 0), 0), [dailyRevenues]);
  const allLocked = useMemo(() => staffGroups.length > 0 && staffGroups.every(s => s.isLocked), [staffGroups]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 relative" dir="rtl">
      {/* Grand Lock Stamp when ALL users are locked */}
      {allLocked && (
        <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className={`
            rotate-[-15deg] border-[6px] rounded-3xl px-10 py-6 opacity-20
            ${grandAdjustment > 0 
              ? 'border-emerald-600 text-emerald-600' 
              : grandAdjustment < 0 
                ? 'border-destructive text-destructive' 
                : 'border-muted-foreground text-muted-foreground'
            }
          `}>
            <div className="text-center">
              <Stamp className="w-12 h-12 mx-auto mb-2" />
              <p className="text-3xl font-black tracking-wider">تم الإقفال</p>
              {grandAdjustment !== 0 && (
                <p className="text-2xl font-bold mt-2">
                  {grandAdjustment > 0 ? '+' : ''}{grandAdjustment.toFixed(0)} د
                </p>
              )}
              {grandAdjustment > 0 && <p className="text-sm font-semibold mt-1">زيادة</p>}
              {grandAdjustment < 0 && <p className="text-sm font-semibold mt-1">نقصان</p>}
              {grandAdjustment === 0 && <p className="text-sm font-semibold mt-1">مطابق</p>}
            </div>
          </div>
        </div>
      )}

      <header className="bg-card/80 backdrop-blur-sm shadow-sm border-b border-border/50 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Button onClick={onBack} variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground">
              <ArrowRight className="w-4 h-4" />
              <span>العودة</span>
            </Button>
            <h1 className="text-sm font-bold text-foreground">ملخص الموظفين - {selectedDate}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3 relative z-10">
        {/* Grand Total Card */}
        <Card className={`border-0 shadow-md rounded-2xl ${allLocked ? 'bg-muted/50' : 'bg-primary/5'}`}>
          <CardContent className="p-4 text-center relative">
            {allLocked && (
              <div className="absolute top-2 left-2">
                <Lock className="w-5 h-5 text-destructive" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">الإجمالي الكلي لليوم</p>
            <p className="text-3xl font-black text-primary">{grandTotal.toFixed(0)} <span className="text-base">د</span></p>
            
            {/* Show cash with adjustment */}
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-sm text-emerald-600 font-bold flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {grandCash.toFixed(0)}
              </span>
              {grandAdjustment !== 0 && (
                <span className={`text-sm font-bold ${grandAdjustment > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {grandAdjustment > 0 ? '+' : ''}{grandAdjustment.toFixed(0)}
                </span>
              )}
            </div>
            
            <p className="text-[10px] text-muted-foreground mt-1">{staffGroups.length} موظف • {dailyRevenues.length} عملية</p>
          </CardContent>
        </Card>

        {/* Staff Cards */}
        {staffGroups.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-sm">لا توجد عمليات في هذا التاريخ</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {staffGroups.map(staff => (
              <Card
                key={staff.userId}
                className={`border shadow-sm rounded-xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all relative ${
                  staff.isLocked
                    ? 'bg-muted/50 border-muted-foreground/20'
                    : 'bg-card border-border/50 hover:border-primary/30'
                }`}
                onClick={() => onSelectUser(staff.userId, staff.userName)}
              >
                {/* Per-user lock stamp overlay */}
                {staff.isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className={`
                      rotate-[-12deg] border-[3px] rounded-2xl px-5 py-2 opacity-15
                      ${staff.totalAdjustment > 0 
                        ? 'border-emerald-600 text-emerald-600' 
                        : staff.totalAdjustment < 0 
                          ? 'border-destructive text-destructive' 
                          : 'border-muted-foreground text-muted-foreground'
                      }
                    `}>
                      <div className="text-center">
                        <p className="text-lg font-black">مقفل</p>
                        {staff.totalAdjustment !== 0 && (
                          <p className="text-sm font-bold">
                            {staff.totalAdjustment > 0 ? '+' : ''}{staff.totalAdjustment.toFixed(0)} د
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Left: Lock status */}
                    <div className="flex items-center gap-1 shrink-0">
                      {staff.isLocked ? (
                        <Lock className="w-4 h-4 text-destructive" />
                      ) : (
                        <LockOpen className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Right: User info */}
                    <div className="text-right flex-1 mr-2">
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <span className="text-base font-bold text-foreground">{staff.userName}</span>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-4">
                        {/* Cash + Adjustment */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-emerald-600">{staff.totalCash.toFixed(0)}</span>
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          {staff.totalAdjustment !== 0 && (
                            <span className={`text-xs font-bold ${staff.totalAdjustment > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                              ({staff.totalAdjustment > 0 ? '+' : ''}{staff.totalAdjustment.toFixed(0)})
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-blue-600">{staff.totalServices.toFixed(0)}</span>
                          <Building2 className="w-3 h-3 text-blue-600" />
                        </div>
                        <div className="border-r border-border/50 pr-4">
                          <span className="text-lg font-black text-primary">{staff.total.toFixed(0)} د</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-1">{staff.count} عملية</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffSummaryView;
