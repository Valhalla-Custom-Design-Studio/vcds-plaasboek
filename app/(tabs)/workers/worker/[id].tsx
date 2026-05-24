import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { GlassCard } from '../../../../src/components/GlassCard';
import { GradientButton } from '../../../../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../../../../src/theme';

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [worker, setWorker] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState({ daysPresent: 0, totalHours: 0, taskCount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const [workersRes, logsRes] = await Promise.all([
        api.get('/workers'),
        api.get(`/workers/${id}/logs?year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
      ]);
      const found = workersRes.data.find((w: any) => w.id === id);
      setWorker(found);
      const items = logsRes.data.items || [];
      setLogs(items);
      setSummary({
        daysPresent: items.filter((l: any) => l.present).length,
        totalHours: items.reduce((s: number, l: any) => s + (l.hours_worked || 0), 0),
        taskCount: items.filter((l: any) => l.tasks).length,
      });
    } catch { Alert.alert(t('common.error'), t('common.failedToLoad')); }
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }: any) => (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString('af-ZA')}</Text>
        <View style={[styles.badge, { backgroundColor: item.present ? '#22c55e22' : '#ef444422' }]}>
          <Text style={[styles.badgeText, { color: item.present ? '#22c55e' : '#ef4444' }]}>
            {item.present ? 'Teenwoordig' : 'Afwesig'}
          </Text>
        </View>
      </View>
      {item.hours_worked && <Text style={styles.hours}>{item.hours_worked}h gewerk</Text>}
      {item.tasks && <Text style={styles.tasks}>{item.tasks}</Text>}
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      {worker && (
        <View style={styles.header}>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.position}>{worker.position}</Text>
          <Text style={styles.idNumber}>ID: {worker.id_number}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{summary.daysPresent}</Text><Text style={styles.summaryLabel}>Dae</Text></View>
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{summary.totalHours.toFixed(1)}</Text><Text style={styles.summaryLabel}>Ure</Text></View>
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{summary.taskCount}</Text><Text style={styles.summaryLabel}>Take</Text></View>
          </View>
        </View>
      )}
      <FlatList
        data={logs}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Geen logs vir hierdie maand nie</Text> : null}
      />
      <View style={styles.fab}>
        <GradientButton title="+ Voeg Log By" onPress={() => router.push(`/(tabs)/workers/log-create?workerId=${id}`)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  name: { fontSize: 22, fontWeight: '700', color: Colors.text },
  position: { color: Colors.primary, marginTop: 2 },
  idNumber: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  summaryRow: { flexDirection: 'row', marginTop: Spacing.sm, gap: Spacing.md },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: Colors.text },
  summaryLabel: { color: Colors.textSecondary, fontSize: 11 },
  list: { padding: Spacing.md, paddingBottom: 100 },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: Colors.text, fontWeight: '600' },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  badgeText: { fontSize: 12, fontWeight: '700' },
  hours: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  tasks: { color: Colors.text, marginTop: 4, fontStyle: 'italic' },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
});
