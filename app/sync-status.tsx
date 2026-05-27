import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '../src/theme';
import { useAuthStore } from '../src/store/auth';

type SyncItem = {
  id: string; table: string; action: 'insert' | 'update' | 'delete';
  status: 'pending' | 'synced' | 'failed'; createdAt: string; syncedAt?: string; error?: string;
};

type SyncStats = { pending: number; synced: number; failed: number; lastSync: string | null };

export default function SyncStatusScreen() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [items, setItems] = useState<SyncItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchSync = async () => {
    try {
      const [statsRes, itemsRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/sync/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/sync/queue`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStats(await statsRes.json());
      const j = await itemsRes.json();
      setItems(j.items || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/sync/trigger`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      await fetchSync();
    } catch {}
    finally { setSyncing(false); }
  };

  const retryFailed = async () => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/sync/retry-failed`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      fetchSync();
    } catch {}
  };

  useEffect(() => { fetchSync(); }, []);

  const statusColor = (s: string) => ({ pending: '#facc15', synced: '#4ade80', failed: '#f87171' }[s] || Colors.muted);
  const actionLabel = (a: string) => ({ insert: 'Geskep', update: 'Gewysig', delete: 'Verwyder' }[a] || a);
  const tableLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ');

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSync(); }} tintColor={Colors.primary} />}>
      <Text style={styles.title}>Sinkronisasie Status</Text>
      <Text style={styles.subtitle}>{stats?.lastSync ? `Laaste sink: ${new Date(stats.lastSync).toLocaleString('af')}` : 'Nog nooit gesink'}</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderColor: '#facc15' }]}>
          <Text style={[styles.statVal, { color: '#facc15' }]}>{stats?.pending ?? 0}</Text>
          <Text style={styles.statLabel}>Hangende</Text>
        </View>
        <View style={[styles.statBox, { borderColor: '#4ade80' }]}>
          <Text style={[styles.statVal, { color: '#4ade80' }]}>{stats?.synced ?? 0}</Text>
          <Text style={styles.statLabel}>Gesink</Text>
        </View>
        <View style={[styles.statBox, { borderColor: '#f87171' }]}>
          <Text style={[styles.statVal, { color: '#f87171' }]}>{stats?.failed ?? 0}</Text>
          <Text style={styles.statLabel}>Mislukt</Text>
        </View>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.syncBtn} onPress={triggerSync} disabled={syncing}>
          {syncing ? <ActivityIndicator color="#000" /> : <Text style={styles.syncBtnText}>🔄 Sink Nou</Text>}
        </TouchableOpacity>
        {(stats?.failed ?? 0) > 0 && (
          <TouchableOpacity style={styles.retryBtn} onPress={retryFailed}>
            <Text style={styles.retryBtnText}>↩ Probeer Weer</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.sectionTitle}>Waglys ({items.length})</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTable}>{tableLabel(item.table)}</Text>
            <Text style={styles.itemAction}>{actionLabel(item.action)}</Text>
            <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleString('af')}</Text>
            {item.error && <Text style={styles.itemError}>{item.error}</Text>}
          </View>
          <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
        </View>
      ))}
      {items.length === 0 && <Text style={styles.emptyText}>Waglys is leeg — alles gesink ✓</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 12, color: Colors.muted, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1 },
  statVal: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, color: Colors.muted, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  syncBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  syncBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  retryBtn: { flex: 1, backgroundColor: '#3a1a1a', borderRadius: 12, padding: 14, alignItems: 'center' },
  retryBtnText: { color: '#f87171', fontWeight: '600', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 8 },
  itemTable: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemAction: { fontSize: 13, color: Colors.muted },
  itemDate: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  itemError: { fontSize: 11, color: '#f87171', marginTop: 4 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  emptyText: { color: '#4ade80', fontSize: 15, textAlign: 'center', marginTop: 40 },
});
