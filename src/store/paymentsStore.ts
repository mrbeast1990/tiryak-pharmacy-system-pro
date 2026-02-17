import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Payment {
  id: string;
  company_name: string;
  amount: number;
  payment_date: string;
  payment_type: 'cash' | 'bank';
  notes?: string;
  attachment_url?: string;
  is_deducted: boolean;
  deducted_at?: string;
  deducted_by_id?: string;
  deducted_by_name?: string;
  created_at: string;
  created_by_id: string;
  created_by_name: string;
}

export interface Company {
  id: string;
  name: string;
  representative_name?: string;
  phone?: string;
  account_number?: string;
  created_at: string;
}

interface PaymentsFilters {
  company: string | null;
  showUndeductedOnly: boolean;
  dateFilter: 'all' | 'month' | 'range';
  selectedMonth: number; // 1-12
  selectedYear: number;
  dateFrom: string | null;
  dateTo: string | null;
}

interface PaymentsState {
  payments: Payment[];
  companies: Company[];
  loading: boolean;
  filters: PaymentsFilters;
  
  fetchPayments: () => Promise<void>;
  fetchCompanies: () => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<boolean>;
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<boolean>;
  deletePayment: (id: string) => Promise<boolean>;
  toggleDeducted: (id: string, userId: string, userName: string) => Promise<boolean>;
  addCompany: (company: { name: string; representative_name?: string; phone?: string; account_number?: string }) => Promise<boolean>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<boolean>;
  deleteCompany: (id: string) => Promise<boolean>;
  setFilters: (filters: Partial<PaymentsFilters>) => void;
  
  getFilteredPayments: () => Payment[];
  getTotalAmount: () => number;
  getUndeductedTotal: () => number;
  getUndeductedCount: () => number;
}

const now = new Date();

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  payments: [],
  companies: [],
  loading: false,
  filters: {
    company: null,
    showUndeductedOnly: false,
    dateFilter: 'month',
    selectedMonth: now.getMonth() + 1,
    selectedYear: now.getFullYear(),
    dateFrom: null,
    dateTo: null,
  },

  fetchPayments: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ payments: (data || []) as Payment[] });
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchCompanies: async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      if (error) throw error;
      set({ companies: (data || []) as Company[] });
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  },

  addPayment: async (payment) => {
    try {
      const { error } = await supabase.from('payments').insert([payment]);
      if (error) throw error;
      await get().fetchPayments();
      return true;
    } catch (error) {
      console.error('Error adding payment:', error);
      return false;
    }
  },

  updatePayment: async (id, updates) => {
    try {
      const { error } = await supabase.from('payments').update(updates).eq('id', id);
      if (error) throw error;
      await get().fetchPayments();
      return true;
    } catch (error) {
      console.error('Error updating payment:', error);
      return false;
    }
  },

  deletePayment: async (id) => {
    try {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
      await get().fetchPayments();
      return true;
    } catch (error) {
      console.error('Error deleting payment:', error);
      return false;
    }
  },

  toggleDeducted: async (id, userId, userName) => {
    const payment = get().payments.find(p => p.id === id);
    if (!payment) return false;
    const newDeducted = !payment.is_deducted;
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          is_deducted: newDeducted,
          deducted_at: newDeducted ? new Date().toISOString() : null,
          deducted_by_id: newDeducted ? userId : null,
          deducted_by_name: newDeducted ? userName : null,
        })
        .eq('id', id);
      if (error) throw error;
      await get().fetchPayments();
      return true;
    } catch (error) {
      console.error('Error toggling deducted:', error);
      return false;
    }
  },

  addCompany: async (company) => {
    try {
      const { error } = await supabase.from('companies').insert([company]);
      if (error) throw error;
      await get().fetchCompanies();
      return true;
    } catch (error) {
      console.error('Error adding company:', error);
      return false;
    }
  },

  updateCompany: async (id, updates) => {
    try {
      const { error } = await supabase.from('companies').update(updates).eq('id', id);
      if (error) throw error;
      await get().fetchCompanies();
      return true;
    } catch (error) {
      console.error('Error updating company:', error);
      return false;
    }
  },

  deleteCompany: async (id) => {
    try {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
      await get().fetchCompanies();
      return true;
    } catch (error) {
      console.error('Error deleting company:', error);
      return false;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  getFilteredPayments: () => {
    const { payments, filters } = get();
    let filtered = [...payments];

    if (filters.company) {
      filtered = filtered.filter(p => p.company_name === filters.company);
    }

    if (filters.showUndeductedOnly) {
      filtered = filtered.filter(p => !p.is_deducted);
    }

    if (filters.dateFilter === 'month') {
      filtered = filtered.filter(p => {
        const d = new Date(p.payment_date);
        return (d.getMonth() + 1) === filters.selectedMonth && d.getFullYear() === filters.selectedYear;
      });
    }

    if (filters.dateFilter === 'range' && (filters.dateFrom || filters.dateTo)) {
      filtered = filtered.filter(p => {
        const d = p.payment_date;
        if (filters.dateFrom && d < filters.dateFrom) return false;
        if (filters.dateTo && d > filters.dateTo) return false;
        return true;
      });
    }

    return filtered;
  },

  getTotalAmount: () => {
    return get().getFilteredPayments().reduce((sum, p) => sum + Number(p.amount), 0);
  },

  getUndeductedTotal: () => {
    return get().getFilteredPayments()
      .filter(p => !p.is_deducted)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  },

  getUndeductedCount: () => {
    return get().getFilteredPayments().filter(p => !p.is_deducted).length;
  },
}));
