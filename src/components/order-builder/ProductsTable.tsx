import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrderBuilderStore } from '@/store/orderBuilderStore';
import ProductRow from './ProductRow';

const ProductsTable: React.FC = () => {
  const { products, searchQuery, setSearchQuery } = useOrderBuilderStore();

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query)
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
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-y">
          <div className="col-span-4 text-right">الصنف</div>
          <div className="col-span-2 text-center">الكود</div>
          <div className="col-span-1 text-center">السعر</div>
          <div className="col-span-3 text-center">الكمية</div>
          <div className="col-span-2 text-center">الإجمالي</div>
        </div>

        {/* Products List */}
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {filteredProducts.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              لا توجد نتائج للبحث
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ProductsTable;
