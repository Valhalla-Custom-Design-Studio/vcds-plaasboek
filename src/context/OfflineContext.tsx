import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { OfflineSyncService } from '../services/OfflineSyncService';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  enqueue: (type: string, data: Record<string, any>) => Promise<void>;
  queueAction: (type: string, data: Record<string, any>) => Promise<void>; // alias for enqueue
  flush: () => Promise<void>;
  flushQueue: () => Promise<void>; // alias for flush
}

const OfflineContext = createContext<OfflineContextType>({} as OfflineContextType);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    const n = await OfflineSyncService.getPendingCount();
    setPendingCount(n);
  }, []);

  useEffect(() => {
    refreshCount();
    const unsub = NetInfo.addEventListener(async (state) => {
      const online = !!(state.isConnected && state.isInternetReachable);
      setIsOnline(online);
      if (online) {
        const count = await OfflineSyncService.getPendingCount();
        if (count > 0) {
          setIsSyncing(true);
          await OfflineSyncService.flush();
          setIsSyncing(false);
          await refreshCount();
        }
      }
    });
    return () => unsub();
  }, []);

  const enqueue = useCallback(async (type: string, data: Record<string, any>) => {
    await OfflineSyncService.enqueue(type, data);
    await refreshCount();
  }, []);

  const flush = useCallback(async () => {
    setIsSyncing(true);
    await OfflineSyncService.flush();
    setIsSyncing(false);
    await refreshCount();
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline, isSyncing, pendingCount, enqueue, queueAction: enqueue, flush, flushQueue: flush }}>
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext);
