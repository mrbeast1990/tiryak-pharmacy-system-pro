
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
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
}

const permissionsByRole: Record<UserRole, string[]> = {
  admin: ['view_all', 'edit_all', 'delete_all', 'export_pdf', 'manage_users', 'register_revenue_all', 'manage_shortages', 'view_reports'],
  ahmad_rajili: ['view_all', 'edit_all', 'delete_all', 'export_pdf', 'register_revenue_all', 'manage_shortages', 'view_reports'],
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
      
      login: async (email: string, password: string, rememberMe: boolean) => {
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
        
        const userWithPermissions: User = {
          id: authData.user.id,
          email: authData.user.email!,
          name: profile.name || 'مستخدم',
          role: profile.role,
          permissions: permissionsByRole[profile.role] || [],
          lastLogin: new Date().toISOString(),
        };
        
        set({
          user: userWithPermissions,
          isAuthenticated: true,
          rememberMe
        });
        console.log('تم تسجيل الدخول بنجاح:', userWithPermissions.name);
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
      })
    }
  )
);

