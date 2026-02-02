import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrderBuilderStore, OrderProduct } from '@/store/orderBuilderStore';
import { cn } from '@/lib/utils';

interface ProductRowProps {
  product: OrderProduct;
}

const ProductRow: React.FC<ProductRowProps> = ({ product }) => {
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
        'grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors',
        isSelected && 'bg-emerald-50 dark:bg-emerald-950/20'
      )}
    >
      {/* Product Name */}
      <div className="col-span-4">
        <p className="text-sm font-medium text-foreground truncate">
          {product.name}
        </p>
        {product.expiryDate && (
          <p className="text-xs text-muted-foreground">
            {product.expiryDate}
          </p>
        )}
      </div>

      {/* Code */}
      <div className="col-span-2 text-center">
        <span className="text-xs text-muted-foreground">
          {product.code || '-'}
        </span>
      </div>

      {/* Price */}
      <div className="col-span-1 text-center">
        <span className="text-sm text-muted-foreground">
          {product.price.toFixed(2)}
        </span>
      </div>

      {/* Quantity Controls */}
      <div className="col-span-3 flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => decrementQuantity(product.id)}
          disabled={product.quantity === 0}
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <Input
          type="number"
          min="0"
          value={product.quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="h-7 w-12 text-center text-sm px-1"
          dir="ltr"
        />
        
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => incrementQuantity(product.id)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Subtotal */}
      <div className="col-span-2 text-center">
        <span className={cn(
          'text-sm font-medium',
          isSelected ? 'text-primary' : 'text-muted-foreground'
        )}>
          {subtotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ProductRow;
