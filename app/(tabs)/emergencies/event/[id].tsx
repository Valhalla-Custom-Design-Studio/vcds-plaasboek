import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { useAuth } from '../../../../src/context/AuthContext';
import { GlassCard } from '../../../../src/components/GlassCard';
import { GradientButton } from '../../../../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../../../../src/theme';

const SOS_COLORS: Record<string, string> = { attack: '#ef4444', medical: '#3b82f6', fire: '#f97316', general: '#eab308' };
const SOS_EMOJI: Record<string, string> = { attack: '🔴', medical: '🔵', fire: '🟠', general: '🟡' };
const SOS_LABEL: Record<string, string> = { attack: 'Aanval', medical: 'Mediese Nood', fire: 'Brand', general: 'Algemene Nood' };

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sos/${id}`).then(r => setEvent(r.data)).catch(() => Alert.alert(t('common.error'), t('common.failedToLoad'))).finally(() => setLoading(false));
  }, [id]);

  const handleAcknowledge = async () => {
    try { await api.post(`/sos/${id}/acknowledge`); Alert.alert('Erken', 'Jy het die SOS erken.'); }
    catch { Alert.alert(t('common.error'), t('common.anErrorOccurred')); }
  };

  const handleStandDown = async () => {
    Alert.alert('Staak Alarm', 'Is jy seker jy wil die alarm staak?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: 'Staak', style: 'destructive', onPress: async () => {
        try { await api.post(`/sos/${id}/cancel`); router.back(); }
        catch { Alert.alert(t('common.error'), t('common.anErrorOccurred')); }
      }},
    ]);
  };

  if (loading || !event) return <View style={styles.container}><Text style={styles.loading}>{t('common.loading')}</Text></View>;

  const color = SOS_COLORS[event.sos_type] || Colors.primary;
  const isSender = user?.id === event.sender_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.banner, { backgroundColor: color + '22', borderColor: color }]}>
        <Text style={styles.bannerEmoji}>{SOS_EMOJI[event.sos_type] || '🆘'}</Text>
        <Text style={[styles.bannerTitle, { color }]}>{SOS_LABEL[event.sos_type] || 'SOS'}</Text>
        {(event.resolved || event.cancelled_by_sender) && (
          <View style={styles.resolvedBadge}><Text style={styles.resolvedText}>✔ Opgelos</Text></View>
        )}
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.farmName}>{event.farm_name}</Text>
        <Text style={styles.sender}>{event.sender_name}</Text>
        <Text style={styles.time}>{new Date(event.timestamp).toLocaleString('af-ZA')}</Text>
      </GlassCard>

      {event.latitude && (
        <GlassCard style={styles.card}>
          <Text style={styles.sectionLabel}>GPS Koördinate</Text>
          <Text style={styles.gps}>{event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => Linking.openURL(`https://maps.google.com/?q=${event.latitude},${event.longitude}`)}>
            <Text style={styles.navBtnText}>🗺️ Navigeer</Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {event.gate_latitude && (
        <GlassCard style={styles.card}>
          <Text style={styles.sectionLabel}>Hek GPS</Text>
          <Text style={styles.gps}>{event.gate_latitude.toFixed(6)}, {event.gate_longitude.toFixed(6)}</Text>
        </GlassCard>
      )}

      {event.plot_number && (
        <GlassCard style={styles.card}>
          <Text style={styles.sectionLabel}>Plot Nommer</Text>
          <Text style={styles.gps}>{event.plot_number}</Text>
        </GlassCard>
      )}

      <View style={styles.actions}>
        {!event.resolved && !event.cancelled_by_sender && (
          <GradientButton title="✓ Erken" onPress={handleAcknowledge} style={styles.actionBtn} />
        )}
        <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL('tel:10111')}>
          <Text style={styles.callBtnText}>📞 Bel SAPS (10111)</Text>
        </TouchableOpacity>
        {isSender && !event.resolved && !event.cancelled_by_sender && (
          <TouchableOpacity style={styles.standDownBtn} onPress={handleStandDown}>
            <Text style={styles.standDownText}>🟢 Staak Alarm</Text>
          </TouchableOpacity>
        )}
      </View>

      {event.acknowledgements?.length > 0 && (
        <GlassCard style={styles.card}>
          <Text style={styles.sectionLabel}>Erkennings ({event.acknowledgements.length})</Text>
          {event.acknowledgements.map((a: any) => (
            <Text key={a.id} style={styles.ackItem}>✓ {a.user_name} — {new Date(a.acknowledged_at).toLocaleTimeString('af-ZA')}</Text>
          ))}
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 100 },
  loading: { color: Colors.text, textAlign: 'center', marginTop: 40 },
  banner: { borderRadius: Radius.md, borderWidth: 2, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.md },
  bannerEmoji: { fontSize: 48 },
  bannerTitle: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  resolvedBadge: { marginTop: 8, backgroundColor: '#22c55e22', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  resolvedText: { color: '#22c55e', fontWeight: '700' },
  card: { marginBottom: Spacing.md },
  farmName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sender: { color: Colors.textSecondary, marginTop: 2 },
  time: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  gps: { color: Colors.text, fontFamily: 'monospace' },
  navBtn: { marginTop: Spacing.sm, backgroundColor: Colors.primary + '22', borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  navBtnText: { color: Colors.primary, fontWeight: '700' },
  actions: { gap: Spacing.sm, marginBottom: Spacing.md },
  actionBtn: {},
  callBtn: { backgroundColor: '#3b82f622', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  callBtnText: { color: '#3b82f6', fontWeight: '700', fontSize: 16 },
  standDownBtn: { backgroundColor: '#22c55e22', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  standDownText: { color: '#22c55e', fontWeight: '700', fontSize: 16 },
  ackItem: { color: Colors.text, paddingVertical: 2 },
});
