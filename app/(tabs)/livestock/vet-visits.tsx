import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { GlassCard } from '../../../../src/components/GlassCard';
import { GradientButton } from '../../../../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../../../../src/theme';

export default function VetVisitsScreen() {
  const { t } = useLanguage();
  const [visits, setVisits] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [visitsRes, expiringRes] = await Promise.all([
        api.get('/vet-visits'),
        api.get('/vet-visits/expiring'),
      ]);
      setVisits(visitsRes.data.items || []);
      setExpiring(expiringRes.data || []);
    } catch { Alert.alert(t('common.error'), t('common.failedToLoad')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const expiringIds = new Set(expiring.map((e: any) => e.id));

  const renderItem = ({ item }: any) => (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.animalId}>🐄 {item.animal_id}</Text>
        {expiringIds.has(item.id) && <View style={styles.warningBadge}><Text style={styles.warningText}>⚠️ Verstryk binnekort</Text></View>}
      </View>
      <Text style={styles.treatment}>{item.treatment}</Text>
      <Text style={styles.medication}>{item.medication} — {item.dosage}</Text>
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Besoek: {new Date(item.visit_date).toLocaleDateString('af-ZA')}</Text>
        <Text style={[styles.dateLabel, { color: expiringIds.has(item.id) ? Colors.warning : Colors.success }]}>
          Veilig: {new Date(item.safe_date).toLocaleDateString('af-ZA')}
        </Text>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={visits}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Geen veearts besoeke nie</Text> : null}
      />
      <View style={styles.fab}>
        <GradientButton title="+ Voeg Besoek By" onPress={() => router.push('/(tabs)/livestock/vet-create')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, paddingBottom: 100 },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  animalId: { fontSize: 16, fontWeight: '700', color: Colors.text },
  warningBadge: { backgroundColor: '#f59e0b22', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  warningText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
  treatment: { color: Colors.text, marginTop: 4 },
  medication: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  dateLabel: { fontSize: 12, color: Colors.textSecondary },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
});
