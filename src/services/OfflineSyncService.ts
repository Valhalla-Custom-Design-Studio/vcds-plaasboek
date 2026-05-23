import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_KEY = 'plaasboek_records';
const CACHE_TS_KEY = 'plaasboek_records_ts';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface FarmRecord {
  id: string;
  type: 'income' | 'expense';
  desc: string;
  desc_en: string;
  amount: number;
  date: string;
  category?: string;
  synced?: boolean;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const OfflineSyncService = {
  /**
   * Returns records: network-first, falls back to cache if offline or fetch fails.
   * Never references localhost — uses EXPO_PUBLIC_API_URL env var.
   */
  async getRecords(token: string): Promise<FarmRecord[]> {
    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected && netState.isInternetReachable;

    if (isOnline) {
      try {
        const res = await fetch(`${API_URL}/records`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data: FarmRecord[] = await res.json();
        // Cache fresh data
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        await AsyncStorage.setItem(CACHE_TS_KEY, Date.now().toString());
        return data;
      } catch (err) {
        console.warn('[OfflineSync] Network fetch failed, using cache:', err);
      }
    }

    // Offline or fetch failed — return cached data
    return this._readCache();
  },

  async _readCache(): Promise<FarmRecord[]> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async isCacheStale(): Promise<boolean> {
    const ts = await AsyncStorage.getItem(CACHE_TS_KEY);
    if (!ts) return true;
    return Date.now() - parseInt(ts, 10) > CACHE_TTL_MS;
  },

  async queueOfflineRecord(record: Omit<FarmRecord, 'id' | 'synced'>): Promise<void> {
    const queue = await this._readQueue();
    queue.push({ ...record, id: `local_${Date.now()}`, synced: false });
    await AsyncStorage.setItem('plaasboek_offline_queue', JSON.stringify(queue));
  },

  async _readQueue(): Promise<FarmRecord[]> {
    const raw = await AsyncStorage.getItem('plaasboek_offline_queue');
    return raw ? JSON.parse(raw) : [];
  },

  async flushQueue(token: string): Promise<void> {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    const queue = await this._readQueue();
    if (queue.length === 0) return;

    const failed: FarmRecord[] = [];
    for (const rec of queue) {
      try {
        const res = await fetch(`${API_URL}/records`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(rec),
        });
        if (!res.ok) failed.push(rec);
      } catch {
        failed.push(rec);
      }
    }
    await AsyncStorage.setItem('plaasboek_offline_queue', JSON.stringify(failed));
  },
};
