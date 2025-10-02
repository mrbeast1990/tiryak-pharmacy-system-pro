
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, Building2, FileText, Loader2, Save } from 'lucide-react';
import { Period } from '@/hooks/revenue/useRevenueState';

interface RevenueFormProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  period: Period;
  setPeriod: (period: Period) => void;
  canSelectPeriod: boolean;
  periodDisplayName: string;
  bankingServices: string;
  setBankingServices: (value: string) => void;
  income: string;
  setIncome: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  formSubmitting: boolean;
}

const RevenueForm: React.FC<RevenueFormProps> = ({
  selectedDate,
  setSelectedDate,
  period,
  setPeriod,
  canSelectPeriod,
  periodDisplayName,
  bankingServices,
  setBankingServices,
  income,
  setIncome,
  notes,
  setNotes,
  handleSubmit,
  formSubmitting,
}) => {
  return (
    <Card className="card-shadow hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
        <CardTitle className="text-right text-emerald-800 flex items-center justify-end gap-2">
          <span>📋 إدخال الإيراد</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 text-right block flex items-center justify-end gap-2">
              <span>التاريخ</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm text-right border-2 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 text-right block">
              الفترة
            </label>
            {canSelectPeriod ? (
              <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
                <SelectTrigger className="text-sm text-right border-2 focus:border-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">صباحية</SelectItem>
                  <SelectItem value="evening">مسائية</SelectItem>
                  <SelectItem value="night">ليلية</SelectItem>
                  <SelectItem value="ahmad_rajili">احمد الرجيلي</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="text"
                value={periodDisplayName}
                disabled
                className="text-sm text-right bg-gray-50 border-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 text-right block flex items-center justify-end gap-2">
              <span>الإيراد النقدي (دينار)</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </label>
            <Input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="أدخل مبلغ الإيراد النقدي"
              className="text-sm text-right border-2 focus:border-green-500 transition-colors"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 text-right block flex items-center justify-end gap-2">
              <span>خدمات مصرفية (دينار)</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </label>
            <Input
              type="number"
              value={bankingServices}
              onChange={(e) => setBankingServices(e.target.value)}
              placeholder="أدخل مبلغ الخدمات المصرفية"
              className="text-sm text-right border-2 focus:border-blue-500 transition-colors"
              step="0.01"
            />
            <p className="text-xs text-gray-500 text-right flex items-center justify-end gap-1">
              <span>ملاحظة: الخدمات المصرفية منفصلة عن الإيراد النقدي</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 text-right block flex items-center justify-end gap-2">
              <span>ملاحظات</span>
              <FileText className="w-4 h-4 text-gray-600" />
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات (اختياري)"
              className="text-sm text-right resize-none border-2 focus:border-emerald-500 transition-colors"
              rows={3}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full pharmacy-gradient text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all duration-300" 
            disabled={formSubmitting}
          >
            {formSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 ml-2" />
                حفظ البيانات
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RevenueForm;
