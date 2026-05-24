import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../src/services/api';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import { GlassCard } from '../../src/components/GlassCard';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { FloatingSosButton } from '../../src/components/FloatingSosButton';
import { Colors, Spacing, Radius } from '../../src/theme';

const WEATHER_EMOJI: Record<string, string> = {
  sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', windy: '💨', cold: '❄️',
};

export default function JournalScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/journal');
      setEntries(res.data.items || []);
    } catch (err: any) {
      if (!refreshing) Alert.alert(t('common.error'), err.message);
    } finally { setLoading(false); setRefreshing(false); }
  }, [refreshing]);

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity onPress={() => router.push(`/(tabs)/journal/${item.id}`)}>
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{new Date(item.entry_date).toLocaleDateString('af-ZA')}</Text>
          <Text style={styles.weatherEmoji}>{WEATHER_EMOJI[item.weather] || '🌤️'}</Text>
          {item.rainfall_mm > 0 && <Text style={styles.rainfallBadge}>💧 {item.rainfall_mm}mm</Text>}
        </View>
        {item.activities && <Text style={styles.preview} numberOfLines={2}>{item.activities}</Text>}
        {item.photo_count > 0 && <Text style={styles.photoBadge}>📷 {item.photo_count}</Text>}
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>{t('journal.title')}</Text>
        {user?.status === 'pending' && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingText}>{t('auth.pendingBanner')}</Text>
          </View>
        )}
      </View>
      <FlatList
        data={entries}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyText}>{t('journal.noEntries')}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/journal/create')}>
              <Text style={styles.emptyBtnText}>{t('journal.addEntry')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      />
      {user?.status === 'approved' && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/(tabs)/journal/create')}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
      <FloatingSosButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, fontFamily: 'Georgia' },
  pendingBanner: { backgroundColor: Colors.warning + '33', borderRadius: Radius.sm, padding: 8, marginTop: 8 },
  pendingText: { color: Colors.warning, fontSize: 13 },
  list: { padding: Spacing.md, paddingBottom: 120 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dateText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 15, flex: 1 },
  weatherEmoji: { fontSize: 18 },
  rainfallBadge: { color: Colors.textSecondary, fontSize: 13 },
  preview: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  photoBadge: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, marginBottom: 24 },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  fab: { position: 'absolute', bottom: 90, right: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },
});
