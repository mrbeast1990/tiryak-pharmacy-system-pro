
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';

const SERVICES = [
  { key: 'mobi_cash', label: 'موبي كاش', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { key: 'yser_pay', label: 'يسر باي', color: 'bg-blue-500 hover:bg-blue-600' },
  { key: 'cards', label: 'بطاقات', color: 'bg-rose-500 hover:bg-rose-600' },
  { key: 'bank_transfer', label: 'تحويل', color: 'bg-amber-500 hover:bg-amber-600' },
  { key: 'mobi_nab', label: 'موبي ناب', color: 'bg-purple-500 hover:bg-purple-600' },
  { key: 'tadawul', label: 'تداول', color: 'bg-orange-500 hover:bg-orange-600' },
];

export const SERVICE_COLORS: Record<string, string> = {
  mobi_cash: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  yser_pay: 'text-blue-600 bg-blue-50 border-blue-200',
  cards: 'text-rose-600 bg-rose-50 border-rose-200',
  bank_transfer: 'text-amber-600 bg-amber-50 border-amber-200',
  mobi_nab: 'text-purple-600 bg-purple-50 border-purple-200',
  tadawul: 'text-orange-600 bg-orange-50 border-orange-200',
  pay_for_me: 'text-cyan-600 bg-cyan-50 border-cyan-200',
};

export const SERVICE_LABELS: Record<string, string> = {
  mobi_cash: 'موبي كاش',
  yser_pay: 'يسر باي',
  mobi_nab: 'موبي ناب',
  bank_transfer: 'تحويل',
  pay_for_me: 'ادفع لي',
  cards: 'بطاقات',
  tadawul: 'تداول',
};

interface BankingServicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (service: string, amount: number) => Promise<void>;
  disabled?: boolean;
}

const BankingServicesModal: React.FC<BankingServicesModalProps> = ({
  open,
  onOpenChange,
  onRegister,
  disabled,
}) => {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (val: string) => {
    if (val && !/^\d*\.?\d*$/.test(val)) return;
    setValue(val);
  };

  const handleServiceClick = async (serviceKey: string) => {
    const num = parseFloat(value);
    if (!num || num <= 0 || submitting) return;
    setSubmitting(true);
    await onRegister(serviceKey, num);
    setValue('');
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="px-5 pt-5 pb-3 bg-gradient-to-l from-blue-50 to-blue-100/50">
          <DialogTitle className="text-right flex items-center justify-end gap-2 text-lg font-bold text-foreground">
            <span>الخدمات المصرفية</span>
            <Building2 className="w-5 h-5 text-blue-600" />
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Amount Input */}
          <Input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={e => handleChange(e.target.value)}
            placeholder="أدخل المبلغ ثم اختر الخدمة"
            className="h-14 text-xl font-bold text-center rounded-xl border-2 border-blue-200 focus:border-blue-500 bg-blue-50/30"
            autoFocus
          />

          {/* Service Buttons Grid */}
          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map(s => (
              <button
                key={s.key}
                onClick={() => handleServiceClick(s.key)}
                disabled={!value || parseFloat(value) <= 0 || submitting || disabled}
                className={`${s.color} text-white font-bold rounded-xl h-14 text-sm transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {submitting && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">جاري التسجيل...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BankingServicesModal;
