import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { usePaymentsStore, Company } from '@/store/paymentsStore';
import { ArrowRight, Building2, Search, ChevronLeft, Wallet } from 'lucide-react';

interface CompaniesListViewProps {
  onBack: () => void;
  onSelectCompany: (company: Company) => void;
}

const CompaniesListView: React.FC<CompaniesListViewProps> = ({ onBack, onSelectCompany }) => {
  const { companies, payments } = usePaymentsStore();
  const [search, setSearch] = useState('');

  const getCompanyTotal = (companyName: string) =>
    payments.filter(p => p.company_name === companyName).reduce((s, p) => s + Number(p.amount), 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat('ar-LY', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

  const filtered = companies
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.representative_name && c.representative_name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => getCompanyTotal(b.name) - getCompanyTotal(a.name));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100" dir="rtl">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground -mr-2">
              <ArrowRight className="w-5 h-5 ml-1" />
              العودة
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">الشركات</h1>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-20 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن شركة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 h-10 bg-white/90"
          />
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          {filtered.length} شركة
        </p>

        {/* Companies List */}
        <div className="space-y-1.5">
          {filtered.map(company => {
            const total = getCompanyTotal(company.name);
            return (
              <Card
                key={company.id}
                className="p-3 bg-white hover:bg-emerald-50/50 cursor-pointer transition-colors border border-border/50 active:scale-[0.99]"
                onClick={() => onSelectCompany(company)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{company.name}</p>
                      {company.representative_name && (
                        <p className="text-xs text-muted-foreground truncate">{company.representative_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-left">
                      <p className="text-sm font-bold text-emerald-700">{fmt(total)}</p>
                      <p className="text-[10px] text-muted-foreground">د.ل</p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">لا توجد شركات مطابقة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesListView;
