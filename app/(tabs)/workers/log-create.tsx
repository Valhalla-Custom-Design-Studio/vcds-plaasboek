import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { GradientButton } from '../../../src/components/GradientButton';
import { GlassCard } from '../../../src/components/GlassCard';
import { Colors, Spacing, Radius } from '../../../src/theme';

export default function LogCreateScreen() {
  const { workerId } = useLocalSearchParams<{ workerId?: string }>();
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState(workerId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [present, setPresent] = useState(true);
  const [hoursWorked, setHoursWorked] = useState('');
  const [tasks, setTasks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/workers').then(r => setWorkers(r.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!selectedWorker) { Alert.alert(t('common.error'), 'Kies 'n werker'); return; }
    setSaving(true);
    try {
      await api.post(`/workers/${selectedWorker}/logs`, {
        date, present, hoursWorked: hoursWorked ? Number(hoursWorked) : null, tasks: tasks || null,
      });
      router.back();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('common.failedToSave'));
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GlassCard style={styles.card}>
        {!workerId && (
          <>
            <Text style={styles.label}>Werker</Text>
            <View style={styles.workerList}>
              {workers.map(w => (
                <TouchableOpacity key={w.id} style={[styles.option, selectedWorker === w.id && styles.optionSelected]} onPress={() => setSelectedWorker(w.id)}>
                  <Text style={[styles.optionText, selectedWorker === w.id && styles.optionTextSelected]}>{w.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>{t('common.date')}</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Teenwoordig</Text>
          <Switch value={present} onValueChange={setPresent} trackColor={{ true: Colors.primary }} />
        </View>

        {present && (
          <>
            <Text style={styles.label}>Ure Gewerk</Text>
            <TextInput style={styles.input} value={hoursWorked} onChangeText={setHoursWorked} keyboardType="decimal-pad" placeholder="0.0" placeholderTextColor={Colors.textSecondary} />
          </>
        )}

        <Text style={styles.label}>Take</Text>
        <TextInput style={[styles.input, styles.textarea]} value={tasks} onChangeText={setTasks} multiline numberOfLines={4} placeholder="Beskryf take..." placeholderTextColor={Colors.textSecondary} />
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
  textarea: { height: 100, textAlignVertical: 'top' },
  workerList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  option: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  optionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.textSecondary, fontSize: 13 },
  optionTextSelected: { color: '#fff', fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  switchLabel: { color: Colors.text, fontSize: 16 },
});
