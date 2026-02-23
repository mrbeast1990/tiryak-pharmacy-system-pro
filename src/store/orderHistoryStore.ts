import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrderProduct } from './orderBuilderStore';

export interface SavedOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  supplierPhone: string;
  products: OrderProduct[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderHistoryState {
  orders: SavedOrder[];
  nextOrderNumber: number;
  saveOrder: (order: Omit<SavedOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => { id: string; orderNumber: string };
  updateOrder: (id: string, order: Partial<Omit<SavedOrder, 'id' | 'orderNumber' | 'createdAt'>>) => void;
  deleteOrder: (id: string) => void;
}

export const useOrderHistoryStore = create<OrderHistoryState>()(
  persist(
    (set, get) => ({
      orders: [],
      nextOrderNumber: 101,

      saveOrder: (order) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const num = get().nextOrderNumber;
        const orderNumber = `TS${num}`;
        const saved: SavedOrder = {
          ...order,
          id,
          orderNumber,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ orders: [saved, ...state.orders], nextOrderNumber: num + 1 }));
        return { id, orderNumber };
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
