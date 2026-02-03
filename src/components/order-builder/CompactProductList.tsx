import React, { useMemo } from 'react';
import { useOrderBuilderStore } from '@/store/orderBuilderStore';
import CompactProductItem from './CompactProductItem';

const CompactProductList: React.FC = () => {
  const { products, searchQuery } = useOrderBuilderStore();

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.code && p.code.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  const selectedCount = products.filter(p => p.quantity > 0).length;

  return (
    <div className="bg-card mx-4 rounded-xl shadow-sm overflow-hidden">
      {/* List Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border/50">
        <span className="text-sm font-medium text-foreground">
          الأصناف ({products.length})
        </span>
        {selectedCount > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {selectedCount} محدد
          </span>
        )}
      </div>
      
      {/* Products List */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
        {filteredProducts.map((product) => (
          <CompactProductItem key={product.id} product={product} />
        ))}
        
        {filteredProducts.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            لا توجد نتائج للبحث
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactProductList;
