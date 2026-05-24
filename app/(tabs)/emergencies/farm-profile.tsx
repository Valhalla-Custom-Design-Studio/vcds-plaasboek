import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { GradientButton } from '../../../src/components/GradientButton';
import { GlassCard } from '../../../src/components/GlassCard';
import { Colors, Spacing, Radius } from '../../../src/theme';

export default function FarmProfileScreen() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    plotNumber: user?.plotNumber || '',
    nearestTown: user?.nearestTown || '',
    alertRadiusKm: String(user?.alertRadiusKm || 10),
    gateLatitude: String(user?.gateLatitude || ''),
    gateLongitude: String(user?.gateLongitude || ''),
  });
  const [saving, setSaving] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleGetGateGps = async () => {
    setGettingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert(t('common.error'), 'Location permission denied'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      update('gateLatitude', String(loc.coords.latitude));
      update('gateLongitude', String(loc.coords.longitude));
      Alert.alert(t('common.success'), t('farm.gateGpsSet'));
    } catch (err: any) { Alert.alert(t('common.error'), err.message); }
    finally { setGettingGps(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({
        plotNumber: form.plotNumber,
        nearestTown: form.nearestTown,
        alertRadiusKm: parseInt(form.alertRadiusKm) || 10,
        gateLatitude: form.gateLatitude ? parseFloat(form.gateLatitude) : undefined,
        gateLongitude: form.gateLongitude ? parseFloat(form.gateLongitude) : undefined,
      });
      Alert.alert(t('common.success'), t('common.saved'));
    } catch (err: any) { Alert.alert(t('common.error'), err.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t('farm.title')}</Text>

      <GlassCard style={styles.section}>
        <Text style={styles.label}>{t('farm.plotNumber')}</Text>
        <TextInput style={styles.input} value={form.plotNumber} onChangeText={v => update('plotNumber', v)}
          placeholder={t('farm.plotNumber')} placeholderTextColor={Colors.textMuted} />

        <Text style={styles.label}>{t('farm.nearestTown')}</Text>
        <TextInput style={styles.input} value={form.nearestTown} onChangeText={v => update('nearestTown', v)}
          placeholder={t('farm.nearestTown')} placeholderTextColor={Colors.textMuted} />

        <Text style={styles.label}>{t('farm.alertRadius')} (km)</Text>
        <TextInput style={styles.input} value={form.alertRadiusKm} onChangeText={v => update('alertRadiusKm', v)}
          keyboardType="numeric" placeholder="10" placeholderTextColor={Colors.textMuted} />
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('farm.gateGps')}</Text>
        <Text style={styles.hint}>{t('farm.gateGpsHint')}</Text>
        {form.gateLatitude && form.gateLongitude ? (
          <View style={styles.gpsSet}>
            <Text style={styles.gpsText}>📍 {parseFloat(form.gateLatitude).toFixed(6)}, {parseFloat(form.gateLongitude).toFixed(6)}</Text>
          </View>
        ) : null}
        <GradientButton title={gettingGps ? t('common.loading') : t('farm.setGateGps')}
          onPress={handleGetGateGps} loading={gettingGps} variant="outline" style={{ marginTop: 8 }} />
      </GlassCard>

      <GradientButton title={t('common.save')} onPress={handleSave} loading={saving} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4, marginTop: 12 },
  hint: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  input: { height: 48, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radius.md, paddingHorizontal: 14, color: Colors.textPrimary, fontSize: 15 },
  gpsSet: { backgroundColor: Colors.primaryDark + '44', borderRadius: Radius.sm, padding: 10, marginTop: 4 },
  gpsText: { color: Colors.primaryLight, fontSize: 13, fontWeight: '600' },
});
