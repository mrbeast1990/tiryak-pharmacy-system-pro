import { usePharmacyStore } from '@/store/pharmacyStore';
import { useOfflineSync } from './useOfflineSync';
import { useToast } from './use-toast';

export const useOfflinePharmacyStore = () => {
  const store = usePharmacyStore();
  const { isOnline, saveToOfflineQueue } = useOfflineSync();
  const { toast } = useToast();

  const addMedicineOffline = async (medicine: Parameters<typeof store.addMedicine>[0]) => {
    if (isOnline) {
      return store.addMedicine(medicine);
    }

    // حفظ محلياً عند عدم وجود اتصال
    await saveToOfflineQueue({
      type: 'medicine',
      action: 'add',
      data: medicine
    });

    // إضافة محلية للعرض الفوري
    const localMedicines = JSON.parse(localStorage.getItem('localMedicines') || '[]');
    const newMedicine = {
      id: crypto.randomUUID(),
      name: medicine.name,
      status: medicine.status,
      notes: medicine.notes,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      repeat_count: 1,
      updated_by_name: 'محلي',
      updated_by_id: null
    };
    localMedicines.push(newMedicine);
    localStorage.setItem('localMedicines', JSON.stringify(localMedicines));

    toast({
      title: "تم الحفظ محلياً",
      description: "سيتم رفع البيانات عند عودة الاتصال",
    });
  };

  const updateMedicineOffline = async (id: string, updates: Parameters<typeof store.updateMedicine>[1]) => {
    if (isOnline) {
      return store.updateMedicine(id, updates);
    }

    await saveToOfflineQueue({
      type: 'medicine',
      action: 'update',
      data: { id, updates }
    });

    // تحديث محلي
    const localMedicines = JSON.parse(localStorage.getItem('localMedicines') || '[]');
    const index = localMedicines.findIndex((m: any) => m.id === id);
    if (index !== -1) {
      localMedicines[index] = { ...localMedicines[index], ...updates, last_updated: new Date().toISOString() };
      localStorage.setItem('localMedicines', JSON.stringify(localMedicines));
    }

    toast({
      title: "تم التحديث محلياً",
      description: "سيتم رفع البيانات عند عودة الاتصال",
    });
  };

  const deleteMedicineOffline = async (id: string) => {
    if (isOnline) {
      return store.deleteMedicine(id);
    }

    await saveToOfflineQueue({
      type: 'medicine',
      action: 'delete',
      data: { id }
    });

    // حذف محلي
    const localMedicines = JSON.parse(localStorage.getItem('localMedicines') || '[]');
    const filtered = localMedicines.filter((m: any) => m.id !== id);
    localStorage.setItem('localMedicines', JSON.stringify(filtered));

    toast({
      title: "تم الحذف محلياً",
      description: "سيتم تطبيق التغيير عند عودة الاتصال",
    });
  };

  const addRevenueOffline = async (revenue: Parameters<typeof store.addRevenue>[0]) => {
    if (isOnline) {
      return store.addRevenue(revenue);
    }

    await saveToOfflineQueue({
      type: 'revenue',
      action: 'add',
      data: revenue
    });

    // حفظ محلي
    const localRevenues = JSON.parse(localStorage.getItem('localRevenues') || '[]');
    const newRevenue = {
      id: crypto.randomUUID(),
      ...revenue,
      created_at: new Date().toISOString(),
      createdBy: 'محلي',
      created_by_id: null,
      created_by_name: 'محلي'
    };
    localRevenues.push(newRevenue);
    localStorage.setItem('localRevenues', JSON.stringify(localRevenues));

    toast({
      title: "تم حفظ الإيراد محلياً",
      description: "سيتم رفع البيانات عند عودة الاتصال",
    });
  };

  const updateRevenueOffline = async (id: string, updates: Parameters<typeof store.updateRevenue>[1]) => {
    if (isOnline) {
      return store.updateRevenue(id, updates);
    }

    await saveToOfflineQueue({
      type: 'revenue',
      action: 'update',
      data: { id, updates }
    });

    // تحديث محلي
    const localRevenues = JSON.parse(localStorage.getItem('localRevenues') || '[]');
    const index = localRevenues.findIndex((r: any) => r.id === id);
    if (index !== -1) {
      localRevenues[index] = { ...localRevenues[index], ...updates };
      localStorage.setItem('localRevenues', JSON.stringify(localRevenues));
    }

    toast({
      title: "تم التحديث محلياً",
      description: "سيتم رفع البيانات عند عودة الاتصال",
    });
  };

  const deleteRevenueOffline = async (id: string) => {
    if (isOnline) {
      return store.deleteRevenue(id);
    }

    await saveToOfflineQueue({
      type: 'revenue',
      action: 'delete',
      data: { id }
    });

    // حذف محلي
    const localRevenues = JSON.parse(localStorage.getItem('localRevenues') || '[]');
    const filtered = localRevenues.filter((r: any) => r.id !== id);
    localStorage.setItem('localRevenues', JSON.stringify(filtered));

    toast({
      title: "تم الحذف محلياً",
      description: "سيتم تطبيق التغيير عند عودة الاتصال",
    });
  };

  // دمج البيانات المحلية مع بيانات المتجر
  const getOfflineMedicines = () => {
    const localMedicines = JSON.parse(localStorage.getItem('localMedicines') || '[]');
    return [...store.medicines, ...localMedicines];
  };

  const getOfflineRevenues = () => {
    const localRevenues = JSON.parse(localStorage.getItem('localRevenues') || '[]');
    return [...store.revenues, ...localRevenues];
  };

  return {
    ...store,
    addMedicine: addMedicineOffline,
    updateMedicine: updateMedicineOffline,
    deleteMedicine: deleteMedicineOffline,
    addRevenue: addRevenueOffline,
    updateRevenue: updateRevenueOffline,
    deleteRevenue: deleteRevenueOffline,
    medicines: getOfflineMedicines(),
    revenues: getOfflineRevenues(),
    isOnline
  };
};