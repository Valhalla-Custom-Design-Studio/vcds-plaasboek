import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { format } from 'date-fns';

const CHANGE_COLORS: Record<string,string> = { birth:'#4CAF50', death:'#F44336', purchase:'#2196F3', sale:'#FF9800', transfer:'#9C27B0', treatment:'#00BCD4' };
const CHANGE_ICONS: Record<string,string> = { birth:'add-circle', death:'remove-circle', purchase:'cart', sale:'cash', transfer:'swap-horizontal', treatment:'medical' };

export default function LivestockTab() {
  const [changes, setChanges] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cRes, lRes] = await Promise.all([api.get('/api/livestock/camps'), api.get('/api/livestock/changes')]);
      setCamps(cRes.data.camps || []);
      setChanges(lRes.data.changes || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#2D5016" /></View>;

  return (
    <View style={s.container}>
      <View style={s.campRow}>
        <Text style={s.sectionTitle}>Kampe ({camps.length})</Text>
        <TouchableOpacity onPress={() => router.push('/livestock/add-camp')}>
          <Ionicons name="add-circle" size={28} color="#2D5016" />
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={camps}
        keyExtractor={i => i.id}
        style={s.campList}
        renderItem={({ item }) => (
          <View style={s.campCard}>
            <Text style={s.campName}>{item.name}</Text>
            <Text style={s.campSize}>{item.size_ha ? `${item.size_ha} ha` : ''}</Text>
          </View>
        )}
      />
      <View style={s.changeHeader}>
        <Text style={s.sectionTitle}>Veranderinge</Text>
        <TouchableOpacity onPress={() => router.push('/livestock/add')}>
          <Ionicons name="add-circle" size={28} color="#2D5016" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={changes}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={s.empty}>Geen veranderinge nie</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Ionicons name={CHANGE_ICONS[item.change_type] as any || 'paw'} size={24} color={CHANGE_COLORS[item.change_type] || '#888'} />
            <View style={s.cardInfo}>
              <Text style={s.cardTitle}>{item.animal_type} — {item.change_type}</Text>
              <Text style={s.cardSub}>Aantal: {item.quantity} {item.unit_price ? `| R${item.unit_price}` : ''}</Text>
              <Text style={s.cardDate}>{format(new Date(item.date), 'dd MMM yyyy')}</Text>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={() => router.push('/livestock/add')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  campRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  campList: { paddingHorizontal: 16, marginBottom: 8 },
  campCard: { backgroundColor: '#2D5016', borderRadius: 10, padding: 12, marginRight: 8, minWidth: 80, alignItems: 'center' },
  campName: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  campSize: { color: '#c8e6c9', fontSize: 11, marginTop: 2 },
  changeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  cardSub: { fontSize: 13, color: '#666', marginTop: 2 },
  cardDate: { fontSize: 12, color: '#888', marginTop: 2 },
  empty: { textAlign: 'center', color: '#888', marginTop: 48, fontSize: 16 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2D5016', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});
