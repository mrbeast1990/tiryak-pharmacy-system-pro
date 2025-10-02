
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, TrendingUp, DollarSign, Building2, Calendar } from 'lucide-react';

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
  return (
    <Card className="card-shadow hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <CardTitle className="text-right text-blue-800 flex items-center justify-end gap-2">
          <span>📊 عرض النتائج</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Daily Revenue Summary */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 mb-6 border-2 border-emerald-200">
          <h3 className="text-base font-bold text-gray-800 text-right mb-4 flex items-center justify-end gap-2">
            <span>إيراد اليوم النقدي</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </h3>
          <div className="flex items-center justify-between">
            {canNavigateDate ? (
              <Button
                onClick={() => navigateDate('next')}
                variant="outline"
                size="sm"
                className="border-2 hover:bg-emerald-100"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            ) : (
              <div className="w-10 h-9" />
            )}
            
            <div className="text-center cursor-pointer" onClick={() => setShowDailyDetails(true)}>
              <p className="text-2xl font-bold text-green-700 mb-1">{dailyRevenue.toFixed(2)} دينار</p>
              <p className="text-xs text-gray-600 font-medium">{selectedDate}</p>
            </div>
            
            {canNavigateDate ? (
              <Button
                onClick={() => navigateDate('prev')}
                variant="outline"
                size="sm"
                className="border-2 hover:bg-emerald-100"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="w-10 h-9" />
            )}
          </div>
        </div>

        {/* Period Analysis */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-800 text-right flex items-center justify-end gap-2">
            <span>تحليل الفترة الزمنية</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 text-right block">
                من
              </label>
              <Input
                type="date"
                value={periodStartDate}
                onChange={(e) => setPeriodStartDate(e.target.value)}
                className="text-xs text-right border-2 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 text-right block">
                إلى
              </label>
              <Input
                type="date"
                value={periodEndDate}
                onChange={(e) => setPeriodEndDate(e.target.value)}
                className="text-xs text-right border-2 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={showPeriodBanking}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 shadow-md"
              size="sm"
            >
              <Building2 className="w-4 h-4 ml-2" />
              الخدمات المصرفية
            </Button>
            
            <Button
              onClick={showPeriodRevenue}
              className="w-full pharmacy-gradient text-white font-semibold py-3 shadow-md"
              size="sm"
            >
              <DollarSign className="w-4 h-4 ml-2" />
              الإيرادات النقدية
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueDisplay;
