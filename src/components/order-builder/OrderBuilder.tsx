import React, { useState } from 'react';
import { ArrowRight, ShoppingCart, Trash2, Upload, Search, ChevronDown, ChevronUp, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrderBuilderStore } from '@/store/orderBuilderStore';
import { useOrderHistoryStore } from '@/store/orderHistoryStore';
import { useOrderPDF } from '@/hooks/useOrderPDF';
import FileUploader from './FileUploader';
import DataReviewDialog from './DataReviewDialog';
import CompactProductList from './CompactProductList';
import OrderSummary from './OrderSummary';
import SupplierSelector from './SupplierSelector';
import OrderHistory from './OrderHistory';
import { OrderProduct } from '@/store/orderBuilderStore';

interface OrderBuilderProps {
  onBack: () => void;
}

const OrderBuilder: React.FC<OrderBuilderProps> = ({ onBack }) => {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Omit<OrderProduct, 'quantity'>[]>([]);
  const [showUploadTools, setShowUploadTools] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const { 
    products, 
    supplierName,
    supplierPhone,
    searchQuery,
    setSearchQuery,
    clearOrder,
    addProducts,
    getSelectedProducts,
    getTotalAmount,
    currentOrderId,
  } = useOrderBuilderStore();
  
  const { saveOrder, updateOrder } = useOrderHistoryStore();
  
  const { generatePDF, shareViaWhatsApp } = useOrderPDF();

  const handleFileProcessed = (extractedProducts: Omit<OrderProduct, 'quantity'>[]) => {
    setParsedProducts(extractedProducts);
    setShowReviewDialog(true);
  };

  const handleConfirmProducts = (confirmedProducts: Omit<OrderProduct, 'quantity'>[]) => {
    addProducts(confirmedProducts);
    setShowReviewDialog(false);
    setParsedProducts([]);
    setShowUploadTools(false);
  };

  const handleExportPDF = async () => {
    const selectedProducts = getSelectedProducts();
    let orderNumber: string;
    
    if (currentOrderId) {
      // Existing order - find its number
      const existing = useOrderHistoryStore.getState().orders.find(o => o.id === currentOrderId);
      orderNumber = existing?.orderNumber || 'TS000';
      updateOrder(currentOrderId, { supplierName, supplierPhone, products, totalAmount: getTotalAmount() });
    } else {
      // New order - save and get number
      const result = saveOrder({ supplierName, supplierPhone, products, totalAmount: getTotalAmount() });
      orderNumber = result.orderNumber;
    }
    
    await generatePDF({ supplierName, supplierPhone, products: selectedProducts, orderNumber });
    return orderNumber;
  };

  const handleShareWhatsApp = (orderNumber?: string) => {
    shareViaWhatsApp(supplierName, supplierPhone, orderNumber);
  };

  const selectedCount = getSelectedProducts().length;
  const totalAmount = getTotalAmount();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background" dir="rtl">
      {/* Header - Teal Gradient */}
      <header className="bg-gradient-to-l from-primary to-primary/90 shadow-md sticky top-0 z-20 safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-3">
          {/* Top row - Title and actions */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <h1 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              إنشاء الطلبيات
            </h1>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(!showHistory)}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <History className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearOrder}
                className="text-primary-foreground hover:bg-primary-foreground/10"
                disabled={products.length === 0}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث سريع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 bg-background/95 backdrop-blur border-0 rounded-full text-right shadow-sm"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto pb-28">
        {/* Order History */}
        {showHistory && (
          <OrderHistory onClose={() => setShowHistory(false)} />
        )}

        {/* Upload Tools Toggle */}
        <div className="px-4 py-2">
          <Button
            variant="outline"
            className="w-full flex items-center justify-between rounded-xl border-dashed"
            onClick={() => setShowUploadTools(!showUploadTools)}
          >
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {products.length === 0 ? 'رفع عرض أسعار' : 'إضافة المزيد من الأصناف'}
            </span>
            {showUploadTools ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Collapsible Upload Section */}
        {showUploadTools && (
          <div className="px-4 pb-3 space-y-3">
            <SupplierSelector />
            <FileUploader onFileProcessed={handleFileProcessed} />
          </div>
        )}

        {/* Products List */}
        {products.length > 0 && <CompactProductList />}

        {/* Empty State */}
        {products.length === 0 && !showUploadTools && (
          <div className="px-4 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              لا توجد منتجات
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              ارفع ملف عرض أسعار (PDF أو Excel) لبدء إنشاء الطلبية
            </p>
            <Button 
              onClick={() => setShowUploadTools(true)}
              className="rounded-full"
            >
              <Upload className="h-4 w-4 ml-2" />
              رفع ملف عرض أسعار
            </Button>
          </div>
        )}
      </main>

      {/* Fixed Bottom Summary */}
      {products.length > 0 && (
        <OrderSummary
          selectedCount={selectedCount}
          totalAmount={totalAmount}
          onExportPDF={handleExportPDF}
          onShareWhatsApp={handleShareWhatsApp}
        />
      )}

      {/* Review Dialog */}
      <DataReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        products={parsedProducts}
        onConfirm={handleConfirmProducts}
      />
    </div>
  );
};

export default OrderBuilder;
