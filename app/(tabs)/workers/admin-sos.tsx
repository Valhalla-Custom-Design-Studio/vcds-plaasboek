import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { GlassCard } from '../../../src/components/GlassCard';
import { Colors, Spacing, Radius } from '../../../src/theme';

const SOS_COLORS: Record<string, string> = { attack: '#ef4444', medical: '#3b82f6', fire: '#f97316', general: '#eab308' };
const SOS_EMOJI: Record<string, string> = { attack: '🔴', medical: '🔵', fire: '🟠', general: '🟡' };

export default function AdminSOSScreen() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState<'unresolved' | 'all'>('unresolved');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/sos');
      setEvents(res.data || []);
    } catch { Alert.alert(t('common.error'), t('common.failedToLoad')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleResolve = async (eventId: string) => {
    try {
      await api.patch(`/sos/${eventId}/resolve`);
      load();
    } catch { Alert.alert(t('common.error'), t('common.anErrorOccurred')); }
  };

  const filtered = filter === 'unresolved' ? events.filter(e => !e.resolved) : events;

  const renderItem = ({ item }: any) => (
    <GlassCard style={[styles.card, { borderLeftWidth: 4, borderLeftColor: SOS_COLORS[item.sos_type] || Colors.primary }]}>
      <View style={styles.row}>
        <Text style={styles.typeEmoji}>{SOS_EMOJI[item.sos_type] || '🆘'}</Text>
        <View style={styles.info}>
          <Text style={styles.farmName}>{item.farm_name}</Text>
          <Text style={styles.sender}>{item.sender_name}</Text>
          <Text style={styles.time}>{new Date(item.timestamp).toLocaleString('af-ZA')}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.resolved ? '#22c55e22' : '#ef444422' }]}>
          <Text style={[styles.statusText, { color: item.resolved ? '#22c55e' : '#ef4444' }]}>
            {item.resolved ? 'Opgelos' : 'Aktief'}
          </Text>
        </View>
      </View>
      {!item.resolved && (
        <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item.id)}>
          <Text style={styles.resolveBtnText}>✓ Merk as Opgelos</Text>
        </TouchableOpacity>
      )}
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['unresolved', 'all'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'unresolved' ? 'Aktief' : 'Almal'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Geen SOS gebeure nie</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  filterBtn: { flex: 1, padding: Spacing.sm, borderRadius: Radius.sm, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { padding: Spacing.md, paddingBottom: 40 },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  typeEmoji: { fontSize: 28 },
  info: { flex: 1 },
  farmName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sender: { color: Colors.textSecondary, fontSize: 13 },
  time: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  statusText: { fontSize: 11, fontWeight: '700' },
  resolveBtn: { marginTop: Spacing.sm, backgroundColor: '#22c55e22', borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  resolveBtnText: { color: '#22c55e', fontWeight: '700' },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
