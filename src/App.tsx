import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

// Simple test component first
const TestComponent = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">التطبيق يعمل بنجاح!</h1>
        <p className="text-center mt-4">تم تحميل React بنجاح</p>
      </div>
    </div>
  );
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<TestComponent />} />
      <Route path="*" element={<TestComponent />} />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
