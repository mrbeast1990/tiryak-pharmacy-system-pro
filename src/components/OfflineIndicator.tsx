import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const OfflineIndicator: React.FC = () => {
  const { isOnline, syncing, syncOfflineData, queueLength } = useOfflineSync();

  if (isOnline && queueLength === 0 && !syncing) {
    return null; // لا نعرض شيئاً عندما يكون كل شيء طبيعياً
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white shadow-lg rounded-lg p-3 border flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">غير متصل</span>
            {queueLength > 0 && (
              <Badge variant="secondary" className="text-xs">
                {queueLength} في الانتظار
              </Badge>
            )}
          </>
        ) : syncing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-blue-600">جاري المزامنة...</span>
          </>
        ) : queueLength > 0 ? (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <Button
              onClick={syncOfflineData}
              size="sm"
              variant="outline"
              className="text-xs h-6"
            >
              مزامنة {queueLength} عنصر
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default OfflineIndicator;