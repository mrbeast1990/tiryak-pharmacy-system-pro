
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

type Period = 'morning' | 'evening' | 'night' | 'ahmad_rajili';

interface RevenueFormProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  period: Period;
  setPeriod: (period: Period) => void;
  canSelectPeriod: boolean;
  periodDisplayName: string;
  expense: string;
  setExpense: (value: string) => void;
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
  expense,
  setExpense,
  income,
  setIncome,
  notes,
  setNotes,
  handleSubmit,
  formSubmitting,
}) => {
  return (
    <Card className="card-shadow mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 text-right block">
              التاريخ
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
              الفترة
            </label>
            {canSelectPeriod ? (
              <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
                <SelectTrigger className="text-sm text-right">
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
                className="text-sm text-right bg-gray-100"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 text-right block">
              صرف الفكة (دينار)
            </label>
            <Input
              type="number"
              value={expense}
              onChange={(e) => setExpense(e.target.value)}
              placeholder="أدخل مبلغ صرف الفكة"
              className="text-sm text-right"
              step="0.01"
            />
            <p className="text-xs text-gray-500 text-right">
              ملاحظة: صرف الفكة لا يُخصم من الإيراد
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 text-right block">
              الإيراد (دينار)
            </label>
            <Input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="أدخل مبلغ الإيراد"
              className="text-sm text-right"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 text-right block">
              ملاحظات
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات (اختياري)"
              className="text-sm text-right resize-none"
              rows={3}
            />
          </div>
          
          <Button type="submit" className="w-full pharmacy-gradient text-white font-medium py-3" disabled={formSubmitting}>
            {formSubmitting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Plus className="w-4 h-4 ml-2" />}
            إضافة إدخال
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RevenueForm;
