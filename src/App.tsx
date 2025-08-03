import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";


import ErrorBoundary from "@/components/ErrorBoundary";
import SimpleLogin from "@/components/SimpleLogin";
const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<SimpleLogin />} />
      <Route path="*" element={<SimpleLogin />} />
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
