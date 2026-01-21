import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';

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
  created_at: string;
}

interface PaymentsFilters {
  company: string | null;
  showUndeductedOnly: boolean;
  dateFilter: 'all' | 'today' | 'week' | 'month';
}

interface PaymentsState {
  payments: Payment[];
  companies: Company[];
  loading: boolean;
  filters: PaymentsFilters;
  
  // Actions
  fetchPayments: () => Promise<void>;
  fetchCompanies: () => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<boolean>;
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<boolean>;
  deletePayment: (id: string) => Promise<boolean>;
  toggleDeducted: (id: string, userId: string, userName: string) => Promise<boolean>;
  addCompany: (name: string) => Promise<boolean>;
  setFilters: (filters: Partial<PaymentsFilters>) => void;
  
  // Computed
  getFilteredPayments: () => Payment[];
  getTotalAmount: () => number;
  getUndeductedTotal: () => number;
  getUndeductedCount: () => number;
}

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  payments: [],
  companies: [],
  loading: false,
  filters: {
    company: null,
    showUndeductedOnly: false,
    dateFilter: 'all',
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
      const { error } = await supabase
        .from('payments')
        .insert([payment]);

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
      const { error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id);

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
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

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

  addCompany: async (name) => {
    try {
      const { error } = await supabase
        .from('companies')
        .insert([{ name }]);

      if (error) throw error;
      
      await get().fetchCompanies();
      return true;
    } catch (error) {
      console.error('Error adding company:', error);
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

    // Filter by company
    if (filters.company) {
      filtered = filtered.filter(p => p.company_name === filters.company);
    }

    // Filter by deduction status
    if (filters.showUndeductedOnly) {
      filtered = filtered.filter(p => !p.is_deducted);
    }

    // Filter by date
    if (filters.dateFilter !== 'all') {
      const today = new Date();
      let startDate: Date;

      switch (filters.dateFilter) {
        case 'today':
          startDate = startOfDay(today);
          break;
        case 'week':
          startDate = startOfWeek(today, { weekStartsOn: 6 }); // Saturday
          break;
        case 'month':
          startDate = startOfMonth(today);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(p => {
        const paymentDate = parseISO(p.payment_date);
        return isAfter(paymentDate, startDate) || paymentDate.getTime() === startDate.getTime();
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
