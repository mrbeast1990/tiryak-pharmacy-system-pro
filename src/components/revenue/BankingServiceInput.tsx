import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, X } from 'lucide-react';

export interface BankingServiceEntry {
  id: string;
  service: string;
  amount: number;
}

const SERVICE_OPTIONS = [
  { key: 'mobi_cash', label: 'موبي كاش' },
  { key: 'yser_pay', label: 'يسر باي' },
  { key: 'mobi_nab', label: 'موبي ناب' },
  { key: 'bank_transfer', label: 'تحويل مصرفي' },
  { key: 'pay_for_me', label: 'ادفع لي' },
];

const SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_OPTIONS.map(s => [s.key, s.label])
);

interface BankingServiceInputProps {
  entries: BankingServiceEntry[];
  onEntriesChange: (entries: BankingServiceEntry[]) => void;
  totalAmount: number;
}

const BankingServiceInput: React.FC<BankingServiceInputProps> = ({
  entries,
  onEntriesChange,
  totalAmount,
}) => {
  const [selectedService, setSelectedService] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = () => {
    const num = parseFloat(amount);
    if (!selectedService || !num || num <= 0) return;
    const newEntry: BankingServiceEntry = {
      id: crypto.randomUUID(),
      service: selectedService,
      amount: num,
    };
    onEntriesChange([...entries, newEntry]);
    setAmount('');
  };

  const handleRemove = (id: string) => {
    onEntriesChange(entries.filter(e => e.id !== id));
  };

  const handleAmountChange = (val: string) => {
    if (val && !/^\d*\.?\d*$/.test(val)) return;
    setAmount(val);
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

          {/* Input Row: Select + Amount + Add Button */}
          <div className="flex items-center gap-2">
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="text-xs text-right h-9 border-blue-200/50 bg-white rounded-lg flex-1 min-w-0">
                <SelectValue placeholder="اختر الخدمة" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {SERVICE_OPTIONS.map(s => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="المبلغ"
              className="text-sm text-right h-9 border-blue-200/50 focus:border-blue-400 bg-white rounded-lg w-24"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 shrink-0 border-blue-300 text-blue-600 hover:bg-blue-100"
              onClick={handleAdd}
              disabled={!selectedService || !amount || parseFloat(amount) <= 0}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Chips */}
          {entries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center gap-1.5 bg-blue-100/80 text-blue-800 rounded-full px-3 py-1.5 text-xs font-medium"
                >
                  <span>{SERVICE_LABELS[entry.service] || entry.service}: {entry.amount}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(entry.id)}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};

export default BankingServiceInput;
