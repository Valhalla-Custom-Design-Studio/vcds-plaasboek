import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const QUEUE_KEY = 'plaasboek_offline_queue';

export interface FarmRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

const RECORDS_CACHE_KEY = 'plaasboek_records_cache';
const RECORDS_CACHE_TS_KEY = 'plaasboek_records_cache_ts';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes


interface QueueItem {
  id: string;
  type: string;
  data: Record<string, any>;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  createdAt: string;
  retries: number;
}

const ENDPOINT_MAP: Record<string, { endpoint: string; method: QueueItem['method'] }> = {
  journal_create: { endpoint: '/journal', method: 'POST' },
  journal_update: { endpoint: '/journal', method: 'PUT' },
  rainfall_create: { endpoint: '/rainfall', method: 'POST' },
  livestock_change: { endpoint: '/camps', method: 'POST' },
  expense_create: { endpoint: '/expenses', method: 'POST' },
  worker_log: { endpoint: '/workers/logs', method: 'POST' },
  vet_visit: { endpoint: '/vet-visits', method: 'POST' },
};

export const OfflineSyncService = {
  async getQueue(): Promise<QueueItem[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  async saveQueue(queue: QueueItem[]): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async enqueue(type: string, data: Record<string, any>): Promise<void> {
    const map = ENDPOINT_MAP[type];
    if (!map) {
 return; }
    const queue = await this.getQueue();
    const item: QueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type, data,
      endpoint: map.endpoint,
      method: map.method,
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    queue.push(item);
    await this.saveQueue(queue);
  },

  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  },

  async flush(): Promise<void> {
    const queue = await this.getQueue();
    if (!queue.length) return;
    const remaining: QueueItem[] = [];
    for (const item of queue) {
      try {
        const endpoint = item.data.id
          ? `${item.endpoint}/${item.data.id}`
          : item.endpoint;
        await api.request({ method: item.method, url: endpoint, data: item.data });
      } catch (err: any) {
        item.retries++;
        if (item.retries < 5) remaining.push(item);
        else
      }
    }
    await this.saveQueue(remaining);
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  async getRecords(token: string): Promise<FarmRecord[]> {
    try {
      // Use the shared api instance — respects EXPO_PUBLIC_API_URL, never hardcodes a host
      const res = await api.get('/expenses', { headers: { Authorization: `Bearer ${token}` } });
      const items: FarmRecord[] = (res.data?.items || []).map((e: any) => ({
        id: e.id, type: 'expense' as const, amount: parseFloat(e.amount), category: e.category, description: e.description, date: e.date,
      }));
      await AsyncStorage.setItem(RECORDS_CACHE_KEY, JSON.stringify(items));
      await AsyncStorage.setItem(RECORDS_CACHE_TS_KEY, Date.now().toString());
      return items;
    } catch {
      const cached = await AsyncStorage.getItem(RECORDS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async isCacheStale(): Promise<boolean> {
    try {
      const ts = await AsyncStorage.getItem(RECORDS_CACHE_TS_KEY);
      if (!ts) return true;
      return Date.now() - parseInt(ts) > CACHE_TTL_MS;
    } catch { return true; }
  },

};
