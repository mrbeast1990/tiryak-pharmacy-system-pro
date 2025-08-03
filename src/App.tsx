import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";


import ErrorBoundary from "@/components/ErrorBoundary";


const queryClient = new QueryClient();

// Minimal test component without hooks
const SimpleTest = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
    <div className="text-center p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">صيدلية الترياق</h1>
      <p className="text-gray-600">React يعمل بدون hooks</p>
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <p className="text-sm text-blue-700">سيتم إضافة تسجيل الدخول تدريجياً</p>
      </div>
    </div>
  </div>
);

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<SimpleTest />} />
      <Route path="*" element={<SimpleTest />} />
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
