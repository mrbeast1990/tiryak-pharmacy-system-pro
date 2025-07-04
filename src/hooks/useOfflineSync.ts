import { useEffect, useState } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { useToast } from '@/hooks/use-toast';

interface OfflineQueue {
  id: string;
  type: 'medicine' | 'revenue';
  action: 'add' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const { fetchMedicines, fetchRevenues } = usePharmacyStore();
  const { toast } = useToast();

  // مراقبة حالة الاتصال
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "وضع عدم الاتصال",
        description: "سيتم حفظ التغييرات ومزامنتها عند عودة الاتصال",
        variant: "default",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // حفظ البيانات في IndexedDB عند عدم وجود اتصال
  const saveToOfflineQueue = async (item: Omit<OfflineQueue, 'id' | 'timestamp'>) => {
    const queue = getOfflineQueue();
    const newItem: OfflineQueue = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    queue.push(newItem);
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
  };

  const getOfflineQueue = (): OfflineQueue[] => {
    const stored = localStorage.getItem('offlineQueue');
    return stored ? JSON.parse(stored) : [];
  };

  const clearOfflineQueue = () => {
    localStorage.removeItem('offlineQueue');
  };

  // مزامنة البيانات المحفوظة محلياً
  const syncOfflineData = async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);
    const queue = getOfflineQueue();
    
    if (queue.length === 0) {
      setSyncing(false);
      return;
    }

    try {
      // تنفيذ العمليات المحفوظة بالترتيب الزمني
      const sortedQueue = queue.sort((a, b) => a.timestamp - b.timestamp);
      
      for (const item of sortedQueue) {
        try {
          await executeQueueItem(item);
        } catch (error) {
          console.error('خطأ في مزامنة العنصر:', item, error);
        }
      }

      clearOfflineQueue();
      
      // إعادة تحميل البيانات من الخادم
      await Promise.all([fetchMedicines(), fetchRevenues()]);
      
      toast({
        title: "تمت المزامنة",
        description: `تم مزامنة ${queue.length} عنصر بنجاح`,
        variant: "default",
      });
    } catch (error) {
      console.error('خطأ في المزامنة:', error);
      toast({
        title: "خطأ في المزامنة",
        description: "حدث خطأ أثناء مزامنة البيانات",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const executeQueueItem = async (item: OfflineQueue) => {
    const store = usePharmacyStore.getState();
    
    switch (item.type) {
      case 'medicine':
        switch (item.action) {
          case 'add':
            await store.addMedicine(item.data);
            break;
          case 'update':
            await store.updateMedicine(item.data.id, item.data.updates);
            break;
          case 'delete':
            await store.deleteMedicine(item.data.id);
            break;
        }
        break;
      case 'revenue':
        switch (item.action) {
          case 'add':
            await store.addRevenue(item.data);
            break;
          case 'update':
            await store.updateRevenue(item.data.id, item.data.updates);
            break;
          case 'delete':
            await store.deleteRevenue(item.data.id);
            break;
        }
        break;
    }
  };

  return {
    isOnline,
    syncing,
    saveToOfflineQueue,
    syncOfflineData,
    queueLength: getOfflineQueue().length
  };
};