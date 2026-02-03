import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderBuilderStore, OrderProduct } from '@/store/orderBuilderStore';
import { cn } from '@/lib/utils';

interface CompactProductItemProps {
  product: OrderProduct;
}

const CompactProductItem: React.FC<CompactProductItemProps> = ({ product }) => {
  const { updateQuantity, incrementQuantity, decrementQuantity } = useOrderBuilderStore();

  const isSelected = product.quantity > 0;
  const subtotal = product.price * product.quantity;

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value) || 0;
    updateQuantity(product.id, num);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2.5 border-b border-border/50 transition-colors',
        isSelected && 'bg-primary/5'
      )}
    >
      {/* Right side - Product Info (RTL) */}
      <div className="flex-1 min-w-0 pl-3">
        <p className="font-semibold text-sm text-foreground line-clamp-1">
          {product.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {product.price.toFixed(2)} د.ل
          {product.expiryDate && ` | EXP: ${product.expiryDate}`}
        </p>
      </div>

      {/* Left side - Quantity Controls */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          {/* Plus button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => incrementQuantity(product.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          {/* Quantity display */}
          <input
            type="number"
            min="0"
            value={product.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="h-8 w-10 text-center text-sm font-medium bg-transparent border-0 focus:outline-none focus:ring-0"
            dir="ltr"
          />
          
          {/* Minus button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-muted-foreground/30 text-muted-foreground hover:bg-muted"
            onClick={() => decrementQuantity(product.id)}
            disabled={product.quantity === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Subtotal */}
        <span className={cn(
          'text-xs font-medium',
          isSelected ? 'text-primary' : 'text-muted-foreground'
        )}>
          {subtotal.toFixed(2)} د.ل
        </span>
      </div>
    </div>
  );
};

export default CompactProductItem;
