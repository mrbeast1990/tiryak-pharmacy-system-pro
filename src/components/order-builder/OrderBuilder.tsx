import React, { useState } from 'react';
import { ArrowRight, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderBuilderStore } from '@/store/orderBuilderStore';
import { useOrderPDF } from '@/hooks/useOrderPDF';
import FileUploader from './FileUploader';
import DataReviewDialog from './DataReviewDialog';
import ProductsTable from './ProductsTable';
import OrderSummary from './OrderSummary';
import SupplierSelector from './SupplierSelector';
import { OrderProduct } from '@/store/orderBuilderStore';

interface OrderBuilderProps {
  onBack: () => void;
}

const OrderBuilder: React.FC<OrderBuilderProps> = ({ onBack }) => {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Omit<OrderProduct, 'quantity'>[]>([]);
  
  const { 
    products, 
    supplierName, 
    clearOrder,
    addProducts,
    getSelectedProducts,
    getTotalAmount,
  } = useOrderBuilderStore();
  
  const { generatePDF, shareViaWhatsApp } = useOrderPDF();

  const handleFileProcessed = (extractedProducts: Omit<OrderProduct, 'quantity'>[]) => {
    setParsedProducts(extractedProducts);
    setShowReviewDialog(true);
  };

  const handleConfirmProducts = (confirmedProducts: Omit<OrderProduct, 'quantity'>[]) => {
    addProducts(confirmedProducts);
    setShowReviewDialog(false);
    setParsedProducts([]);
  };

  const handleExportPDF = async () => {
    const selectedProducts = getSelectedProducts();
    await generatePDF({ supplierName, products: selectedProducts });
  };

  const handleShareWhatsApp = () => {
    shareViaWhatsApp(supplierName);
  };

  const selectedCount = getSelectedProducts().length;
  const totalAmount = getTotalAmount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100" dir="rtl">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            إنشاء الطلبيات
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={clearOrder}
            className="text-destructive"
            disabled={products.length === 0}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4 pb-32">
        {/* Supplier Selection */}
        <SupplierSelector />

        {/* File Upload */}
        <FileUploader onFileProcessed={handleFileProcessed} />

        {/* Products Table */}
        {products.length > 0 && <ProductsTable />}

        {/* Empty State */}
        {products.length === 0 && (
          <div className="bg-card rounded-xl shadow-sm border border-border/50 p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              لا توجد منتجات
            </h3>
            <p className="text-muted-foreground text-sm">
              ارفع ملف عرض أسعار (PDF أو Excel) لبدء إنشاء الطلبية
            </p>
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
