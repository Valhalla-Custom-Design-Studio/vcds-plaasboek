import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { GlassCard } from '../../../src/components/GlassCard';
import { OfflineBanner } from '../../../src/components/OfflineBanner';
import { FloatingSosButton } from '../../../src/components/FloatingSosButton';
import { Colors, Spacing, Radius } from '../../../src/theme';

const SOS_EMOJI: Record<string, string> = { attack: '🚨', medical: '🚑', fire: '🔥', general: '🆘' };
const SOS_COLOR: Record<string, string> = { attack: Colors.attack, medical: Colors.medical, fire: Colors.fire, general: Colors.general };

export default function EmergenciesScreen() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'sent'|'received'>('sent');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/sos?type=${tab}`);
      setEvents(res.data.items || []);
    } catch (err: any) { Alert.alert(t('common.error'), err.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [tab]);

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>{t('sos.title')}</Text>
        <View style={styles.quickNav}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/emergencies/contacts')}>
            <Text style={styles.quickEmoji}>📞</Text>
            <Text style={styles.quickLabel}>{t('contacts.title')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/emergencies/medical-profile')}>
            <Text style={styles.quickEmoji}>🏥</Text>
            <Text style={styles.quickLabel}>{t('medical.title')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/emergencies/sos-settings')}>
            <Text style={styles.quickEmoji}>⚙️</Text>
            <Text style={styles.quickLabel}>{t('sosSettings.title')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tabRow}>
          {(['sent','received'] as const).map(t_ => (
            <TouchableOpacity key={t_} style={[styles.tabBtn, tab === t_ && styles.tabBtnActive]} onPress={() => setTab(t_)}>
              <Text style={[styles.tabText, tab === t_ && styles.tabTextActive]}>{t(`sos.${t_}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={events}
        keyExtractor={(i: any) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        renderItem={({ item }: any) => (
          <TouchableOpacity onPress={() => router.push(`/(tabs)/emergencies/event/${item.id}`)}>
            <GlassCard style={[styles.eventCard, { borderLeftColor: SOS_COLOR[item.sos_type], borderLeftWidth: 4 }]}>
              <View style={styles.eventRow}>
                <Text style={styles.eventEmoji}>{SOS_EMOJI[item.sos_type]}</Text>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventFarm}>{item.farm_name}</Text>
                  <Text style={styles.eventTime}>{new Date(item.timestamp).toLocaleString('af-ZA')}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.resolved ? Colors.success + '33' : Colors.error + '33' }]}>
                  <Text style={[styles.statusText, { color: item.resolved ? Colors.success : Colors.error }]}>
                    {item.cancelled_by_sender ? t('sos.cancelled') : item.resolved ? t('sos.resolved') : t('sos.unresolved')}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}><Text style={styles.emptyText}>{t('sos.noEvents')}</Text></View>
        ) : null}
      />
      <FloatingSosButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, fontFamily: 'Georgia', marginBottom: 12 },
  quickNav: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder },
  quickEmoji: { fontSize: 24, marginBottom: 4 },
  quickLabel: { color: Colors.textSecondary, fontSize: 11, textAlign: 'center' },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: Radius.sm, alignItems: 'center', backgroundColor: Colors.surface },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { padding: Spacing.md, paddingBottom: 120 },
  eventCard: { marginBottom: 10 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventEmoji: { fontSize: 28 },
  eventInfo: { flex: 1 },
  eventFarm: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  eventTime: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
});
