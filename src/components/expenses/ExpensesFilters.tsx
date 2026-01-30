import React from 'react';
import { useExpensesStore } from '@/store/expensesStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

const ExpensesFilters: React.FC = () => {
  const { filters, setFilters } = useExpensesStore();

  const dateOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'today', label: 'اليوم' },
    { value: 'week', label: 'الأسبوع' },
    { value: 'month', label: 'الشهر' },
  ];

  const clearFilters = () => {
    setFilters({
      showUndeductedOnly: false,
      dateFilter: 'all',
    });
  };

  const hasActiveFilters = filters.showUndeductedOnly || filters.dateFilter !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>الفلاتر</span>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
            <X className="w-3 h-3 ml-1" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap gap-2">
        {dateOptions.map((option) => (
          <Badge
            key={option.value}
            variant={filters.dateFilter === option.value ? "default" : "outline"}
            className={`cursor-pointer transition-colors ${
              filters.dateFilter === option.value
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'hover:bg-rose-50'
            }`}
            onClick={() => setFilters({ dateFilter: option.value as any })}
          >
            {option.label}
          </Badge>
        ))}
      </div>

      {/* Undeducted Filter */}
      <div className="flex items-center gap-2">
        <Badge
          variant={filters.showUndeductedOnly ? "default" : "outline"}
          className={`cursor-pointer transition-colors ${
            filters.showUndeductedOnly
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'hover:bg-orange-50'
          }`}
          onClick={() => setFilters({ showUndeductedOnly: !filters.showUndeductedOnly })}
        >
          غير مخصومة فقط
        </Badge>
      </div>
    </div>
  );
};

export default ExpensesFilters;
