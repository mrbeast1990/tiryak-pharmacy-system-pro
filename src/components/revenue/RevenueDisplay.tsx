
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, DollarSign, Building2, Calendar, TrendingUp } from 'lucide-react';

interface RevenueDisplayProps {
  dailyRevenue: number;
  dailyBankingServices: number;
  selectedDate: string;
  navigateDate: (direction: 'prev' | 'next') => void;
  setShowDailyDetails: (show: boolean) => void;
  periodStartDate: string;
  setPeriodStartDate: (date: string) => void;
  periodEndDate: string;
  setPeriodEndDate: (date: string) => void;
  showPeriodRevenue: () => void;
  showPeriodBanking: () => void;
  canNavigateDate: boolean;
}

const RevenueDisplay: React.FC<RevenueDisplayProps> = ({
  dailyRevenue,
  dailyBankingServices,
  selectedDate,
  navigateDate,
  setShowDailyDetails,
  periodStartDate,
  setPeriodStartDate,
  periodEndDate,
  setPeriodEndDate,
  showPeriodRevenue,
  showPeriodBanking,
  canNavigateDate,
}) => {
  const dailyTotal = dailyRevenue + dailyBankingServices;

  return (
    <div className="space-y-4">
      {/* Summary Cards - 3 cards in a row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Cash Card */}
        <Card 
          className="bg-white border-0 shadow-md rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowDailyDetails(true)}
        >
          <div className="flex h-full">
            <div className="w-1 bg-green-500" />
            <CardContent className="p-3 flex-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs text-muted-foreground mb-1">كاش</span>
                <span className="text-sm font-bold text-green-600">{dailyRevenue.toFixed(0)}</span>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Banking Card */}
        <Card 
          className="bg-white border-0 shadow-md rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowDailyDetails(true)}
        >
          <div className="flex h-full">
            <div className="w-1 bg-blue-500" />
            <CardContent className="p-3 flex-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-[10px] text-muted-foreground mb-1">خدمات مصرفية</span>
                <span className="text-sm font-bold text-blue-600">{dailyBankingServices.toFixed(0)}</span>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Total Card */}
        <Card 
          className="bg-white border-0 shadow-md rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowDailyDetails(true)}
        >
          <div className="flex h-full">
            <div className="w-1 bg-primary" />
            <CardContent className="p-3 flex-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground mb-1">إجمالي</span>
                <span className="text-sm font-bold text-primary">{dailyTotal.toFixed(0)}</span>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Date Navigation */}
      <Card className="bg-white border-0 shadow-md rounded-xl overflow-hidden">
        <div className="flex">
          <div className="w-1.5 bg-primary" />
          <CardContent className="p-4 flex-1">
            <div className="flex items-center justify-between">
              {canNavigateDate ? (
                <Button
                  onClick={() => navigateDate('next')}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-primary/10 rounded-full"
                >
                  <ArrowLeft className="w-4 h-4 text-primary" />
                </Button>
              ) : (
                <div className="w-9 h-9" />
              )}
              
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-0.5">إيراد يوم</p>
                <p className="text-sm font-bold text-foreground">{selectedDate}</p>
              </div>
              
              {canNavigateDate ? (
                <Button
                  onClick={() => navigateDate('prev')}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-primary/10 rounded-full"
                >
                  <ArrowRight className="w-4 h-4 text-primary" />
                </Button>
              ) : (
                <div className="w-9 h-9" />
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Period Analysis */}
      <Card className="bg-white border-0 shadow-md rounded-xl overflow-hidden">
        <div className="flex">
          <div className="w-1.5 bg-blue-500" />
          <CardContent className="p-4 flex-1">
            <h3 className="text-sm font-bold text-foreground text-right flex items-center justify-end gap-2 mb-3">
              <span>تحليل الفترة الزمنية</span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground text-right block">من</label>
                <Input
                  type="date"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  className="text-xs text-right h-9 border-border/50 focus:border-blue-500 bg-muted/30 rounded-lg"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground text-right block">إلى</label>
                <Input
                  type="date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  className="text-xs text-right h-9 border-border/50 focus:border-blue-500 bg-muted/30 rounded-lg"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={showPeriodBanking}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-10 rounded-lg shadow-sm text-xs"
                size="sm"
              >
                <Building2 className="w-4 h-4 ml-1.5" />
                خدمات مصرفية
              </Button>
              
              <Button
                onClick={showPeriodRevenue}
                className="w-full pharmacy-gradient text-white font-semibold h-10 rounded-lg shadow-sm"
                size="sm"
              >
                <DollarSign className="w-4 h-4 ml-1.5" />
                كاش
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default RevenueDisplay;
