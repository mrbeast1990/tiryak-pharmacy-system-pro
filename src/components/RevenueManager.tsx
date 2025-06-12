
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Revenue } from '@/store/pharmacyStore';
import { ArrowRight, Plus, TrendingUp, DollarSign, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface RevenueManagerProps {
  onBack: () => void;
}

const RevenueManager: React.FC<RevenueManagerProps> = ({ onBack }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [period, setPeriod] = useState<'morning' | 'evening' | 'night'>('morning');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const { user, checkPermission } = useAuthStore();
  const { language, t } = useLanguageStore();
  const { revenues, addRevenue, getTotalDailyRevenue } = usePharmacyStore();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount))) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال مبلغ صحيح" : "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Check permissions
    const canRegisterForPeriod = 
      checkPermission('register_revenue_all') ||
      checkPermission(`register_revenue_${period}`) ||
      user?.role === 'admin' ||
      user?.role === 'ahmad_rajili';

    if (!canRegisterForPeriod) {
      toast({
        title: language === 'ar' ? "غير مصرح" : "Unauthorized",
        description: language === 'ar' ? `لا يمكنك تسجيل إيرادات فترة ${period === 'morning' ? 'الصباح' : period === 'evening' ? 'المساء' : 'الليل'}` : `Cannot register ${period} period revenues`,
        variant: "destructive",
      });
      return;
    }

    addRevenue({
      amount: Number(amount),
      type,
      period,
      notes,
      date: selectedDate,
      createdBy: user?.name || ''
    });
    
    toast({
      title: language === 'ar' ? "تم الإضافة" : "Added",
      description: language === 'ar' ? `تم تسجيل ${type === 'income' ? 'إيراد' : 'صرف'} بمبلغ ${amount} دينار` : `${type === 'income' ? 'Income' : 'Expense'} of ${amount} JD registered`,
    });

    setAmount('');
    setNotes('');
  };

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
                <span>{t('back')}</span>
              </Button>
              <h1 className="text-lg font-bold text-gray-900">{t('revenue.addRevenue')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 relative z-10">
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  {t('revenue.date')}
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-sm text-right"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  {t('revenue.type')}
                </label>
                <Select value={type} onValueChange={(value: 'income' | 'expense') => setType(value)}>
                  <SelectTrigger className="text-sm text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">{language === 'ar' ? 'إيراد' : 'Income'}</SelectItem>
                    <SelectItem value="expense">
                      <span className="text-blue-600 font-medium">{language === 'ar' ? 'صرف' : 'Expense'}</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  {t('revenue.period')}
                </label>
                <Select value={period} onValueChange={(value: 'morning' | 'evening' | 'night') => setPeriod(value)}>
                  <SelectTrigger className="text-sm text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">{language === 'ar' ? 'الصباح' : 'Morning'}</SelectItem>
                    <SelectItem value="evening">{language === 'ar' ? 'المساء' : 'Evening'}</SelectItem>
                    <SelectItem value="night">{language === 'ar' ? 'الليل' : 'Night'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  {t('revenue.amount')} ({language === 'ar' ? 'دينار' : 'JD'})
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل المبلغ' : 'Enter amount'}
                  className="text-sm text-right"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-right block">
                  {t('revenue.notes')}
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                  className="text-sm text-right resize-none"
                  rows={3}
                />
              </div>
              
              <Button type="submit" className="w-full pharmacy-gradient text-white font-medium py-3">
                <Plus className="w-4 h-4 ml-2" />
                {t('revenue.addEntry')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RevenueManager;
