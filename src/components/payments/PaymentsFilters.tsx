import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePaymentsStore } from '@/store/paymentsStore';
import { Filter, X, CalendarRange } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'يناير' },
  { value: 2, label: 'فبراير' },
  { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' },
  { value: 5, label: 'مايو' },
  { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' },
  { value: 8, label: 'أغسطس' },
  { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' },
  { value: 11, label: 'نوفمبر' },
  { value: 12, label: 'ديسمبر' },
];

const PaymentsFilters: React.FC = () => {
  const { companies, filters, setFilters } = usePaymentsStore();

  const hasActiveFilters = filters.company || filters.showUndeductedOnly || filters.dateFilter !== 'all';

  const clearFilters = () => {
    const now = new Date();
    setFilters({
      company: null,
      showUndeductedOnly: false,
      dateFilter: 'all',
      selectedMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      dateFrom: null,
      dateTo: null,
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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

      {/* فلتر التاريخ - شهر محدد */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filters.dateFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilters({ dateFilter: 'all' })}
          className="h-7 text-xs px-3"
        >
          الكل
        </Button>
        <Button
          variant={filters.dateFilter === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilters({ dateFilter: 'month' })}
          className="h-7 text-xs px-3"
        >
          شهر محدد
        </Button>
        <Button
          variant={filters.dateFilter === 'range' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilters({ dateFilter: 'range' })}
          className="h-7 text-xs px-3"
        >
          <CalendarRange className="w-3 h-3 ml-1" />
          نطاق تاريخ
        </Button>

        {filters.dateFilter === 'month' && (
          <div className="flex gap-1.5">
            <Select
              value={String(filters.selectedMonth)}
              onValueChange={(v) => setFilters({ selectedMonth: Number(v) })}
            >
              <SelectTrigger className="w-[100px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(filters.selectedYear)}
              onValueChange={(v) => setFilters({ selectedYear: Number(v) })}
            >
              <SelectTrigger className="w-[80px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {filters.dateFilter === 'range' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">من:</span>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ dateFrom: e.target.value || null })}
                className="h-7 text-xs w-[130px]"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">إلى:</span>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ dateTo: e.target.value || null })}
                className="h-7 text-xs w-[130px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsFilters;
