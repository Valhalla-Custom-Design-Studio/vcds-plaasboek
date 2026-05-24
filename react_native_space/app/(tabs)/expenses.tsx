import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { format } from 'date-fns';

const CATEGORY_COLORS: Record<string,string> = { voer:'#FF9800', brandstof:'#F44336', arbeid:'#9C27B0', mediese:'#00BCD4', toerusting:'#2196F3', ander:'#607D8B' };

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/expenses');
      const data = res.data.expenses || [];
      setExpenses(data);
      setTotal(data.reduce((s: number, e: any) => s + parseFloat(e.amount || 0), 0));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCSV = async () => {
    try {
      const res = await api.get('/api/expenses/export/csv');
      Alert.alert('Sukses', 'CSV gestuur na jou e-pos');
    } catch { Alert.alert('Fout', 'Uitvoer misluk'); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#2D5016" /></View>;

  return (
    <View style={s.container}>
      <View style={s.summary}>
        <Text style={s.summaryLabel}>Totale Uitgawes</Text>
        <Text style={s.summaryAmount}>R {total.toFixed(2)}</Text>
        <TouchableOpacity style={s.exportBtn} onPress={exportCSV}>
          <Ionicons name="download-outline" size={16} color="#2D5016" />
          <Text style={s.exportText}>Uitvoer CSV</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={expenses}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={s.empty}>Geen uitgawes nie</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={[s.catDot, { backgroundColor: CATEGORY_COLORS[item.category?.toLowerCase()] || '#607D8B' }]} />
            <View style={s.cardInfo}>
              <Text style={s.cardTitle}>{item.description}</Text>
              <Text style={s.cardCat}>{item.category}</Text>
              <Text style={s.cardDate}>{format(new Date(item.date), 'dd MMM yyyy')}</Text>
            </View>
            <Text style={s.amount}>R {parseFloat(item.amount).toFixed(2)}</Text>
          </View>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={() => router.push('/expenses/add')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { backgroundColor: '#2D5016', padding: 20, alignItems: 'center' },
  summaryLabel: { color: '#c8e6c9', fontSize: 14 },
  summaryAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12 },
  exportText: { color: '#2D5016', fontWeight: '600' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1 },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  cardCat: { fontSize: 12, color: '#888', marginTop: 2 },
  cardDate: { fontSize: 12, color: '#aaa', marginTop: 1 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#F44336' },
  empty: { textAlign: 'center', color: '#888', marginTop: 48, fontSize: 16 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2D5016', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});
