import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { GlassCard } from '../../../src/components/GlassCard';
import { Colors, Spacing, Radius } from '../../../src/theme';

const STATUS_COLOR: Record<string, string> = { pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444' };

export default function AdminUsersScreen() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch { Alert.alert(t('common.error'), t('common.failedToLoad')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/admin/users/${userId}`, { status: action === 'approve' ? 'approved' : 'rejected' });
      load();
    } catch { Alert.alert(t('common.error'), t('common.anErrorOccurred')); }
  };

  const filtered = filter === 'pending' ? users.filter(u => u.status === 'pending') : users;

  const renderItem = ({ item }: any) => (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.farm_name && <Text style={styles.farm}>🌾 {item.farm_name}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(item.id, 'approve')}>
            <Text style={styles.approveBtnText}>✓ Keur Goed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(item.id, 'reject')}>
            <Text style={styles.rejectBtnText}>✗ Verwerp</Text>
          </TouchableOpacity>
        </View>
      )}
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['pending', 'all'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'pending' ? 'Wagend' : 'Almal'}
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
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Geen gebruikers nie</Text> : null}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text },
  email: { color: Colors.textSecondary, fontSize: 13 },
  farm: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  approveBtn: { flex: 1, backgroundColor: '#22c55e22', borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  approveBtnText: { color: '#22c55e', fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: '#ef444422', borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  rejectBtnText: { color: '#ef4444', fontWeight: '700' },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
