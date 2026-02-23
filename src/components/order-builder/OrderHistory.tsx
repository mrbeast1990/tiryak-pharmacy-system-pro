import React from 'react';
import { History, Trash2, Edit3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderHistoryStore, SavedOrder } from '@/store/orderHistoryStore';
import { useOrderBuilderStore } from '@/store/orderBuilderStore';
import { useOrderPDF } from '@/hooks/useOrderPDF';
import { toast } from 'sonner';

interface OrderHistoryProps {
  onClose: () => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ onClose }) => {
  const { orders, deleteOrder } = useOrderHistoryStore();
  const { loadOrder } = useOrderBuilderStore();
  const { generatePDF } = useOrderPDF();

  const handleLoad = (order: SavedOrder) => {
    loadOrder({
      id: order.id,
      supplierName: order.supplierName,
      supplierPhone: order.supplierPhone,
      products: order.products,
    });
    toast.success('تم تحميل الطلبية للتعديل');
    onClose();
  };

  const handleReExport = async (order: SavedOrder) => {
    const selected = order.products.filter(p => p.quantity > 0);
    await generatePDF({
      supplierName: order.supplierName,
      supplierPhone: order.supplierPhone,
      products: selected,
      orderNumber: order.orderNumber || 'TS000',
    });
  };

  const handleDelete = (id: string) => {
    deleteOrder(id);
    toast.success('تم حذف الطلبية');
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ar-LY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          سجل الطلبيات
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          إغلاق
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          لا توجد طلبيات محفوظة
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const selectedCount = order.products.filter(p => p.quantity > 0).length;
            return (
              <div
                key={order.id}
                className="bg-card border border-border rounded-xl p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {order.orderNumber && <span className="text-primary ml-1">{order.orderNumber}</span>}
                      {order.supplierName || 'بدون مورد'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCount} صنف • {order.totalAmount.toFixed(2)} د.ل
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleLoad(order)}
                  >
                    <Edit3 className="h-3.5 w-3.5 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleReExport(order)}
                  >
                    <FileText className="h-3.5 w-3.5 ml-1" />
                    تصدير
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(order.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
