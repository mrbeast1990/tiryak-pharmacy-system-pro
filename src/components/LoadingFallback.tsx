
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  showDetails?: boolean;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = 'جاري تحميل النظام...', 
  showDetails = false 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="text-center">
        <div className="w-16 h-16 pharmacy-gradient rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-gray-600 text-lg mb-2">{message}</p>
        {showDetails && (
          <div className="text-sm text-gray-500 space-y-1">
            <p>جاري تهيئة المتاجر...</p>
            <p>جاري فحص حالة المصادقة...</p>
            <p>جاري تحميل البيانات...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingFallback;
