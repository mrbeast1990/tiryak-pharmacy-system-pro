import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import AccountRequests from "./pages/Admin/AccountRequests";
import CreateUser from "./pages/CreateUser";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin/requests" element={<AccountRequests />} />
        <Route path="/create-user" element={<CreateUser />} />
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Index />} />
      </Routes>
      <Toaster />
      <Sonner />
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;