import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { t } from '../../src/i18n';
import api from '../../src/services/api';

export default function HomeTab() {
  const { user, lang } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [expRes, rainRes] = await Promise.all([
        api.get('/api/expenses?limit=5'),
        api.get('/api/rainfall?limit=3'),
      ]);
      setSummary({ expenses: expRes.data, rainfall: rainRes.data });
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#2D5016" /></View>;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={s.header}>
        <Text style={s.greeting}>Goeie dag, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={s.farm}>{user?.farmName || 'Plaasboek™'}</Text>
        {user?.tier === 'pro' && <View style={s.proBadge}><Text style={s.proText}>PRO</Text></View>}
      </View>

      <View style={s.grid}>
        {[
          { icon: 'book', label: t(lang,'journal'), route: '/(tabs)/journal', color: '#4CAF50' },
          { icon: 'paw', label: t(lang,'livestock'), route: '/(tabs)/livestock', color: '#FF9800' },
          { icon: 'wallet', label: t(lang,'expenses'), route: '/(tabs)/expenses', color: '#2196F3' },
          { icon: 'people', label: t(lang,'workers'), route: '/workers/index', color: '#9C27B0' },
          { icon: 'water', label: t(lang,'rainfall'), route: '/settings/rainfall', color: '#00BCD4' },
          { icon: 'alert-circle', label: 'SOS', route: '/(tabs)/sos', color: '#F44336' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={s.card} onPress={() => router.push(item.route as any)}>
            <Ionicons name={item.icon as any} size={32} color={item.color} />
            <Text style={s.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.sosButton} onPress={() => router.push('/(tabs)/sos')}>
        <Ionicons name="alert-circle" size={24} color="#fff" />
        <Text style={s.sosText}>🚨 SOS NOODGEVAL</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#2D5016', padding: 24, paddingTop: 48 },
  greeting: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  farm: { color: '#c8e6c9', fontSize: 14, marginTop: 4 },
  proBadge: { backgroundColor: '#FFD700', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 8 },
  proText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  card: { width: '30%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  cardLabel: { marginTop: 8, fontSize: 12, color: '#333', textAlign: 'center', fontWeight: '600' },
  sosButton: { margin: 16, backgroundColor: '#F44336', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sosText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
