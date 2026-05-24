import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from '../services/api';

interface OfflineAction { type: string; data: any; id: string; timestamp: number; }

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  queueAction: (type: string, data: any) => Promise<void>;
  flushQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({} as OfflineContextType);
const QUEUE_KEY = 'offline_queue';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const syncRef = useRef(false);

  useEffect(() => {
    loadQueueCount();
    const unsub = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      if (online && !syncRef.current) flushQueue();
    });
    return () => unsub();
  }, []);

  const loadQueueCount = async () => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: OfflineAction[] = raw ? JSON.parse(raw) : [];
    setPendingCount(queue.length);
  };

  const queueAction = async (type: string, data: any) => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: OfflineAction[] = raw ? JSON.parse(raw) : [];
    queue.push({ type, data, id: Math.random().toString(36), timestamp: Date.now() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setPendingCount(queue.length);
  };

  const flushQueue = async () => {
    if (syncRef.current) return;
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: OfflineAction[] = raw ? JSON.parse(raw) : [];
    if (queue.length === 0) return;
    syncRef.current = true;
    setIsSyncing(true);
    try {
      await api.post('/sync', { actions: queue });
      await AsyncStorage.removeItem(QUEUE_KEY);
      setPendingCount(0);
    } catch (e) { console.warn('[Offline] Sync failed:', e); }
    finally { syncRef.current = false; setIsSyncing(false); }
  };

  return (
    <OfflineContext.Provider value={{ isOnline, isSyncing, pendingCount, queueAction, flushQueue }}>
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext);
