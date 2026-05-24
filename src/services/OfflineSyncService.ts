import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const QUEUE_KEY = 'plaasboek_offline_queue';

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
    if (!map) { console.warn(`[OfflineSync] Unknown type: ${type}`); return; }
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
        else console.warn(`[OfflineSync] Dropped after 5 retries: ${item.type} ${item.id}`);
      }
    }
    await this.saveQueue(remaining);
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },
};
