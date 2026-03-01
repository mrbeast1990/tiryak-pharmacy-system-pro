
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from './authStore';
import { Tables } from '@/integrations/supabase/types';

// Map Supabase types to our app interfaces.
export type Medicine = Omit<Tables<'medicines'>, 'updated_by_id' | 'updated_by_name'> & { updatedBy?: string };
export type Supply = Omit<Tables<'supplies'>, 'updated_by_id' | 'updated_by_name'> & { updatedBy?: string };
export type Revenue = Omit<Tables<'revenues'>, 'created_by_id' | 'created_by_name' | 'amount'> & { createdBy: string; amount: number; service_name?: string | null };

interface PharmacyState {
  medicines: Medicine[];
  supplies: Supply[];
  revenues: Revenue[];
  medicinesLoading: boolean;
  suppliesLoading: boolean;
  revenuesLoading: boolean;
  fetchMedicines: () => Promise<void>;
  fetchSupplies: () => Promise<void>;
  fetchRevenues: () => Promise<void>;
  addMedicine: (medicine: Pick<Medicine, 'name' | 'status' | 'notes'> & { repeat_count?: number; scientific_name?: string | null }) => Promise<void>;
  addSupply: (supply: Pick<Supply, 'name' | 'status' | 'notes'>) => Promise<void>;
  updateMedicine: (id: string, updates: Partial<Pick<Medicine, 'name' | 'status' | 'notes' | 'repeat_count' | 'scientific_name'>> & { is_ordered?: boolean }) => Promise<void>;
  updateSupply: (id: string, updates: Partial<Pick<Supply, 'name' | 'status' | 'notes' | 'repeat_count'>>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  deleteSupply: (id: string) => Promise<void>;
  addRevenue: (revenue: Omit<Revenue, 'id' | 'created_at' | 'createdBy'>) => Promise<void>;
  updateRevenue: (id: string, updates: Partial<Revenue>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  getMedicinesByStatus: (status: 'available' | 'shortage') => Medicine[];
  getSuppliesByStatus: (status: 'available' | 'shortage') => Supply[];
  getRevenuesByDateRange: (startDate: string, endDate: string) => Revenue[];
  getRevenuesByPeriod: (period: string) => Revenue[];
  getTotalDailyRevenue: (date: string) => number;
  getTotalRevenue: () => number;
  getTodayRevenue: () => number;
  getMedicineSuggestions: (query: string) => string[];
  getSupplySuggestions: (query: string) => string[];
  loadMedicines: () => Promise<void>;
  loadSupplies: () => Promise<void>;
  loadRevenues: () => Promise<void>;
}

export const usePharmacyStore = create<PharmacyState>()(
  (set, get) => ({
    medicines: [],
    supplies: [],
    revenues: [],
    medicinesLoading: false,
    suppliesLoading: false,
    revenuesLoading: false,

    fetchMedicines: async () => {
      set({ medicinesLoading: true });
      const { data, error } = await supabase.from('medicines').select('*').order('last_updated', { ascending: false });
      if (error) {
        console.error('Error fetching medicines:', error);
        set({ medicines: [], medicinesLoading: false });
        return;
      }
      const medicines: Medicine[] = data.map(m => ({ ...m, updatedBy: m.updated_by_name || undefined }));
      set({ medicines, medicinesLoading: false });
    },

    fetchSupplies: async () => {
      set({ suppliesLoading: true });
      const { data, error } = await supabase.from('supplies').select('*').order('last_updated', { ascending: false });
      if (error) {
        console.error('Error fetching supplies:', error);
        set({ supplies: [], suppliesLoading: false });
        return;
      }
      const supplies: Supply[] = data.map(s => ({ ...s, updatedBy: s.updated_by_name || undefined }));
      set({ supplies, suppliesLoading: false });
    },

    fetchRevenues: async () => {
      set({ revenuesLoading: true });
      const { data, error } = await supabase.from('revenues').select('*').order('date', { ascending: false });
      if (error) {
        console.error('Error fetching revenues:', error);
        set({ revenues: [], revenuesLoading: false });
        return;
      }
      const revenues: Revenue[] = data.map(r => ({ ...r, createdBy: r.created_by_name, amount: Number(r.amount), service_name: r.service_name }));
      set({ revenues, revenuesLoading: false });
    },
    
addMedicine: async (medicine) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        console.error("❌ User not authenticated");
        return;
      }
      
      // استخراج الاسم العلمي إذا تم تمريره
      const scientificName = medicine.scientific_name || null;
      const selectedPriority = medicine.repeat_count || 1;
      console.log('🔵 إضافة دواء:', medicine.name, 'بحالة:', medicine.status, 'الاسم العلمي:', scientificName, 'الأولوية:', selectedPriority);

      // التحقق من وجود الدواء بأي حالة
      const { data: existingMedicine } = await supabase
        .from('medicines')
        .select('id, status, repeat_count')
        .eq('name', medicine.name)
        .maybeSingle();
      
      if (existingMedicine) {
        if (existingMedicine.status === 'shortage' && medicine.status === 'shortage') {
          console.log('⚠️ دواء موجود مسبقاً بحالة نقص، تحديث العدد');
          // زيادة عداد التكرار للدواء الموجود
          const newRepeatCount = Math.max(selectedPriority, (existingMedicine.repeat_count || 1));
          const { error } = await supabase
            .from('medicines')
            .update({ 
              repeat_count: newRepeatCount,
              last_updated: new Date().toISOString(),
              updated_by_id: user.id,
              updated_by_name: user.name,
              notes: medicine.notes,
              scientific_name: scientificName
            })
            .eq('id', existingMedicine.id);
          
          if (error) {
            console.error("❌ خطأ في تحديث الدواء:", error);
          } else {
            console.log('✅ تم تحديث الدواء بنجاح، العدد الجديد:', newRepeatCount);
          }
        } else if (existingMedicine.status === 'available' && medicine.status === 'shortage') {
          console.log('🔄 تحويل دواء من متوفر إلى نقص');
          // تحويل الدواء من متوفر إلى نقص
          const { error } = await supabase
            .from('medicines')
            .update({ 
              status: 'shortage',
              repeat_count: selectedPriority,
              last_updated: new Date().toISOString(),
              updated_by_id: user.id,
              updated_by_name: user.name,
              notes: medicine.notes,
              scientific_name: scientificName
            })
            .eq('id', existingMedicine.id);
          
          if (error) {
            console.error("❌ خطأ في تحويل الدواء:", error);
          } else {
            console.log('✅ تم تحويل الدواء من متوفر إلى نقص بنجاح');
          }
        } else {
          console.log('📝 تحديث حالة الدواء الموجود');
          // تحديث الحالة فقط
          const { error } = await supabase
            .from('medicines')
            .update({ 
              status: medicine.status,
              last_updated: new Date().toISOString(),
              updated_by_id: user.id,
              updated_by_name: user.name,
              notes: medicine.notes,
              scientific_name: scientificName
            })
            .eq('id', existingMedicine.id);
          
          if (error) {
            console.error("❌ خطأ في تحديث الدواء:", error);
          } else {
            console.log('✅ تم تحديث حالة الدواء بنجاح');
          }
        }
      } else {
        console.log('🆕 إضافة سجل جديد');
        // إضافة سجل جديد مع الاسم العلمي
        const { error } = await supabase.from('medicines').insert({
          name: medicine.name,
          status: medicine.status,
          notes: medicine.notes,
          scientific_name: scientificName,
          updated_by_id: user.id,
          updated_by_name: user.name,
          repeat_count: selectedPriority
        });
        
        if (error) {
          console.error("❌ خطأ في إضافة الدواء:", error);
        } else {
          console.log('✅ تم إضافة الدواء بنجاح');
        }
      }
      await get().fetchMedicines();
    },
    
    updateMedicine: async (id, updates) => {
      // لا نغير التاريخ إذا كان التحديث فقط لـ is_ordered
      const updateKeys = Object.keys(updates);
      const isOnlyOrderedToggle = updateKeys.length === 1 && updateKeys[0] === 'is_ordered';
      
      const dbUpdates: any = { ...updates };
      if (!isOnlyOrderedToggle) {
        dbUpdates.last_updated = new Date().toISOString();
      }
      
      const { error } = await supabase.from('medicines').update(dbUpdates).eq('id', id);
      if (error) console.error("Error updating medicine:", error);
      await get().fetchMedicines();
    },
    
    deleteMedicine: async (id) => {
      const { error } = await supabase.from('medicines').delete().eq('id', id);
      if (error) console.error("Error deleting medicine:", error);
      await get().fetchMedicines();
    },

    addSupply: async (supply) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        console.error("❌ User not authenticated");
        return;
      }
      
      console.log('🔵 إضافة مستلزم:', supply.name, 'بحالة:', supply.status);

      const { data: existingSupply } = await supabase
        .from('supplies')
        .select('id, status, repeat_count')
        .eq('name', supply.name)
        .maybeSingle();
      
      if (existingSupply) {
        if (existingSupply.status === 'shortage' && supply.status === 'shortage') {
          const newRepeatCount = (existingSupply.repeat_count || 1) + 1;
          const { error } = await supabase
            .from('supplies')
            .update({ 
              repeat_count: newRepeatCount,
              last_updated: new Date().toISOString(),
              updated_by_id: user.id,
              updated_by_name: user.name,
              notes: supply.notes 
            })
            .eq('id', existingSupply.id);
          
          if (error) console.error("❌ خطأ في تحديث المستلزم:", error);
        } else if (existingSupply.status === 'available' && supply.status === 'shortage') {
          const { error } = await supabase
            .from('supplies')
            .update({ 
              status: 'shortage',
              repeat_count: 1,
              last_updated: new Date().toISOString(),
              updated_by_id: user.id,
              updated_by_name: user.name,
              notes: supply.notes 
            })
            .eq('id', existingSupply.id);
          
          if (error) console.error("❌ خطأ في تحويل المستلزم:", error);
        } else {
          const { error } = await supabase
            .from('supplies')
            .update({ 
              status: supply.status,
              last_updated: new Date().toISOString(),
              updated_by_id: user.id,
              updated_by_name: user.name,
              notes: supply.notes 
            })
            .eq('id', existingSupply.id);
          
          if (error) console.error("❌ خطأ في تحديث المستلزم:", error);
        }
      } else {
        const { error } = await supabase.from('supplies').insert({
          name: supply.name,
          status: supply.status,
          notes: supply.notes,
          updated_by_id: user.id,
          updated_by_name: user.name,
          repeat_count: 1
        });
        
        if (error) console.error("❌ خطأ في إضافة المستلزم:", error);
      }
      await get().fetchSupplies();
    },
    
