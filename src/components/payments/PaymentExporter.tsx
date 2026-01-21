import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePaymentsStore } from '@/store/paymentsStore';
import { usePaymentsPDF } from '@/hooks/usePaymentsPDF';
import { usePaymentsExcel } from '@/hooks/usePaymentsExcel';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';

const PaymentExporter: React.FC = () => {
  const { getFilteredPayments, filters } = usePaymentsStore();
  const { generatePaymentsReport } = usePaymentsPDF();
  const { generatePaymentsExcel } = usePaymentsExcel();

  const payments = getFilteredPayments();

  const handleExportPDF = () => {
    generatePaymentsReport(payments, filters);
  };

  const handleExportExcel = () => {
    generatePaymentsExcel(payments);
  };

  if (payments.length === 0) {
    return null;
  }

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2 text-primary">
          <Download className="w-4 h-4" />
          تصدير التقارير
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 px-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="h-10 text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <FileText className="w-4 h-4 ml-2 text-red-500" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="h-10 text-sm hover:bg-green-50 hover:text-green-600 hover:border-green-200"
          >
            <FileSpreadsheet className="w-4 h-4 ml-2 text-green-500" />
            Excel
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          سيتم تصدير {payments.length} سداد حسب الفلاتر الحالية
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentExporter;
