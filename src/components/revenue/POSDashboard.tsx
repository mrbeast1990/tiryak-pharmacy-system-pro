
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Building2, TrendingUp, ChevronLeft, ChevronRight, Lock, LockOpen, Stamp } from 'lucide-react';

interface POSDashboardProps {
  selectedDate: string;
  dailyCash: number;
  dailyServices: number;
  onShowDetails: () => void;
  navigateDate: (dir: 'prev' | 'next') => void;
  canNavigateDate: boolean;
  isAdmin: boolean;
  isLocked: boolean;
  onToggleLock?: () => void;
  totalAdjustment?: number;
}

const POSDashboard: React.FC<POSDashboardProps> = ({
  selectedDate,
  dailyCash,
  dailyServices,
  onShowDetails,
  navigateDate,
  canNavigateDate,
  isAdmin,
  isLocked,
  onToggleLock,
  totalAdjustment = 0,
}) => {
  const dailyTotal = dailyCash + dailyServices;

  return (
    <Card
      className={`border-0 shadow-lg rounded-2xl overflow-hidden transition-colors relative ${isLocked ? 'bg-muted/60' : 'bg-card'}`}
    >
      {/* Lock Stamp Overlay on main dashboard */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className={`
            rotate-[-15deg] border-[4px] rounded-3xl px-8 py-4 opacity-15
            ${totalAdjustment > 0 
              ? 'border-emerald-600 text-emerald-600' 
              : totalAdjustment < 0 
                ? 'border-destructive text-destructive' 
                : 'border-muted-foreground text-muted-foreground'
            }
          `}>
            <div className="text-center">
              <Stamp className="w-8 h-8 mx-auto mb-1" />
              <p className="text-xl font-black tracking-wider">مقفل</p>
              {totalAdjustment !== 0 && (
                <p className="text-lg font-bold mt-1">
                  {totalAdjustment > 0 ? '+' : ''}{totalAdjustment.toFixed(0)} د
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0 relative z-0">
        {/* Date row */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
          {isAdmin && canNavigateDate ? (
            <Button onClick={() => navigateDate('next')} variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : <div className="w-8" />}

          <div className="text-center flex items-center gap-2">
            {isAdmin && onToggleLock && (
              <Button
                onClick={e => { e.stopPropagation(); onToggleLock(); }}
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-full ${isLocked ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
              </Button>
            )}
            <div>
              <p className="text-[10px] text-muted-foreground">إيراد يوم</p>
              <p className="text-sm font-bold text-foreground">{selectedDate}</p>
            </div>
          </div>

          {isAdmin && canNavigateDate ? (
            <Button onClick={() => navigateDate('prev')} variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : <div className="w-8" />}
        </div>

        {/* Totals */}
        <div
          className="px-4 py-4 cursor-pointer active:bg-muted/30 transition-colors"
          onClick={onShowDetails}
        >
          {/* Grand total */}
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">الإجمالي</span>
            </div>
            <p className="text-3xl font-black text-primary mt-1">
              {dailyTotal.toFixed(0)} <span className="text-base font-bold">د</span>
            </p>
          </div>

          {/* Cash & Services */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-3 py-2.5 border border-emerald-200/50">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-tight">كاش</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-base font-bold text-emerald-600">{dailyCash.toFixed(0)}</p>
                  {totalAdjustment !== 0 && (
                    <span className={`text-xs font-bold ${totalAdjustment > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {totalAdjustment > 0 ? '+' : ''}{totalAdjustment.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl px-3 py-2.5 border border-blue-200/50">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-tight">خدمات</p>
                <p className="text-base font-bold text-blue-600">{dailyServices.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {isLocked && (
            <div className="mt-3 text-center">
              <span className="text-xs text-destructive font-semibold bg-destructive/10 px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Lock className="w-3 h-3" />
                تم الاعتماد والإقفال
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default POSDashboard;
