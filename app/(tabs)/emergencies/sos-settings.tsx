import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useOffline } from '../../../src/context/OfflineContext';
import { GlassCard } from '../../../src/components/GlassCard';
import { Colors, Spacing, Radius } from '../../../src/theme';

const INTERVALS = [30, 60, 120, 240, 480];
const INTERVAL_LABELS: Record<number, string> = { 30: '30 min', 60: '1 uur', 120: '2 ure', 240: '4 ure', 480: '8 ure' };

export default function SOSSettingsScreen() {
  const { t } = useLanguage();
  const { pendingCount, flushQueue } = useOffline();
  const [dms, setDms] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDMS = async () => {
    try { const res = await api.get('/sos/dms/status'); setDms(res.data.dms); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadDMS(); }, []);

  const toggleDMS = async (field: 'armed' | 'enabled', value: boolean) => {
    try {
      const res = await api.post('/sos/dead-mans-switch', { ...dms, [field]: value });
      setDms(res.data.dms);
    } catch (err: any) { Alert.alert(t('common.error'), err.message); }
  };

  const setInterval_ = async (minutes: number) => {
    try {
      const res = await api.post('/sos/dead-mans-switch', { ...dms, intervalMinutes: minutes });
      setDms(res.data.dms);
    } catch (err: any) { Alert.alert(t('common.error'), err.message); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('sosSettings.title')}</Text>

      {/* Dead Man's Switch */}
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>💀 {t('sos.dms')}</Text>
        <Text style={styles.sectionDesc}>{t('sos.dmsDesc')}</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('sos.armed')}</Text>
          <Switch value={dms?.armed || false} onValueChange={v => toggleDMS('armed', v)} trackColor={{ true: Colors.primary }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enabled</Text>
          <Switch value={dms?.enabled || false} onValueChange={v => toggleDMS('enabled', v)} trackColor={{ true: Colors.primary }} />
        </View>
        {dms?.armed && (
          <View style={styles.armedBadge}>
            <Text style={styles.armedText}>🔴 {t('sos.armed').toUpperCase()}</Text>
            {dms.last_heartbeat && <Text style={styles.heartbeatText}>Last heartbeat: {new Date(dms.last_heartbeat).toLocaleTimeString('af-ZA')}</Text>}
          </View>
        )}
        <Text style={styles.intervalLabel}>Interval:</Text>
        <View style={styles.intervalRow}>
          {INTERVALS.map(i => (
            <TouchableOpacity key={i} style={[styles.intervalChip, dms?.interval_minutes === i && styles.intervalChipActive]} onPress={() => setInterval_(i)}>
              <Text style={styles.intervalText}>{INTERVAL_LABELS[i]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>

      {/* Offline Queue */}
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>📤 {t('sosSettings.offlineQueue')}</Text>
        {pendingCount > 0 ? (
          <>
            <Text style={styles.sectionDesc}>{pendingCount} {t('sosSettings.offlineQueue')}</Text>
            <TouchableOpacity style={styles.sendNowBtn} onPress={flushQueue}>
              <Text style={styles.sendNowText}>{t('sosSettings.sendNow')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.sectionDesc}>{t('sosSettings.noMessages')}</Text>
        )}
      </GlassCard>

      {/* Satellite SMS */}
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>🛰️ {t('sosSettings.satelliteSms')}</Text>
        <Text style={styles.sectionDesc}>{t('sosSettings.satelliteDesc')}</Text>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: 60, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, fontFamily: 'Georgia', marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  sectionDesc: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchLabel: { color: Colors.textPrimary, fontSize: 16 },
  armedBadge: { backgroundColor: Colors.error + '22', borderRadius: Radius.sm, padding: 10, marginTop: 8 },
  armedText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
  heartbeatText: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  intervalLabel: { color: Colors.textSecondary, fontSize: 13, marginTop: 12, marginBottom: 8 },
  intervalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  intervalChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  intervalChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  intervalText: { color: Colors.textPrimary, fontSize: 13 },
  sendNowBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 12, alignItems: 'center' },
  sendNowText: { color: '#fff', fontWeight: '700' },
});
