import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'ahmad_rajili' | 'morning_shift' | 'evening_shift' | 'night_shift';
  permissions: string[];
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
}

const predefinedUsers: Record<string, { password: string; user: User }> = {
  'admin@tiryak.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@tiryak.com',
      name: 'المدير',
      role: 'admin',
      permissions: ['view_all', 'edit_all', 'delete_all', 'export_pdf', 'manage_users', 'register_revenue_all'],
      lastLogin: new Date().toISOString()
    }
  },
  'ahmad@tiryak.com': {
    password: 'ahmad123',
    user: {
      id: '2',
      email: 'ahmad@tiryak.com',
      name: 'أحمد الرجيلي',
      role: 'ahmad_rajili',
      permissions: ['view_all', 'edit_all', 'delete_all', 'export_pdf', 'register_revenue_all'],
      lastLogin: new Date().toISOString()
    }
  },
  'morning@tiryak.com': {
    password: 'morning123',
    user: {
      id: '3',
      email: 'morning@tiryak.com',
      name: 'الفترة الصباحية',
      role: 'morning_shift',
      permissions: ['register_shortage', 'register_revenue_morning', 'view_own'],
      lastLogin: new Date().toISOString()
    }
  },
  'evening@tiryak.com': {
    password: 'evening123',
    user: {
      id: '4',
      email: 'evening@tiryak.com',
      name: 'الفترة المسائية',
      role: 'evening_shift',
      permissions: ['register_shortage', 'register_revenue_evening', 'view_own'],
      lastLogin: new Date().toISOString()
    }
  },
  'night@tiryak.com': {
    password: 'night123',
    user: {
      id: '5',
      email: 'night@tiryak.com',
      name: 'الفترة الليلية',
      role: 'night_shift',
      permissions: ['register_shortage', 'register_revenue_night', 'view_own'],
      lastLogin: new Date().toISOString()
    }
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      rememberMe: false,
      
      login: async (email: string, password: string, rememberMe: boolean) => {
        console.log('محاولة تسجيل الدخول:', email);
        
        const userCredentials = predefinedUsers[email];
        if (userCredentials && userCredentials.password === password) {
          const userWithLastLogin = {
            ...userCredentials.user,
            lastLogin: new Date().toISOString()
          };
          set({
            user: userWithLastLogin,
            isAuthenticated: true,
            rememberMe
          });
          console.log('تم تسجيل الدخول بنجاح:', userWithLastLogin.name);
          return true;
        }
        
        console.log('فشل في تسجيل الدخول');
        return false;
      },
      
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          rememberMe: false
        });
        console.log('تم تسجيل الخروج');
      },
      
      checkPermission: (permission: string) => {
        const { user } = get();
        return user?.permissions.includes(permission) || false;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.rememberMe ? state.user : null,
        isAuthenticated: state.rememberMe ? state.isAuthenticated : false,
        rememberMe: state.rememberMe
      })
    }
  )
);
