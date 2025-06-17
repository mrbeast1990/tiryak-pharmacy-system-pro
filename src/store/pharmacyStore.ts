import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from './authStore';
import { Tables } from '@/integrations/supabase/types';

// Map Supabase types to our app interfaces.
export type Medicine = Omit<Tables<'medicines'>, 'updated_by_id' | 'updated_by_name'> & { updatedBy?: string };
export type Revenue = Omit<Tables<'revenues'>, 'created_by_id' | 'created_by_name' | 'amount'> & { createdBy: string; amount: number };

interface PharmacyState {
  medicines: Medicine[];
  revenues: Revenue[];
  medicinesLoading: boolean;
  revenuesLoading: boolean;
  fetchMedicines: () => Promise<void>;
  loadMedicines: () => Promise<void>; // Added this method
  fetchRevenues: () => Promise<void>;
  addMedicine: (medicine: Pick<Medicine, 'name' | 'status' | 'notes'>) => Promise<void>;
  updateMedicine: (id: string, updates: Partial<Pick<Medicine, 'name' | 'status' | 'notes'>>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  addRevenue: (revenue: Omit<Revenue, 'id' | 'created_at' | 'createdBy'>) => Promise<void>;
  updateRevenue: (id: string, updates: Partial<Revenue>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  getMedicinesByStatus: (status: 'available' | 'shortage') => Medicine[];
  getRevenuesByDateRange: (startDate: string, endDate: string) => Revenue[];
  getRevenuesByPeriod: (period: string) => Revenue[];
  getTotalDailyRevenue: (date: string) => number;
  getTotalRevenue: () => number;
  getTodayRevenue: () => number;
  getMedicineSuggestions: (query: string) => string[];
}

export const usePharmacyStore = create<PharmacyState>()(
  (set, get) => ({
    medicines: [],
    revenues: [],
    medicinesLoading: true,
    revenuesLoading: true,

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

    // Added loadMedicines method that calls fetchMedicines
    loadMedicines: async () => {
      await get().fetchMedicines();
    },

    fetchRevenues: async () => {
      set({ revenuesLoading: true });
      const { data, error } = await supabase.from('revenues').select('*').order('date', { ascending: false });
      if (error) {
        console.error('Error fetching revenues:', error);
        set({ revenues: [], revenuesLoading: false });
        return;
      }
      const revenues: Revenue[] = data.map(r => ({ ...r, createdBy: r.created_by_name, amount: Number(r.amount) }));
      set({ revenues, revenuesLoading: false });
    },
    
    addMedicine: async (medicine) => {
      const user = useAuthStore.getState().user;
      if (!user) return console.error("User not authenticated");

      const { data: existingMedicine } = await supabase.from('medicines').select('id, repeat_count').eq('name', medicine.name).maybeSingle();
      
      if (existingMedicine) {
        const { error } = await supabase.from('medicines').update({ 
          repeat_count: (existingMedicine.repeat_count || 1) + 1,
          status: medicine.status,
          last_updated: new Date().toISOString(),
          updated_by_id: user.id,
          updated_by_name: user.name,
          notes: medicine.notes 
        }).eq('id', existingMedicine.id);
        if (error) console.error("Error updating medicine:", error);
      } else {
        const { error } = await supabase.from('medicines').insert({
          name: medicine.name,
          status: medicine.status,
          notes: medicine.notes,
          updated_by_id: user.id,
          updated_by_name: user.name,
          repeat_count: 1
        });
        if (error) console.error("Error adding medicine:", error);
      }
      await get().fetchMedicines();
    },
    
    updateMedicine: async (id, updates) => {
      const user = useAuthStore.getState().user;
      if (!user) return console.error("User not authenticated");
      
      const { error } = await supabase.from('medicines').update({ ...updates, last_updated: new Date().toISOString(), updated_by_id: user.id, updated_by_name: user.name }).eq('id', id);
      if (error) console.error("Error updating medicine:", error);
      await get().fetchMedicines();
    },
    
    deleteMedicine: async (id) => {
      const { error } = await supabase.from('medicines').delete().eq('id', id);
      if (error) console.error("Error deleting medicine:", error);
      await get().fetchMedicines();
    },
    
    addRevenue: async (revenue) => {
      const user = useAuthStore.getState().user;
      if (!user) return console.error("User not authenticated");

      const { error } = await supabase.from('revenues').insert({
        ...revenue,
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
    }
  })
);
