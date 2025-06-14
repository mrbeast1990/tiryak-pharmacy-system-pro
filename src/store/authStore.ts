
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

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

const userRolesAndPermissions: Record<string, Omit<User, 'id' | 'email' | 'lastLogin'>> = {
  'admin@tiryak.com': {
    name: 'المدير',
    role: 'admin',
    permissions: ['view_all', 'edit_all', 'delete_all', 'export_pdf', 'manage_users', 'register_revenue_all', 'manage_shortages', 'view_reports'],
  },
  'ahmad@tiryak.com': {
    name: 'أحمد الرجيلي',
    role: 'ahmad_rajili',
    permissions: ['view_all', 'edit_all', 'delete_all', 'export_pdf', 'register_revenue_all', 'manage_shortages', 'view_reports'],
  },
  'morning@tiryak.com': {
    name: 'الفترة الصباحية',
    role: 'morning_shift',
    permissions: ['manage_shortages', 'register_revenue_morning', 'view_own'],
  },
  'evening@tiryak.com': {
    name: 'الفترة المسائية',
    role: 'evening_shift',
    permissions: ['manage_shortages', 'register_revenue_evening', 'view_own'],
  },
  'night@tiryak.com': {
    name: 'الفترة الليلية',
    role: 'night_shift',
    permissions: ['manage_shortages', 'register_revenue_night', 'view_own'],
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      rememberMe: false,
      
      login: async (email: string, password: string, rememberMe: boolean) => {
        console.log('محاولة تسجيل الدخول عبر Supabase:', email);
        
        const userConfig = userRolesAndPermissions[email];
        if (!userConfig) {
          console.log('فشل في تسجيل الدخول: مستخدم غير معروف');
          return false;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error || !data.user) {
          console.log('فشل في تسجيل الدخول عبر Supabase:', error?.message);
          return false;
        }
        
        const userWithLastLogin: User = {
          id: data.user.id,
          email: data.user.email!,
          lastLogin: new Date().toISOString(),
          ...userConfig
        };
        
        set({
          user: userWithLastLogin,
          isAuthenticated: true,
          rememberMe
        });
        console.log('تم تسجيل الدخول بنجاح:', userWithLastLogin.name);
        return true;
      },
      
      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          isAuthenticated: false,
          rememberMe: false
        });
        console.log('تم تسجيل الخروج');
      },
      
      checkPermission: (permission: string) => {
        const { user } = get();
        if (user?.role === 'admin') return true;
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
