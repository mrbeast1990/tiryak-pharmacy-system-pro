
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Revenue } from '@/store/pharmacyStore';

interface PeriodRevenueDetailsProps {
  onBack: () => void;
  periodStartDate: string;
  periodEndDate: string;
  periodRevenue: number;
  periodRevenues: Revenue[];
  language: 'ar' | 'en';
}

const PeriodRevenueDetails: React.FC<PeriodRevenueDetailsProps> = ({
  onBack,
  periodStartDate,
  periodEndDate,
  periodRevenue,
  periodRevenues,
  language,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Logo */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png)',
          backgroundSize: '600px 600px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 space-x-reverse text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة</span>
              </Button>
              <h1 className="text-lg font-bold text-gray-900">إيراد من {periodStartDate} إلى {periodEndDate}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <Card className="card-shadow mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">إجمالي الإيراد للفترة</p>
              <p className="text-2xl font-bold text-green-600">{periodRevenue} دينار</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {periodRevenues
            .filter(revenue => revenue.type === 'income')
            .map((revenue) => {
              const cleanedNotes = revenue.notes ? revenue.notes.replace('- إيراد', '').replace('- صرف فكة', '').trim() : '';
              return (
                <Card key={revenue.id} className="card-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {revenue.period === 'morning' ? 'صباحية' : 
                           revenue.period === 'evening' ? 'مسائية' : 
                           revenue.period === 'night' ? 'ليلية' : 'احمد الرجيلي'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          الإيراد: {revenue.amount} دينار
                        </p>
                        {cleanedNotes && (
                          <p className="text-sm text-gray-500 mt-1">الملاحظات: {cleanedNotes}</p>
                        )}
                      </div>
                      <Badge variant="default">
                        إيراد
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          
          {periodRevenues.filter(revenue => revenue.type === 'income').length === 0 && (
            <Card className="card-shadow">
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">لا توجد إيرادات في هذه الفترة</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default PeriodRevenueDetails;
