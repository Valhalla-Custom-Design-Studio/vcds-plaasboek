import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, Linking } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { GlassCard } from '../../../src/components/GlassCard';
import { OfflineBanner } from '../../../src/components/OfflineBanner';
import { FloatingSosButton } from '../../../src/components/FloatingSosButton';
import { Colors, Spacing, Radius } from '../../../src/theme';

const CAT_COLORS: Record<string, string> = {
  fuel: Colors.fuel, feed: Colors.feed, vet: Colors.vet, fencing: Colors.fencing,
  labour: Colors.labour, equipment: Colors.equipment, other: Colors.other,
};

export default function ExpensesScreen() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>({ items: [], summary: { monthlyTotal: 0, yearlyTotal: 0, categoryBreakdown: {} } });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const load = async () => {
    try {
      const res = await api.get(`/expenses?year=${year}&month=${month}`);
      setData(res.data);
    } catch (err: any) { Alert.alert(t('common.error'), err.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [year, month]);

  const handleExport = async () => {
    try {
      const res = await api.get(`/expenses/export?year=${year}&month=${month}`, { responseType: 'blob' });
      Alert.alert(t('common.success'), t('expenses.exportCsv'));
    } catch (err: any) { Alert.alert(t('common.error'), err.message); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(t('common.delete'), t('journal.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try { await api.delete(`/expenses/${id}`); load(); }
        catch (err: any) { Alert.alert(t('common.error'), err.message); }
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>{t('expenses.title')}</Text>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>{new Date(year, month - 1).toLocaleString('af-ZA', { month: 'long', year: 'numeric' })}</Text>
          <TouchableOpacity onPress={() => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }}>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
      <GlassCard style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>R{data.summary.monthlyTotal?.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>{t('expenses.monthlyTotal')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>R{data.summary.yearlyTotal?.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>{t('expenses.yearTotal')}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportText}>📊 {t('expenses.exportCsv')}</Text>
        </TouchableOpacity>
      </GlassCard>
      <FlatList
        data={data.items}
        keyExtractor={(i: any) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        renderItem={({ item }: any) => (
          <GlassCard style={styles.expenseCard}>
            <View style={styles.expenseRow}>
              <View style={[styles.catBadge, { backgroundColor: CAT_COLORS[item.category] + '33' }]}>
                <Text style={[styles.catText, { color: CAT_COLORS[item.category] }]}>{t(`expenses.${item.category}`)}</Text>
              </View>
              <Text style={styles.amount}>R{parseFloat(item.amount).toFixed(2)}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.expenseFooter}>
              <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('af-ZA')}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}><Text style={styles.emptyText}>{t('expenses.noExpenses')}</Text></View>
        ) : null}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(tabs)/expenses/create')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <FloatingSosButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, fontFamily: 'Georgia', marginBottom: 12 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  arrow: { color: Colors.primary, fontSize: 28, fontWeight: 'bold' },
  monthText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  summaryCard: { marginHorizontal: Spacing.md, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  summaryItem: { alignItems: 'center' },
  summaryValue: { color: Colors.primary, fontSize: 22, fontWeight: 'bold' },
  summaryLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  exportBtn: { backgroundColor: Colors.surface, borderRadius: Radius.sm, padding: 10, alignItems: 'center' },
  exportText: { color: Colors.primary, fontWeight: '600' },
  list: { padding: Spacing.md, paddingBottom: 120 },
  expenseCard: { marginBottom: 10 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  catText: { fontSize: 12, fontWeight: '700' },
  amount: { color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold' },
  description: { color: Colors.textSecondary, fontSize: 14 },
  expenseFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  dateText: { color: Colors.textMuted, fontSize: 12 },
  deleteText: { fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
  fab: { position: 'absolute', bottom: 90, right: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },
});
