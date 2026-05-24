import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { GlassCard } from '../../../src/components/GlassCard';
import { OfflineBanner } from '../../../src/components/OfflineBanner';
import { FloatingSosButton } from '../../../src/components/FloatingSosButton';
import { Colors, Spacing, Radius } from '../../../src/theme';

export default function RainfallScreen() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>({ entries: [], summary: { total: 0, average: 0, longestDrySpell: 0 } });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const load = async () => {
    try {
      const res = await api.get(`/rainfall?year=${year}&month=${month}`);
      setData(res.data);
    } catch (err: any) { Alert.alert(t('common.error'), err.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [year, month]);

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>{t('rainfall.title')}</Text>
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
          <View style={styles.summaryItem}><Text style={styles.summaryValue}>{data.summary.total}mm</Text><Text style={styles.summaryLabel}>{t('rainfall.total')}</Text></View>
          <View style={styles.summaryItem}><Text style={styles.summaryValue}>{data.summary.average}mm</Text><Text style={styles.summaryLabel}>{t('rainfall.average')}</Text></View>
          <View style={styles.summaryItem}><Text style={styles.summaryValue}>{data.summary.longestDrySpell}</Text><Text style={styles.summaryLabel}>{t('rainfall.longestDry')} ({t('rainfall.days')})</Text></View>
        </View>
      </GlassCard>
      <FlatList
        data={data.entries}
        keyExtractor={(i: any) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        renderItem={({ item }: any) => (
          <GlassCard style={styles.entryCard}>
            <Text style={styles.entryDate}>{new Date(item.date).toLocaleDateString('af-ZA')}</Text>
            <Text style={styles.entryAmount}>💧 {item.amount_mm}mm</Text>
          </GlassCard>
        )}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}><Text style={styles.emptyText}>{t('rainfall.noData')}</Text></View>
        ) : null}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(tabs)/rainfall/create')}>
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { color: Colors.primary, fontSize: 22, fontWeight: 'bold' },
  summaryLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  list: { padding: Spacing.md, paddingBottom: 120 },
  entryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  entryDate: { color: Colors.textPrimary, fontSize: 15 },
  entryAmount: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
  fab: { position: 'absolute', bottom: 90, right: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },
});
