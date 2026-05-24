import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import api from '../../src/services/api';
import { format } from 'date-fns';

const MOODS: Record<string, string> = { great: '😄', good: '🙂', neutral: '😐', bad: '😕', terrible: '😢' };

export default function JournalTab() {
  const { lang } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/journal');
      setEntries(res.data.entries || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteEntry = (id: string) => {
    Alert.alert('Verwyder', 'Wil jy hierdie inskrywing verwyder?', [
      { text: 'Kanselleer', style: 'cancel' },
      { text: 'Verwyder', style: 'destructive', onPress: async () => {
        await api.delete(`/api/journal/${id}`);
        setEntries(e => e.filter(x => x.id !== id));
      }},
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#2D5016" /></View>;

  return (
    <View style={s.container}>
      <FlatList
        data={entries}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={s.empty}>Geen joernaal inskrywings nie</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => router.push(`/journal/${item.id}`)}>
            <View style={s.cardHeader}>
              <Text style={s.mood}>{MOODS[item.mood] || '📝'}</Text>
              <View style={s.cardInfo}>
                <Text style={s.title} numberOfLines={1}>{item.title}</Text>
                <Text style={s.date}>{format(new Date(item.createdAt), 'dd MMM yyyy')}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteEntry(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
            {item.body && <Text style={s.body} numberOfLines={2}>{item.body}</Text>}
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={() => router.push('/journal/add')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#888', marginTop: 48, fontSize: 16 },
  card: { backgroundColor: '#fff', margin: 8, marginHorizontal: 16, borderRadius: 12, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mood: { fontSize: 28 },
  cardInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
  body: { color: '#666', marginTop: 8, fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2D5016', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});
