import React from 'react';
import { FileDown, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderBuilderStore } from '@/store/orderBuilderStore';

interface OrderSummaryProps {
  selectedCount: number;
  totalAmount: number;
  onExportPDF: () => Promise<void>;
  onShareWhatsApp: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  selectedCount,
  totalAmount,
  onExportPDF,
  onShareWhatsApp,
}) => {
  const { isLoading, supplierName } = useOrderBuilderStore();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportPDF();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAndShare = async () => {
    setIsExporting(true);
    try {
      await onExportPDF();
      onShareWhatsApp();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
      <div className="max-w-3xl mx-auto px-4 py-3">
        {/* Summary Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {selectedCount} صنف محدد
              {supplierName && ` • ${supplierName}`}
            </p>
            <p className="text-lg font-bold text-primary">
              {totalAmount.toFixed(2)} د.ل
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleExport}
            disabled={selectedCount === 0 || isExporting || isLoading}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 ml-2" />
            )}
            تصدير PDF
          </Button>
          
          <Button
            className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white"
            onClick={handleExportAndShare}
            disabled={selectedCount === 0 || isExporting || isLoading}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4 ml-2" />
            )}
            تصدير ومشاركة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
