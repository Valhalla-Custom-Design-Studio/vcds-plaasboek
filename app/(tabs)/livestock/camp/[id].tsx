import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { GlassCard } from '../../../../src/components/GlassCard';
import { GradientButton } from '../../../../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../../../../src/theme';

const TYPE_COLOR: Record<string, string> = { addition: '#22c55e', removal: '#ef4444' };

export default function CampDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [camp, setCamp] = useState<any>(null);
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [campsRes, changesRes] = await Promise.all([
        api.get('/camps'),
        api.get(`/camps/${id}/changes`),
      ]);
      const found = campsRes.data.find((c: any) => c.id === id);
      setCamp(found);
      setChanges(changesRes.data.items || []);
    } catch { Alert.alert(t('common.error'), t('common.failedToLoad')); }
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }: any) => (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.typeBadge, { backgroundColor: TYPE_COLOR[item.type] + '33' }]}>
          <Text style={[styles.typeText, { color: TYPE_COLOR[item.type] }]}>
            {item.type === 'addition' ? t('livestock.addition') : t('livestock.removal')}
          </Text>
        </View>
        <Text style={styles.quantity}>{item.type === 'addition' ? '+' : '-'}{item.quantity}</Text>
      </View>
      <Text style={styles.reason}>{t(`livestock.${item.reason}`)}</Text>
      <Text style={styles.date}>{new Date(item.date).toLocaleDateString('af-ZA')}</Text>
      {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      {camp && (
        <View style={styles.header}>
          <Text style={styles.campName}>{camp.name}</Text>
          <Text style={styles.headCount}>{camp.current_count} {t('livestock.head')}</Text>
        </View>
      )}
      <FlatList
        data={changes}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Geen veranderinge nie</Text> : null}
      />
      <View style={styles.fab}>
        <GradientButton title="+ Voeg Verandering By" onPress={() => router.push(`/(tabs)/livestock/change-create?campId=${id}`)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  campName: { fontSize: 22, fontWeight: '700', color: Colors.text },
  headCount: { color: Colors.primary, fontSize: 16, marginTop: 4 },
  list: { padding: Spacing.md, paddingBottom: 100 },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  typeText: { fontWeight: '700', fontSize: 12 },
  quantity: { fontSize: 20, fontWeight: '700', color: Colors.text },
  reason: { color: Colors.textSecondary, marginTop: 4 },
  date: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  notes: { color: Colors.text, marginTop: 6, fontStyle: 'italic' },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
});
