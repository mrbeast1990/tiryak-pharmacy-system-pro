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
        'flex flex-col px-3 py-2.5 border-b border-border/50 transition-colors',
        isSelected && 'bg-primary/5'
      )}
    >
      {/* Row 1 - Product Name (full width) */}
      <p className="font-semibold text-sm text-foreground line-clamp-2" dir="ltr">
        {product.name}
      </p>

      {/* Row 2 - Price & Controls */}
      <div className="flex items-center justify-between mt-1.5">
        {/* Price & Expiry */}
        <div className="text-xs text-muted-foreground">
          <span>{product.price.toFixed(2)} د.ل</span>
          {product.expiryDate && <span className="mr-2"> | EXP: {product.expiryDate}</span>}
        </div>

        {/* Quantity Controls + Subtotal */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => incrementQuantity(product.id)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          
          <input
            type="number"
            min="0"
            value={product.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="h-7 w-9 text-center text-sm font-medium bg-transparent border-0 focus:outline-none focus:ring-0"
            dir="ltr"
          />
          
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full border-muted-foreground/30 text-muted-foreground hover:bg-muted"
            onClick={() => decrementQuantity(product.id)}
            disabled={product.quantity === 0}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          {isSelected && (
            <span className="text-xs font-medium text-primary mr-1">
              {subtotal.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactProductItem;
