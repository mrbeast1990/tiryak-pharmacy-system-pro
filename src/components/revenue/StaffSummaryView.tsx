import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Lock, LockOpen, User, DollarSign, Building2 } from 'lucide-react';
import { Revenue } from '@/store/pharmacyStore';

interface StaffGroup {
  userId: string;
  userName: string;
  totalCash: number;
  totalServices: number;
  total: number;
  count: number;
  isLocked: boolean;
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

      // Check if user's period is locked
      const isLocked = locks[rev.period] || false;

      if (existing) {
        existing.totalCash += cash;
        existing.totalServices += services;
        existing.total += rev.amount;
        existing.count += 1;
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
        });
      }
    });

    return Array.from(groupMap.values()).sort((a, b) => b.total - a.total);
  }, [dailyRevenues, locks]);

  const grandTotal = useMemo(() => dailyRevenues.reduce((s, r) => s + r.amount, 0), [dailyRevenues]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10" dir="rtl">
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

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {/* Grand Total Card */}
        <Card className="border-0 shadow-md rounded-2xl bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">الإجمالي الكلي لليوم</p>
            <p className="text-3xl font-black text-primary">{grandTotal.toFixed(0)} <span className="text-base">د</span></p>
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
                className={`border shadow-sm rounded-xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all ${
                  staff.isLocked
                    ? 'bg-muted/50 border-muted-foreground/20'
                    : 'bg-card border-border/50 hover:border-primary/30'
                }`}
                onClick={() => onSelectUser(staff.userId, staff.userName)}
              >
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
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-emerald-600">{staff.totalCash.toFixed(0)}</span>
                          <DollarSign className="w-3 h-3 text-emerald-600" />
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
