
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Medicine {
  id: string;
  name: string;
  status: 'available' | 'shortage';
  lastUpdated: string;
  updatedBy: string;
  notes?: string;
  repeatCount?: number;
}

export interface Revenue {
  id: string;
  date: string;
  period: 'morning' | 'evening' | 'night';
  type: 'income' | 'expense';
  amount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

interface PharmacyState {
  medicines: Medicine[];
  revenues: Revenue[];
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  addRevenue: (revenue: Omit<Revenue, 'id' | 'createdAt'>) => void;
  updateRevenue: (id: string, updates: Partial<Revenue>) => void;
  deleteRevenue: (id: string) => void;
  getMedicinesByStatus: (status: 'available' | 'shortage') => Medicine[];
  getRevenuesByDateRange: (startDate: string, endDate: string) => Revenue[];
  getRevenuesByPeriod: (period: string) => Revenue[];
  getTotalDailyRevenue: (date: string) => number;
  getMedicineSuggestions: (query: string) => string[];
}

export const usePharmacyStore = create<PharmacyState>()(
  persist(
    (set, get) => ({
      medicines: [],
      revenues: [],
      
      addMedicine: (medicine) => {
        const existingMedicine = get().medicines.find(m => 
          m.name.toLowerCase() === medicine.name.toLowerCase()
        );
        
        if (existingMedicine) {
          set((state) => ({
            medicines: state.medicines.map((m) =>
              m.id === existingMedicine.id 
                ? { 
                    ...m, 
                    repeatCount: (m.repeatCount || 1) + 1,
                    status: medicine.status,
                    lastUpdated: medicine.lastUpdated,
                    updatedBy: medicine.updatedBy,
                    notes: medicine.notes
                  }
                : m
            )
          }));
        } else {
          const newMedicine = {
            ...medicine,
            id: Date.now().toString(),
            repeatCount: 1
          };
          set((state) => ({
            medicines: [...state.medicines, newMedicine]
          }));
        }
        console.log('تم إضافة/تحديث دواء:', medicine.name);
      },
      
      updateMedicine: (id, updates) => {
        set((state) => ({
          medicines: state.medicines.map((medicine) =>
            medicine.id === id ? { ...medicine, ...updates } : medicine
          )
        }));
        console.log('تم تحديث الدواء:', id);
      },
      
      deleteMedicine: (id) => {
        set((state) => ({
          medicines: state.medicines.filter((medicine) => medicine.id !== id)
        }));
        console.log('تم حذف الدواء:', id);
      },
      
      addRevenue: (revenue) => {
        const newRevenue = {
          ...revenue,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          revenues: [...state.revenues, newRevenue]
        }));
        console.log('تم إضافة إيراد:', revenue.period);
      },
      
      updateRevenue: (id, updates) => {
        set((state) => ({
          revenues: state.revenues.map((revenue) =>
            revenue.id === id ? { ...revenue, ...updates } : revenue
          )
        }));
        console.log('تم تحديث الإيراد:', id);
      },
      
      deleteRevenue: (id) => {
        set((state) => ({
          revenues: state.revenues.filter((revenue) => revenue.id !== id)
        }));
        console.log('تم حذف الإيراد:', id);
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
        return dayRevenues.reduce((total, revenue) => {
          return revenue.type === 'income' 
            ? total + revenue.amount 
            : total - revenue.amount;
        }, 0);
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
    }),
    {
      name: 'pharmacy-storage'
    }
  )
);
