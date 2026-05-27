import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/auth';

type Alert = {
  id: string; type: 'aanval' | 'verdagte' | 'brand' | 'vloed' | 'diefstal' | 'ander';
  title: string; body: string; farm: string; district: string;
  createdAt: string; upvotes: number;
};

export default function CommunityScreen() {
  const { token } = useAuthStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch_ = async () => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/records?type=community_alert&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setAlerts(json.records || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const upvote = async (id: string) => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/records/${id}/upvote`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, upvotes: a.upvotes + 1 } : a));
    } catch {}
  };

  const typeEmoji = (t: string) => ({ aanval: '🚨', verdagte: '👁️', brand: '🔥', vloed: '🌊', diefstal: '🔓', ander: '⚠️' }[t] || '⚠️');
  const typeColor = (t: string) => ({ aanval: '#f87171', verdagte: '#fb923c', brand: '#fbbf24', vloed: '#60a5fa', diefstal: '#a78bfa', ander: Colors.muted }[t] || Colors.muted);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gemeenskap</Text>
      <Text style={styles.subtitle}>Boeresameroeping · Distrik waaksaamheid</Text>
      {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch_(); }} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.typeEmoji}>{typeEmoji(item.type)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>{item.farm} · {item.district}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: typeColor(item.type) + '22', borderColor: typeColor(item.type) }]}>
                  <Text style={[styles.typeBadgeText, { color: typeColor(item.type) }]}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.cardBody}>{item.body}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString('af')}</Text>
                <TouchableOpacity style={styles.upvoteBtn} onPress={() => upvote(item.id)}>
                  <Text style={styles.upvoteText}>👍 {item.upvotes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Geen gemeenskap alerts nie</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, padding: 16, paddingBottom: 4 },
  subtitle: { fontSize: 12, color: Colors.muted, paddingHorizontal: 16, marginBottom: 12 },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  typeEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardMeta: { fontSize: 12, color: Colors.muted },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  cardBody: { fontSize: 14, color: Colors.text, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 11, color: Colors.muted },
  upvoteBtn: { backgroundColor: Colors.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  upvoteText: { color: Colors.text, fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.muted, fontSize: 15 },
});
