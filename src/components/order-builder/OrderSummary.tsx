import React from 'react';
import { Share2, Loader2 } from 'lucide-react';
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
  const { isLoading } = useOrderBuilderStore();
  const [isExporting, setIsExporting] = React.useState(false);

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
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between" dir="rtl">
        {/* Right side - Summary */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {selectedCount} صنف محدد
          </p>
          <p className="text-lg font-bold text-primary">
            {totalAmount.toFixed(2)} د.ل
          </p>
        </div>

        {/* Left side - Action Button */}
        <Button
          className="rounded-full px-6 bg-primary hover:bg-primary/90"
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
  );
};

export default OrderSummary;
