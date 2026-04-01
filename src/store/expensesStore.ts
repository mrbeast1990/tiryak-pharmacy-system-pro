import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  expense_date: string;
  is_deducted: boolean;
  deducted_at?: string;
  deducted_by_id?: string;
  deducted_by_name?: string;
  notes?: string;
  created_at: string;
  created_by_id: string;
  created_by_name: string;
}

interface ExpensesFilters {
  showUndeductedOnly: boolean;
  dateFilter: 'all' | 'month' | 'range';
  selectedMonth: number;
  selectedYear: number;
  dateFrom: string | null;
  dateTo: string | null;
}

interface ExpensesState {
  expenses: Expense[];
  loading: boolean;
  filters: ExpensesFilters;
  
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<boolean>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  toggleDeducted: (id: string, userId: string, userName: string) => Promise<boolean>;
  setFilters: (filters: Partial<ExpensesFilters>) => void;
  
  getFilteredExpenses: () => Expense[];
  getTotalAmount: () => number;
  getUndeductedTotal: () => number;
  getUndeductedCount: () => number;
}

const now = new Date();

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  loading: false,
  filters: {
    showUndeductedOnly: false,
    dateFilter: 'month',
    selectedMonth: now.getMonth() + 1,
    selectedYear: now.getFullYear(),
    dateFrom: null,
    dateTo: null,
  },

  fetchExpenses: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ expenses: (data || []) as Expense[] });
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      set({ loading: false });
    }
  },

  addExpense: async (expense) => {
    try {
      const { error } = await supabase.from('expenses').insert([expense]);
      if (error) throw error;
      await get().fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error adding expense:', error);
      return false;
    }
  },

  updateExpense: async (id, updates) => {
    try {
      const { error } = await supabase.from('expenses').update(updates).eq('id', id);
      if (error) throw error;
      await get().fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      return false;
    }
  },

  deleteExpense: async (id) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      await get().fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  },

  toggleDeducted: async (id, userId, userName) => {
    const expense = get().expenses.find(e => e.id === id);
    if (!expense) return false;
    const newDeducted = !expense.is_deducted;
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          is_deducted: newDeducted,
          deducted_at: newDeducted ? new Date().toISOString() : null,
          deducted_by_id: newDeducted ? userId : null,
          deducted_by_name: newDeducted ? userName : null,
        })
        .eq('id', id);
      if (error) throw error;
      await get().fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error toggling deducted:', error);
      return false;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  getFilteredExpenses: () => {
    const { expenses, filters } = get();
    let filtered = [...expenses];

    if (filters.showUndeductedOnly) {
      filtered = filtered.filter(e => !e.is_deducted);
    }

    if (filters.dateFilter === 'month') {
      filtered = filtered.filter(e => {
        const d = new Date(e.expense_date);
        return d.getMonth() + 1 === filters.selectedMonth && d.getFullYear() === filters.selectedYear;
      });
    } else if (filters.dateFilter === 'range') {
      if (filters.dateFrom) {
        filtered = filtered.filter(e => e.expense_date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        filtered = filtered.filter(e => e.expense_date <= filters.dateTo!);
      }
    }

    return filtered;
  },

  getTotalAmount: () => {
    return get().getFilteredExpenses().reduce((sum, e) => sum + Number(e.amount), 0);
  },

  getUndeductedTotal: () => {
    return get().getFilteredExpenses()
      .filter(e => !e.is_deducted)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  },

  getUndeductedCount: () => {
    return get().getFilteredExpenses().filter(e => !e.is_deducted).length;
  },
}));
