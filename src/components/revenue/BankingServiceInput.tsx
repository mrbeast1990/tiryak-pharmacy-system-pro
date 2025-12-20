import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, X } from 'lucide-react';
import CustomNumpad from './CustomNumpad';

export interface BankingServiceItem {
  id: string;
  type: string;
  typeName: string;
  amount: number;
}

interface BankingServiceInputProps {
  items: BankingServiceItem[];
  onItemsChange: (items: BankingServiceItem[]) => void;
  totalAmount: number;
}

const SERVICE_TYPES = [
  { value: 'mobi_cash', label: 'موبي كاش' },
  { value: 'cards', label: 'بطاقات' },
  { value: 'transfer', label: 'تحويل' },
  { value: 'trading', label: 'تداول' },
];

const BankingServiceInput: React.FC<BankingServiceInputProps> = ({
  items,
  onItemsChange,
  totalAmount,
}) => {
  const [selectedType, setSelectedType] = useState<string>('mobi_cash');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [showNumpad, setShowNumpad] = useState<boolean>(false);

  const handleAddItem = () => {
    const amount = parseFloat(currentAmount);
    if (!amount || amount <= 0) return;

    const typeInfo = SERVICE_TYPES.find(t => t.value === selectedType);
    if (!typeInfo) return;

    const newItem: BankingServiceItem = {
      id: crypto.randomUUID(),
      type: selectedType,
      typeName: typeInfo.label,
      amount: amount,
    };

    onItemsChange([...items, newItem]);
    setCurrentAmount('');
    setShowNumpad(false);
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Header with total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">خدمات مصرفية</span>
        </div>
        {totalAmount > 0 && (
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
            {totalAmount.toFixed(2)} د
          </div>
        )}
      </div>

      {/* Input Row */}
      <div className="flex gap-2 items-stretch">
        {/* Type Select */}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-28 text-xs h-11 border-blue-200 focus:border-blue-500 bg-blue-50/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {SERVICE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value} className="text-sm">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Amount Input */}
        <div 
          className="flex-1 relative cursor-pointer"
          onClick={() => setShowNumpad(!showNumpad)}
        >
          <Input
            type="text"
            value={currentAmount}
            readOnly
            placeholder="المبلغ"
            className="text-sm text-right h-11 border-blue-200 focus:border-blue-500 bg-blue-50/50 rounded-lg cursor-pointer"
          />
        </div>

        {/* Add Button */}
        <Button
          type="button"
          onClick={handleAddItem}
          disabled={!currentAmount || parseFloat(currentAmount) <= 0}
          className="h-11 w-11 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shrink-0"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Numpad */}
      {showNumpad && (
        <CustomNumpad
          value={currentAmount}
          onChange={setCurrentAmount}
          onClose={() => setShowNumpad(false)}
        />
      )}

      {/* Added Items (Chips) */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200 transition-all hover:bg-blue-200"
            >
              <span className="text-blue-600 font-semibold">{item.typeName}:</span>
              <span className="font-bold">{item.amount.toFixed(2)} د</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="w-5 h-5 rounded-full bg-blue-300/50 hover:bg-destructive/80 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BankingServiceInput;
