import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

export default function WorkersScreen() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/workers');
      setWorkers(res.data.workers || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#2D5016" /></View>;

  return (
    <View style={s.container}>
      <FlatList
        data={workers}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={s.empty}>Geen werkers nie</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => router.push(`/workers/${item.id}`)}>
            <View style={s.avatar}><Text style={s.avatarText}>{item.name[0]}</Text></View>
            <View style={s.info}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.role}>{item.role || 'Werker'}</Text>
              {item.daily_rate && <Text style={s.rate}>R{item.daily_rate}/dag</Text>}
            </View>
            <View style={[s.statusBadge, { backgroundColor: item.status === 'active' ? '#4CAF50' : '#ccc' }]}>
              <Text style={s.statusText}>{item.status === 'active' ? 'Aktief' : 'Inaktief'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={() => router.push('/workers/add')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#888', marginTop: 48, fontSize: 16 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2D5016', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  role: { fontSize: 13, color: '#666', marginTop: 2 },
  rate: { fontSize: 12, color: '#888', marginTop: 1 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2D5016', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});
