import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useAuth } from '../../../src/context/AuthContext';
import { GlassCard } from '../../../src/components/GlassCard';
import { GradientButton } from '../../../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../../../src/theme';

const WEATHER_EMOJI: Record<string, string> = {
  sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', windy: '💨', cold: '❄️',
};

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/journal/${id}`).then(r => setEntry(r.data)).catch(() => Alert.alert(t('common.error'), t('common.failedToLoad'))).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    Alert.alert(t('common.delete'), t('journal.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        await api.delete(`/journal/${id}`);
        router.back();
      }},
    ]);
  };

  if (loading || !entry) return <View style={styles.container}><Text style={styles.loading}>{t('common.loading')}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GlassCard style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.dateText}>{new Date(entry.entry_date).toLocaleDateString('af-ZA')}</Text>
          <Text style={styles.weatherEmoji}>{WEATHER_EMOJI[entry.weather] || '🌤️'}</Text>
        </View>
        <Text style={styles.timeText}>{entry.entry_time}</Text>
        {entry.rainfall_mm > 0 && <Text style={styles.rainfallText}>💧 {entry.rainfall_mm}mm {t('rainfall.title')}</Text>}
      </GlassCard>

      {entry.activities ? (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>{t('journal.activities')}</Text>
          <Text style={styles.sectionText}>{entry.activities}</Text>
        </GlassCard>
      ) : null}

      {entry.notes ? (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>{t('journal.notes')}</Text>
          <Text style={styles.sectionText}>{entry.notes}</Text>
        </GlassCard>
      ) : null}

      {entry.photos?.length > 0 && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>{t('journal.photos')}</Text>
          <FlatList
            horizontal
            data={entry.photos}
            keyExtractor={(p: any) => p.id}
            renderItem={({ item }: any) => (
              <Image source={{ uri: item.cloud_storage_path }} style={styles.photo} />
            )}
          />
        </GlassCard>
      )}

      <View style={styles.actions}>
        <GradientButton title={t('common.edit')} onPress={() => router.push(`/(tabs)/journal/edit?id=${id}`)} style={styles.editBtn} />
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 100 },
  loading: { color: Colors.text, textAlign: 'center', marginTop: 40 },
  headerCard: { marginBottom: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 20, fontWeight: '700', color: Colors.text },
  weatherEmoji: { fontSize: 28 },
  timeText: { color: Colors.textSecondary, marginTop: 4 },
  rainfallText: { color: Colors.primary, marginTop: 8, fontWeight: '600' },
  section: { marginBottom: Spacing.md },
  sectionLabel: { fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  sectionText: { color: Colors.text, lineHeight: 22 },
  photo: { width: 120, height: 120, borderRadius: Radius.md, marginRight: Spacing.sm },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  editBtn: { flex: 1 },
  deleteBtn: { flex: 1, backgroundColor: Colors.error + '22', borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', padding: Spacing.md },
  deleteBtnText: { color: Colors.error, fontWeight: '700' },
});