    updateSupply: async (id, updates) => {
      const { error } = await supabase.from('supplies').update({ 
        ...updates, 
        last_updated: new Date().toISOString() 
      }).eq('id', id);
      if (error) console.error("Error updating supply:", error);
      await get().fetchSupplies();
    },
    
    deleteSupply: async (id) => {
      const { error } = await supabase.from('supplies').delete().eq('id', id);
      if (error) console.error("Error deleting supply:", error);
      await get().fetchSupplies();
    },
    
    addRevenue: async (revenue) => {
      const user = useAuthStore.getState().user;
      if (!user) return console.error("User not authenticated");

      const { error } = await supabase.from('revenues').insert({
        amount: revenue.amount,
        type: revenue.type,
        period: revenue.period,
        notes: revenue.notes,
        date: revenue.date,
        service_name: revenue.service_name || null,
        created_by_id: user.id,
        created_by_name: user.name,
      });
      if (error) console.error("Error adding revenue:", error);
      await get().fetchRevenues();
    },
    
    updateRevenue: async (id, updates) => {
      const { error } = await supabase.from('revenues').update(updates).eq('id', id);
      if (error) console.error("Error updating revenue:", error);
      await get().fetchRevenues();
    },
    
    deleteRevenue: async (id) => {
      const { error } = await supabase.from('revenues').delete().eq('id', id);
      if (error) console.error("Error deleting revenue:", error);
      await get().fetchRevenues();
    },
    
