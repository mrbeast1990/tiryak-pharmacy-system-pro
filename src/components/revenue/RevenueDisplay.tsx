
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';

interface RevenueDisplayProps {
  dailyRevenue: number;
  selectedDate: string;
  navigateDate: (direction: 'prev' | 'next') => void;
  setShowDailyDetails: (show: boolean) => void;
  periodStartDate: string;
  setPeriodStartDate: (date: string) => void;
  periodEndDate: string;
  setPeriodEndDate: (date: string) => void;
  showPeriodRevenue: () => void;
}

const RevenueDisplay: React.FC<RevenueDisplayProps> = ({
  dailyRevenue,
  selectedDate,
  navigateDate,
  setShowDailyDetails,
  periodStartDate,
  setPeriodStartDate,
  periodEndDate,
  setPeriodEndDate,
  showPeriodRevenue,
}) => {
  return (
    <Card className="card-shadow mb-6">
      <CardHeader>
        <CardTitle>عرض الإيرادات</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Daily Revenue */}
        <div className="border-b pb-4 mb-4">
          <h3 className="text-base font-medium text-gray-700 text-right mb-2">
            إيراد اليوم
          </h3>
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigateDate('next')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="text-center cursor-pointer" onClick={() => setShowDailyDetails(true)}>
              <p className="text-lg font-bold text-green-600">{dailyRevenue} دينار</p>
              <p className="text-xs text-gray-500">{selectedDate}</p>
            </div>
            
            <Button
              onClick={() => navigateDate('prev')}
              variant="outline"
              size="sm"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Period Revenue */}
        <div>
          <h3 className="text-base font-medium text-gray-700 text-right mb-2">
            إيراد من تاريخ إلى تاريخ
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 text-right block">
                  من
                </label>
                <Input
                  type="date"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  className="text-xs text-right"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 text-right block">
                  إلى
                </label>
                <Input
                  type="date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  className="text-xs text-right"
                />
              </div>
            </div>
            
            <Button
              onClick={showPeriodRevenue}
              className="w-full pharmacy-gradient text-white"
              size="sm"
            >
              <TrendingUp className="w-4 h-4 ml-2" />
              عرض الإيراد
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueDisplay;
