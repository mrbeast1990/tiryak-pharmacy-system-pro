
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type UserRole = Tables<'profiles'>['role'];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearAuthState: () => void;
  setRememberMe: (remember: boolean) => void;
  checkPermission: (permission: string) => boolean;
}

const permissionsByRole: Record<UserRole, string[]> = {
  admin: ['view_all', 'edit_all', 'delete_all', 'export_revenue_pdf', 'export_shortages_pdf', 'manage_users', 'register_revenue_all', 'manage_shortages', 'view_reports'],
  ahmad_rajili: ['view_all', 'edit_all', 'delete_all', 'export_revenue_pdf', 'export_shortages_pdf', 'register_revenue_all', 'manage_shortages', 'view_reports'],
  morning_shift: ['manage_shortages', 'register_revenue_morning', 'view_own'],
  evening_shift: ['manage_shortages', 'register_revenue_evening', 'view_own'],
  night_shift: ['manage_shortages', 'register_revenue_night', 'view_own'],
  member: [],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      rememberMe: false,
      
      setRememberMe: (remember: boolean) => {
        set({ rememberMe: remember });
      },
      
      login: async (email: string, password: string) => {
        console.log('محاولة تسجيل الدخول عبر Supabase:', email);
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError || !authData.user) {
          console.error('فشل في تسجيل الدخول عبر Supabase:', authError?.message);
          return false;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) {
          console.error('فشل في جلب ملف المستخدم:', profileError?.message);
          await supabase.auth.signOut();
          return false;
        }
        
        // تصحيح اسم المدير
        let displayName = profile.name || 'مستخدم';
        if (profile.role === 'admin' && displayName === 'Deltanorthpharm') {
          displayName = 'المدير';
        }
        
        const userWithPermissions: User = {
          id: authData.user.id,
          email: authData.user.email!,
          name: displayName,
          role: profile.role,
          permissions: permissionsByRole[profile.role] || [],
          lastLogin: new Date().toISOString(),
        };
        
        set({
          user: userWithPermissions,
          isAuthenticated: true,
        });
        console.log('تم تسجيل الدخول بنجاح:', userWithPermissions.name);
        return true;
      },
      
      logout: async () => {
        const { isAuthenticated } = get();
        
        // حماية من التكرار
        if (!isAuthenticated) {
          console.log('المستخدم غير مسجل أصلاً');
          return;
        }
        
        await supabase.auth.signOut();
        set({
          user: null,
          isAuthenticated: false,
          rememberMe: false
        });
        console.log('تم تسجيل الخروج');
      },
      
      clearAuthState: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
        console.log('تم مسح حالة المصادقة محلياً');
      },
      
      checkPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        // The admin role defined in the DB now grants all permissions implicitly
        if (user.role === 'admin') return true;
        return user.permissions.includes(permission);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.rememberMe ? state.user : null,
        isAuthenticated: state.rememberMe ? state.isAuthenticated : false,
        rememberMe: state.rememberMe
      }),
      onRehydrateStorage: () => (state) => {
        console.log('Auth store hydration complete:', !!state?.user);
      }
    }
  )
);
