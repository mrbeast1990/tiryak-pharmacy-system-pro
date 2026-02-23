import { create } from 'zustand';

export interface OrderProduct {
  id: string;
  name: string;
  code?: string;      // كود الصنف (اختياري)
  price: number;
  expiryDate?: string;
  quantity: number;
}

interface OrderBuilderState {
  products: OrderProduct[];
  supplierName: string;
  supplierPhone: string;
  searchQuery: string;
  isLoading: boolean;
  currentOrderId: string | null;
  
  // Actions
  setProducts: (products: OrderProduct[]) => void;
  addProducts: (products: Omit<OrderProduct, 'quantity'>[]) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  setSupplierName: (name: string) => void;
  setSupplierPhone: (phone: string) => void;
  setSearchQuery: (query: string) => void;
  setIsLoading: (loading: boolean) => void;
  clearOrder: () => void;
  loadOrder: (order: { id: string; supplierName: string; supplierPhone: string; products: OrderProduct[] }) => void;
  getSelectedProducts: () => OrderProduct[];
  getTotalAmount: () => number;
}

export const useOrderBuilderStore = create<OrderBuilderState>((set, get) => ({
  products: [],
  supplierName: '',
  supplierPhone: '',
  searchQuery: '',
  isLoading: false,
  currentOrderId: null,

  setProducts: (products) => set({ products }),
  
  addProducts: (newProducts) => set((state) => ({
    products: [
      ...state.products,
      ...newProducts.map((p, index) => ({
        ...p,
        id: `${Date.now()}-${index}`,
        quantity: 0,
      })),
    ],
  })),

  updateQuantity: (productId, quantity) => set((state) => ({
    products: state.products.map((p) =>
      p.id === productId ? { ...p, quantity: Math.max(0, quantity) } : p
    ),
  })),

  incrementQuantity: (productId) => set((state) => ({
    products: state.products.map((p) =>
      p.id === productId ? { ...p, quantity: p.quantity + 1 } : p
    ),
  })),

  decrementQuantity: (productId) => set((state) => ({
    products: state.products.map((p) =>
      p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p
    ),
  })),

  setSupplierName: (name) => set({ supplierName: name }),
  setSupplierPhone: (phone) => set({ supplierPhone: phone }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  clearOrder: () => set({
    products: [],
    supplierName: '',
    supplierPhone: '',
    searchQuery: '',
    currentOrderId: null,
  }),

  loadOrder: (order) => set({
    products: order.products,
    supplierName: order.supplierName,
    supplierPhone: order.supplierPhone,
    currentOrderId: order.id,
    searchQuery: '',
  }),

  getSelectedProducts: () => {
    const { products } = get();
    return products.filter((p) => p.quantity > 0);
  },

  getTotalAmount: () => {
    const { products } = get();
    return products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  },
}));
