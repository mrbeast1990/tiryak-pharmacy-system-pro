
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Medicine {
  id: string;
  name: string;
  status: 'available' | 'shortage';
  lastUpdated: string;
  updatedBy: string;
  notes?: string;
}

export interface Revenue {
  id: string;
  date: string;
  shift: 'morning' | 'evening' | 'night';
  expense: number;
  income: number;
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
  addRevenue: (revenue: Omit<Revenue, 'id'>) => void;
  updateRevenue: (id: string, updates: Partial<Revenue>) => void;
  deleteRevenue: (id: string) => void;
  getMedicinesByStatus: (status: 'available' | 'shortage') => Medicine[];
  getRevenuesByDateRange: (startDate: string, endDate: string) => Revenue[];
  getRevenuesByShift: (shift: string) => Revenue[];
  getTotalDailyRevenue: (date: string) => number;
}

export const usePharmacyStore = create<PharmacyState>()(
  persist(
    (set, get) => ({
      medicines: [],
      revenues: [],
      
      addMedicine: (medicine) => {
        const newMedicine = {
          ...medicine,
          id: Date.now().toString()
        };
        set((state) => ({
          medicines: [...state.medicines, newMedicine]
        }));
        console.log('تم إضافة دواء:', medicine.name);
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
          id: Date.now().toString()
        };
        set((state) => ({
          revenues: [...state.revenues, newRevenue]
        }));
        console.log('تم إضافة إيراد:', revenue.shift);
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
      
      getRevenuesByShift: (shift) => {
        return get().revenues.filter((revenue) => revenue.shift === shift);
      },
      
      getTotalDailyRevenue: (date) => {
        const dayRevenues = get().revenues.filter((revenue) => revenue.date === date);
        return dayRevenues.reduce((total, revenue) => total + revenue.income - revenue.expense, 0);
      }
    }),
    {
      name: 'pharmacy-storage'
    }
  )
);
