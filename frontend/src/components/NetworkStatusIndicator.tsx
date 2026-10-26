import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';

export const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      // Fast ping to verify actual internet connectivity
      const response = await fetch('/api/settings', { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        setIsOnline(true);
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 animate-fade-in-up">
      {!isOnline ? (
        <div className="bg-amber-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between space-x-3 text-xs sm:text-sm font-semibold max-w-md border border-amber-500">
          <div className="flex items-center space-x-2.5">
            <WifiOff className="w-5 h-5 flex-shrink-0 animate-pulse text-amber-200" />
            <div>
              <span className="font-extrabold block">No Internet Connection</span>
              <span className="text-[11px] text-amber-100 font-normal">
                Using cached data. Financial actions require connection.
              </span>
            </div>
          </div>
          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition flex items-center space-x-1 flex-shrink-0 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs sm:text-sm font-bold border border-emerald-500">
          <Wifi className="w-4 h-4 text-emerald-200" />
          <span>Connection Restored — Back Online</span>
        </div>
      )}
    </div>
  );
};
