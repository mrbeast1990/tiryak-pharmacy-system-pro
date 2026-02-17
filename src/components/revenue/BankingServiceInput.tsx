import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Smartphone, CreditCard, ArrowRightLeft, Wallet, Send } from 'lucide-react';

export interface BankingServiceValues {
  mobi_cash: string;
  yser_pay: string;
  mobi_nab: string;
  bank_transfer: string;
  pay_for_me: string;
}

interface BankingServiceInputProps {
  values: BankingServiceValues;
  onValuesChange: (values: BankingServiceValues) => void;
  totalAmount: number;
}

const SERVICES = [
  { key: 'mobi_cash' as const, label: 'موبي كاش', icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'yser_pay' as const, label: 'يسر باي', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'mobi_nab' as const, label: 'موبي ناب', icon: Wallet, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'bank_transfer' as const, label: 'تحويل مصرفي', icon: ArrowRightLeft, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'pay_for_me' as const, label: 'ادفع لي', icon: Send, color: 'text-rose-600', bg: 'bg-rose-50' },
];

const BankingServiceInput: React.FC<BankingServiceInputProps> = ({
  values,
  onValuesChange,
  totalAmount,
}) => {
  const handleChange = (key: keyof BankingServiceValues, val: string) => {
    // Only allow numbers and decimal point
    if (val && !/^\d*\.?\d*$/.test(val)) return;
    onValuesChange({ ...values, [key]: val });
  };

  return (
    <Card className="border-0 shadow-sm bg-blue-50/30 rounded-xl overflow-hidden">
      <div className="flex">
        <div className="w-1.5 bg-blue-500" />
        <CardContent className="p-4 flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-foreground">الخدمات المصرفية</span>
            </div>
            {totalAmount > 0 && (
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                {totalAmount.toFixed(2)} د
              </div>
            )}
          </div>

          {/* Service Fields */}
          <div className="space-y-2">
            {SERVICES.map(({ key, label, icon: Icon, color, bg }) => (
              <div key={key} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-20 text-right shrink-0">{label}</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="0"
                  className="text-sm text-right h-9 border-blue-200/50 focus:border-blue-400 bg-white rounded-lg flex-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default BankingServiceInput;
