import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrderBuilderStore } from '@/store/orderBuilderStore';
import ProductRow from './ProductRow';

const ProductsTable: React.FC = () => {
  const { products, searchQuery, setSearchQuery } = useOrderBuilderStore();

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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            قائمة الأصناف ({products.length})
          </CardTitle>
          {selectedCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {selectedCount} محدد
            </span>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="relative mt-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث سريع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 text-right"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Table Container with horizontal scroll */}
        <div className="relative">
          {/* Scrollable Table */}
          <div className="overflow-x-auto" style={{ willChange: 'transform' }}>
            <table className="w-full min-w-[600px]" dir="ltr">
              {/* Table Header */}
              <thead>
                <tr className="bg-muted/50 border-y text-xs font-medium text-muted-foreground">
                  <th className="py-2 px-2 text-center w-10">NO</th>
                  <th className="py-2 px-2 text-center w-16">CODE</th>
                  <th className="py-2 px-3 text-left min-w-[180px]">ITEM DESCRIPTION</th>
                  <th className="py-2 px-2 text-center w-16">EXP</th>
                  <th className="py-2 px-2 text-center w-14">PRICE</th>
                  {/* Sticky columns header */}
                  <th className="py-2 px-2 text-center w-24 sticky right-[70px] z-20 bg-muted/50 shadow-[-2px_0_8px_rgba(0,0,0,0.1)]">
                    الكمية
                  </th>
                  <th className="py-2 px-2 text-center w-[70px] sticky right-0 z-20 bg-muted/50">
                    T.PRICE
                  </th>
                </tr>
              </thead>

              {/* Products List */}
              <tbody className="divide-y">
                {filteredProducts.map((product, index) => (
                  <ProductRow key={product.id} product={product} rowNumber={index + 1} />
                ))}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                لا توجد نتائج للبحث
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsTable;
