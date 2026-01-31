import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import AccountRequests from "./pages/Admin/AccountRequests";
import CreateUser from "./pages/CreateUser";
import AvailableMedicines from "./pages/AvailableMedicines";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/requests" element={<AccountRequests />} />
        <Route path="/create-user" element={<CreateUser />} />
        <Route path="/available-medicines" element={<AvailableMedicines />} />
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Index />} />
      </Routes>
      <Toaster />
    </>
  );
};

const App = () => {
  // مزامنة حالة الجلسة مع authStore
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth Event]', event, !!session);
      
      if (event === 'SIGNED_OUT' || !session) {
        // مسح الحالة المحلية فقط - بدون signOut أو reload
        useAuthStore.getState().clearAuthState();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;