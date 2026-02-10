import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Company, Payment, usePaymentsStore } from '@/store/paymentsStore';
import { ArrowRight, Building2, User, Phone, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import PaymentCard from './PaymentCard';

const PAGE_SIZE = 50;

interface CompanyDetailsViewProps {
  company: Company;
  onBack: () => void;
  onViewAttachment?: (url: string) => void;
}

const CompanyDetailsView: React.FC<CompanyDetailsViewProps> = ({ company, onBack, onViewAttachment }) => {
  const { payments } = usePaymentsStore();
  const [currentPage, setCurrentPage] = useState(1);

  const companyPayments = payments
    .filter(p => p.company_name === company.name)
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  const totalAmount = companyPayments.reduce((s, p) => s + Number(p.amount), 0);
  const undeductedAmount = companyPayments.filter(p => !p.is_deducted).reduce((s, p) => s + Number(p.amount), 0);
  const undeductedCount = companyPayments.filter(p => !p.is_deducted).length;

  const totalPages = Math.ceil(companyPayments.length / PAGE_SIZE);
  const paginated = companyPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const fmt = (n: number) => new Intl.NumberFormat('ar-LY', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-mr-2">
          <ArrowRight className="w-5 h-5 ml-1" />
          رجوع
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">{company.name}</h2>
            {company.representative_name && (
              <p className="text-xs text-muted-foreground">{company.representative_name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Company Info */}
      {(company.phone || company.account_number) && (
        <Card className="p-3 space-y-2 bg-muted/30">
          {company.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span dir="ltr">{company.phone}</span>
            </div>
          )}
          {company.account_number && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span dir="ltr">{company.account_number}</span>
            </div>
          )}
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 p-3">
          <Wallet className="w-5 h-5 mb-1" />
          <p className="text-xs opacity-90">إجمالي السدادات</p>
          <p className="text-xl font-bold">{fmt(totalAmount)}</p>
          <p className="text-xs opacity-80">د.ل ({companyPayments.length} سداد)</p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 p-3">
          <AlertCircle className="w-5 h-5 mb-1" />
          <p className="text-xs opacity-90">لم تُخصم</p>
          <p className="text-xl font-bold">{fmt(undeductedAmount)}</p>
          <p className="text-xs opacity-80">د.ل ({undeductedCount} سداد)</p>
        </Card>
      </div>

      {/* Payments List */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">سدادات الشركة ({companyPayments.length})</p>
        {paginated.map(payment => (
          <PaymentCard key={payment.id} payment={payment} onViewAttachment={onViewAttachment} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 text-xs">السابق</Button>
          <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 text-xs">التالي</Button>
        </div>
      )}
    </div>
  );
};

export default CompanyDetailsView;
