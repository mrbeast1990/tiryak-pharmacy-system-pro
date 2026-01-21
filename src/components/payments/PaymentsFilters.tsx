import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePaymentsStore } from '@/store/paymentsStore';
import { Filter, X } from 'lucide-react';

const PaymentsFilters: React.FC = () => {
  const { companies, filters, setFilters } = usePaymentsStore();

  const hasActiveFilters = filters.company || filters.showUndeductedOnly || filters.dateFilter !== 'all';

  const clearFilters = () => {
    setFilters({
      company: null,
      showUndeductedOnly: false,
      dateFilter: 'all',
    });
  };

  return (
    <div className="space-y-3 bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>فلترة النتائج</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 ml-1" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* فلتر الشركة */}
        <Select
          value={filters.company || 'all'}
          onValueChange={(value) => setFilters({ company: value === 'all' ? null : value })}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="كل الشركات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الشركات</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.name}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* فلتر الحالة */}
        <Button
          variant={filters.showUndeductedOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilters({ showUndeductedOnly: !filters.showUndeductedOnly })}
          className={`h-8 text-xs ${
            filters.showUndeductedOnly
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : ''
          }`}
        >
          غير المخصومة فقط
        </Button>
      </div>

      {/* فلتر التاريخ */}
      <ToggleGroup
        type="single"
        value={filters.dateFilter}
        onValueChange={(value) => value && setFilters({ dateFilter: value as 'all' | 'today' | 'week' | 'month' })}
        className="justify-start"
      >
        <ToggleGroupItem value="today" size="sm" className="h-7 text-xs px-3">
          اليوم
        </ToggleGroupItem>
        <ToggleGroupItem value="week" size="sm" className="h-7 text-xs px-3">
          الأسبوع
        </ToggleGroupItem>
        <ToggleGroupItem value="month" size="sm" className="h-7 text-xs px-3">
          الشهر
        </ToggleGroupItem>
        <ToggleGroupItem value="all" size="sm" className="h-7 text-xs px-3">
          الكل
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default PaymentsFilters;
