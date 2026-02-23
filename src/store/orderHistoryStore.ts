import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrderProduct } from './orderBuilderStore';

export interface SavedOrder {
  id: string;
  supplierName: string;
  supplierPhone: string;
  products: OrderProduct[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderHistoryState {
  orders: SavedOrder[];
  saveOrder: (order: Omit<SavedOrder, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateOrder: (id: string, order: Partial<Omit<SavedOrder, 'id' | 'createdAt'>>) => void;
  deleteOrder: (id: string) => void;
}

export const useOrderHistoryStore = create<OrderHistoryState>()(
  persist(
    (set, get) => ({
      orders: [],

      saveOrder: (order) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const saved: SavedOrder = {
          ...order,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ orders: [saved, ...state.orders] }));
        return id;
      },

      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
          ),
        }));
      },

      deleteOrder: (id) => {
        set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
      },
    }),
    { name: 'order-history' }
  )
);
