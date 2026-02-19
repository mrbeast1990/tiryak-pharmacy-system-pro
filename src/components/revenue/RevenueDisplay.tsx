import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, DollarSign, Building2, TrendingUp } from 'lucide-react';

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
    <Card className="bg-card border-0 shadow-lg rounded-2xl overflow-hidden">
      <div className="flex">
        <div className="w-1.5 bg-primary" />
        <CardContent className="p-0 flex-1">
          {/* Date Navigation Row - Admin only */}
          {isAdmin && (
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              {canNavigateDate ? (
                <Button
                  onClick={() => navigateDate('next')}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
                >
                  <ArrowLeft className="w-4 h-4 text-primary" />
                </Button>
              ) : (
                <div className="w-8" />
              )}
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">إيراد يوم</p>
                <p className="text-sm font-bold text-foreground">{selectedDate}</p>
              </div>
              
              {canNavigateDate ? (
                <Button
                  onClick={() => navigateDate('prev')}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
                >
                  <ArrowRight className="w-4 h-4 text-primary" />
                </Button>
              ) : (
                <div className="w-8" />
              )}
            </div>
          )}

          {/* 3 Summary Cards in a row */}
          <div 
            className="grid grid-cols-3 gap-2 px-3 pb-3 pt-2 cursor-pointer"
            onClick={() => setShowDailyDetails(true)}
          >
            {/* Cash */}
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-2.5 text-center border border-green-200/50">
              <DollarSign className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">كاش</p>
              <p className="text-sm font-bold text-green-600">{dailyRevenue.toFixed(0)}</p>
            </div>

            {/* Banking */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-2.5 text-center border border-blue-200/50">
              <Building2 className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">خدمات</p>
              <p className="text-sm font-bold text-blue-600">{dailyBankingServices.toFixed(0)}</p>
            </div>

            {/* Total */}
            <div className="bg-primary/10 rounded-xl p-2.5 text-center border border-primary/20">
              <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">إجمالي</p>
              <p className="text-sm font-bold text-primary">{dailyTotal.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default RevenueDisplay;
