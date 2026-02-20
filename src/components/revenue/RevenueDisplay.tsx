import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, DollarSign, Building2, TrendingUp } from 'lucide-react';

interface RevenueDisplayProps {
  dailyRevenue: number;
  dailyBankingServices: number;
  selectedDate: string;
  navigateDate: (direction: 'prev' | 'next') => void;
  setShowDailyDetails: (show: boolean) => void;
  canNavigateDate: boolean;
  isAdmin: boolean;
}

const RevenueDisplay: React.FC<RevenueDisplayProps> = ({
  dailyRevenue,
  dailyBankingServices,
  selectedDate,
  navigateDate,
  setShowDailyDetails,
  canNavigateDate,
  isAdmin,
}) => {
  const dailyTotal = dailyRevenue + dailyBankingServices;

  return (
    <Card className="bg-card border border-border/50 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Date row with arrows */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          {isAdmin && canNavigateDate ? (
            <Button
              onClick={() => navigateDate('next')}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="w-8" />
          )}

          <div className="text-center">
            <p className="text-[11px] text-muted-foreground">إيراد يوم</p>
            <p className="text-sm font-bold text-foreground">{selectedDate}</p>
          </div>

          {isAdmin && canNavigateDate ? (
            <Button
              onClick={() => navigateDate('prev')}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <div className="w-8" />
          )}
        </div>

        {/* Total + Cash/Services row */}
        <div
          className="px-4 py-3 cursor-pointer active:bg-muted/30 transition-colors"
          onClick={() => setShowDailyDetails(true)}
        >
          {/* Grand total */}
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">الإجمالي</span>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">{dailyTotal.toFixed(0)} <span className="text-base">د</span></p>
          </div>

          {/* Cash & Services side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-3 py-2 border border-emerald-200/50">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-tight">كاش</p>
                <p className="text-sm font-bold text-emerald-600">{dailyRevenue.toFixed(0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl px-3 py-2 border border-blue-200/50">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-tight">خدمات</p>
                <p className="text-sm font-bold text-blue-600">{dailyBankingServices.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueDisplay;
