import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, FileText, Loader2, Save, Calculator } from 'lucide-react';
import { Period } from '@/hooks/revenue/useRevenueState';
import BankingServiceInput, { BankingServiceEntry } from './BankingServiceInput';

interface RevenueFormProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  period: Period;
  setPeriod: (period: Period) => void;
  canSelectPeriod: boolean;
  periodDisplayName: string;
  income: string;
  setIncome: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  formSubmitting: boolean;
  bankingValues: BankingServiceEntry[];
  onBankingValuesChange: (entries: BankingServiceEntry[]) => void;
  bankingTotal: number;
}

const RevenueForm: React.FC<RevenueFormProps> = ({
  selectedDate,
  setSelectedDate,
  period,
  setPeriod,
  canSelectPeriod,
  periodDisplayName,
  income,
  setIncome,
  notes,
  setNotes,
  handleSubmit,
  formSubmitting,
  bankingValues,
  onBankingValuesChange,
  bankingTotal,
}) => {
  const currentTotal = useMemo(() => {
    const incomeAmount = parseFloat(income) || 0;
    return incomeAmount + bankingTotal;
  }, [income, bankingTotal]);

  const handleIncomeChange = (val: string) => {
    if (val && !/^\d*\.?\d*$/.test(val)) return;
    setIncome(val);
  };

  return (
    <Card className="bg-card border-0 shadow-lg rounded-2xl overflow-hidden">
      <div className="flex">
        <div className="w-1.5 bg-primary" />
        <div className="flex-1">
          <CardHeader className="bg-gradient-to-l from-primary/5 to-primary/10 pb-4">
            <CardTitle className="text-right text-foreground flex items-center justify-end gap-2 text-lg">
              <span>إدخال الإيراد</span>
              <Calculator className="w-5 h-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 pb-6 px-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date and Period Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground text-right block flex items-center justify-end gap-1.5">
                    <span>التاريخ</span>
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-sm text-right h-10 border-border/50 focus:border-primary bg-muted/30 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground text-right block">
                    الفترة
                  </label>
                  {canSelectPeriod ? (
                    <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
                      <SelectTrigger className="text-sm text-right h-10 border-border/50 focus:border-primary bg-muted/30 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="morning">صباحية</SelectItem>
                        <SelectItem value="evening">مسائية</SelectItem>
                        <SelectItem value="night">ليلية</SelectItem>
                        <SelectItem value="ahmad_rajili">احمد الرجيلي</SelectItem>
                        <SelectItem value="abdulwahab">عبدالوهاب</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-10 flex items-center justify-end px-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <span className="text-sm font-medium text-primary">{periodDisplayName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cash Income - Direct numeric input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground text-right block flex items-center justify-end gap-1.5">
                  <span>الإيراد النقدي (دينار)</span>
                  <DollarSign className="w-3.5 h-3.5 text-green-600" />
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={income}
                    onChange={(e) => handleIncomeChange(e.target.value)}
                    placeholder="أدخل المبلغ"
                    className="text-sm text-right h-11 border-green-200 focus:border-green-500 bg-green-50/50 rounded-lg pr-3 pl-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Banking Services Card */}
              <BankingServiceInput
                entries={bankingValues}
                onEntriesChange={onBankingValuesChange}
                totalAmount={bankingTotal}
              />

              {/* Current Total Display */}
              {(income || bankingTotal > 0) && (
                <div className="bg-gradient-to-l from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Calculator className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">إجمالي الإدخال الحالي</span>
                    </div>
                    <span className="text-xl font-bold text-primary">{currentTotal.toFixed(2)} د</span>
                  </div>
                  <div className="flex justify-end gap-4 mt-2 text-xs text-muted-foreground">
                    <span>كاش: {parseFloat(income) || 0} د</span>
                    <span>خدمات: {bankingTotal.toFixed(2)} د</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground text-right block flex items-center justify-end gap-1.5">
                  <span>ملاحظات (اختياري)</span>
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات..."
                  className="text-sm text-right resize-none border-border/50 focus:border-primary bg-muted/30 rounded-lg"
                  rows={2}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full pharmacy-gradient text-white font-semibold h-12 text-base shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl" 
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
        </div>
      </div>
    </Card>
  );
};

export default RevenueForm;
