import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';

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
  dateFilter: 'all' | 'today' | 'week' | 'month';
}

interface ExpensesState {
  expenses: Expense[];
  loading: boolean;
  filters: ExpensesFilters;
  
  // Actions
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<boolean>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  toggleDeducted: (id: string, userId: string, userName: string) => Promise<boolean>;
  setFilters: (filters: Partial<ExpensesFilters>) => void;
  
  // Computed
  getFilteredExpenses: () => Expense[];
  getTotalAmount: () => number;
  getUndeductedTotal: () => number;
  getUndeductedCount: () => number;
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  loading: false,
  filters: {
    showUndeductedOnly: false,
    dateFilter: 'all',
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
      const { error } = await supabase
        .from('expenses')
        .insert([expense]);

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
      const { error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id);

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
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

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

    // Filter by deduction status
    if (filters.showUndeductedOnly) {
      filtered = filtered.filter(e => !e.is_deducted);
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

      filtered = filtered.filter(e => {
        const expenseDate = parseISO(e.expense_date);
        return isAfter(expenseDate, startDate) || expenseDate.getTime() === startDate.getTime();
      });
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
