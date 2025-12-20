import React from 'react';
import { Button } from '@/components/ui/button';
import { Delete, Check } from 'lucide-react';

interface CustomNumpadProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const CustomNumpad: React.FC<CustomNumpadProps> = ({ value, onChange, onClose }) => {
  const handleNumberClick = (num: string) => {
    onChange(value + num);
  };

  const handleDecimalClick = () => {
    if (!value.includes('.')) {
      onChange(value + '.');
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const buttons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '.', '0', 'backspace'
  ];

  return (
    <div className="bg-white border-2 border-primary/20 rounded-xl p-3 shadow-lg mt-2">
      <div className="bg-muted rounded-lg p-3 mb-3 text-left">
        <span className="text-xl font-bold text-foreground">
          {value || '0'}
        </span>
        <span className="text-sm text-muted-foreground mr-2">دينار</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn, index) => (
          <Button
            key={index}
            type="button"
            variant="outline"
            className={`h-12 text-lg font-semibold transition-all duration-200 ${
              btn === 'backspace' 
                ? 'bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30' 
                : 'hover:bg-primary/10 hover:border-primary/50'
            }`}
            onClick={() => {
              if (btn === 'backspace') handleBackspace();
              else if (btn === '.') handleDecimalClick();
              else handleNumberClick(btn);
            }}
          >
            {btn === 'backspace' ? <Delete className="w-5 h-5" /> : btn}
          </Button>
        ))}
        
        <Button
          type="button"
          variant="outline"
          className="h-12 text-sm font-semibold bg-muted hover:bg-muted/80"
          onClick={handleClear}
        >
          مسح
        </Button>
      </div>
      
      <Button
        type="button"
        className="w-full mt-3 h-11 pharmacy-gradient text-white font-semibold"
        onClick={onClose}
      >
        <Check className="w-5 h-5 ml-2" />
        تأكيد
      </Button>
    </div>
  );
};

export default CustomNumpad;
