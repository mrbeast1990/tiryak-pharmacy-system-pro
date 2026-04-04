
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, Check } from 'lucide-react';

interface POSCashInputProps {
  onRegister: (amount: number) => Promise<void>;
  disabled?: boolean;
}

const POSCashInput: React.FC<POSCashInputProps> = ({ onRegister, disabled }) => {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (val: string) => {
    if (val && !/^\d*\.?\d*$/.test(val)) return;
    setValue(val);
  };

  const handleRegister = async () => {
    const num = parseFloat(value);
    if (!num || num <= 0 || submitting) return;
    setSubmitting(true);
    await onRegister(num);
    setValue('');
    setSubmitting(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleRegister}
        disabled={!value || parseFloat(value) <= 0 || submitting || disabled}
        className="h-14 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shrink-0"
      >
        {submitting ? (
          <span className="animate-pulse">...</span>
        ) : (
          <>
            <Check className="w-5 h-5 ml-1.5" />
            تسجيل
          </>
        )}
      </Button>
      <div className="relative flex-1">
        <Input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRegister()}
          placeholder="0.00"
          disabled={disabled}
          className="h-14 text-2xl font-bold text-right pr-4 pl-12 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 bg-emerald-50/50"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSCashInput;
