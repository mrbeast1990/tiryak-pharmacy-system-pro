import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrderBuilderStore, OrderProduct } from '@/store/orderBuilderStore';
import { cn } from '@/lib/utils';

interface ProductRowProps {
  product: OrderProduct;
  rowNumber: number;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, rowNumber }) => {
  const { updateQuantity, incrementQuantity, decrementQuantity } = useOrderBuilderStore();

  const isSelected = product.quantity > 0;
  const subtotal = product.price * product.quantity;

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value) || 0;
    updateQuantity(product.id, num);
  };

  return (
    <tr
      className={cn(
        'transition-colors',
        isSelected && 'bg-emerald-50 dark:bg-emerald-950/20'
      )}
    >
      {/* NO */}
      <td className="py-3 px-2 text-center text-sm text-muted-foreground">
        {rowNumber}
      </td>

      {/* CODE */}
      <td className="py-3 px-2 text-center">
        <span className="text-xs text-muted-foreground font-mono">
          {product.code || '-'}
        </span>
      </td>

      {/* ITEM DESCRIPTION - Scrollable with line-clamp-2 */}
      <td className="py-3 px-3 min-w-[180px]">
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {product.name}
        </p>
      </td>

      {/* EXP */}
      <td className="py-3 px-2 text-center">
        <span className="text-xs text-muted-foreground">
          {product.expiryDate || '-'}
        </span>
      </td>

      {/* PRICE */}
      <td className="py-3 px-2 text-center">
        <span className="text-sm text-muted-foreground">
          {product.price.toFixed(2)}
        </span>
      </td>

      {/* Quantity Controls - Sticky */}
      <td className={cn(
        "py-3 px-2 sticky right-[70px] z-10 shadow-[-2px_0_8px_rgba(0,0,0,0.1)]",
        isSelected ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-card"
      )}>
        <div className="flex items-center justify-center gap-1">
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
      </td>

      {/* T.PRICE - Sticky */}
      <td className={cn(
        "py-3 px-2 text-center sticky right-0 z-10",
        isSelected ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-card"
      )}>
        <span className={cn(
          'text-sm font-medium',
          isSelected ? 'text-primary' : 'text-muted-foreground'
        )}>
          {subtotal.toFixed(2)}
        </span>
      </td>
    </tr>
  );
};

export default ProductRow;