    getMedicinesByStatus: (status) => {
      return get().medicines.filter((medicine) => medicine.status === status);
    },
    
    getRevenuesByDateRange: (startDate, endDate) => {
      return get().revenues.filter((revenue) => 
        revenue.date >= startDate && revenue.date <= endDate
      );
    },
    
    getRevenuesByPeriod: (period) => {
      return get().revenues.filter((revenue) => revenue.period === period);
    },
    
    getTotalDailyRevenue: (date) => {
      const dayRevenues = get().revenues.filter((revenue) => revenue.date === date);
      // Only sum income, don't subtract expenses (cash disbursement doesn't reduce revenue)
      return dayRevenues.reduce((total, revenue) => {
        return revenue.type === 'income' ? total + revenue.amount : total;
      }, 0);
    },

    getTotalRevenue: () => {
      const revenues = get().revenues;
      // Only sum income, don't subtract expenses (cash disbursement doesn't reduce revenue)
      return revenues.reduce((total, revenue) => {
        return revenue.type === 'income' ? total + revenue.amount : total;
      }, 0);
    },

    getTodayRevenue: () => {
      const today = new Date().toISOString().split('T')[0];
      return get().getTotalDailyRevenue(today);
    },
    
    getMedicineSuggestions: (query) => {
      if (query.length < 2) return [];
      const medicines = get().medicines;
      return medicines
        .filter(medicine => 
          medicine.name.toLowerCase().includes(query.toLowerCase())
        )
        .map(medicine => medicine.name)
        .slice(0, 5);
    },

    getSuppliesByStatus: (status) => {
      return get().supplies.filter((supply) => supply.status === status);
    },

    getSupplySuggestions: (query) => {
      if (query.length < 2) return [];
      const supplies = get().supplies;
      return supplies
        .filter(supply => 
          supply.name.toLowerCase().includes(query.toLowerCase())
        )
        .map(supply => supply.name)
        .slice(0, 5);
    },

    loadMedicines: async () => {
      await get().fetchMedicines();
    },

    loadSupplies: async () => {
      await get().fetchSupplies();
    },

    loadRevenues: async () => {
      await get().fetchRevenues();
    },
  })
);
