import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { GradientButton } from '../../../../src/components/GradientButton';
import { GlassCard } from '../../../../src/components/GlassCard';
import { Colors, Spacing, Radius } from '../../../../src/theme';

export default function VetCreateScreen() {
  const { t } = useLanguage();
  const [animalId, setAnimalId] = useState('');
  const [treatment, setTreatment] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [withdrawalDays, setWithdrawalDays] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const safeDate = withdrawalDays && visitDate
    ? new Date(new Date(visitDate).getTime() + Number(withdrawalDays) * 86400000).toLocaleDateString('af-ZA')
    : '—';

  const handleSave = async () => {
    if (!animalId || !treatment || !medication || !dosage || !withdrawalDays) {
      Alert.alert(t('common.error'), 'Vul alle velde in');
      return;
    }
    setSaving(true);
    try {
      await api.post('/vet-visits', { animalId, treatment, medication, dosage, withdrawalDays: Number(withdrawalDays), visitDate });
      router.back();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('common.failedToSave'));
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GlassCard style={styles.card}>
        {[
          { label: t('livestock.animalId'), value: animalId, set: setAnimalId, placeholder: 'bv. TAG-001' },
          { label: t('livestock.treatment'), value: treatment, set: setTreatment, placeholder: 'Behandeling beskrywing', multi: true },
          { label: t('livestock.medication'), value: medication, set: setMedication, placeholder: 'Medikasie naam' },
          { label: t('livestock.dosage'), value: dosage, set: setDosage, placeholder: 'bv. 5ml' },
        ].map(({ label, value, set, placeholder, multi }) => (
          <View key={label}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={[styles.input, multi && styles.textarea]}
              value={value}
              onChangeText={set}
              placeholder={placeholder}
              placeholderTextColor={Colors.textSecondary}
              multiline={multi}
              numberOfLines={multi ? 3 : 1}
            />
          </View>
        ))}

        <Text style={styles.label}>{t('livestock.withdrawalDays')}</Text>
        <TextInput style={styles.input} value={withdrawalDays} onChangeText={setWithdrawalDays} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textSecondary} />

        <Text style={styles.label}>{t('livestock.visitDate')}</Text>
        <TextInput style={styles.input} value={visitDate} onChangeText={setVisitDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />

        <View style={styles.safeDateCard}>
          <Text style={styles.safeDateLabel}>{t('livestock.safeDate')}</Text>
          <Text style={styles.safeDateValue}>{safeDate}</Text>
        </View>
      </GlassCard>
      <GradientButton title={saving ? t('common.loading') : t('common.save')} onPress={handleSave} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 100 },
  card: { marginBottom: Spacing.md },
  label: { color: Colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: Spacing.sm },
  input: { backgroundColor: Colors.surface, color: Colors.text, borderRadius: Radius.sm, padding: Spacing.sm, fontSize: 16, borderWidth: 1, borderColor: Colors.border },
  textarea: { height: 80, textAlignVertical: 'top' },
  safeDateCard: { marginTop: Spacing.md, backgroundColor: Colors.primary + '22', borderRadius: Radius.sm, padding: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between' },
  safeDateLabel: { color: Colors.textSecondary, fontSize: 13 },
  safeDateValue: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
});
