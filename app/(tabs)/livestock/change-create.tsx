import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../src/services/api';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { GradientButton } from '../../../../src/components/GradientButton';
import { GlassCard } from '../../../../src/components/GlassCard';
import { Colors, Spacing, Radius } from '../../../../src/theme';

const REASONS = ['birth', 'purchase', 'sale', 'death', 'theft'];

export default function ChangeCreateScreen() {
  const { campId } = useLocalSearchParams<{ campId?: string }>();
  const { t } = useLanguage();
  const [camps, setCamps] = useState<any[]>([]);
  const [selectedCamp, setSelectedCamp] = useState(campId || '');
  const [type, setType] = useState<'addition' | 'removal'>('addition');
  const [reason, setReason] = useState('birth');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/camps').then(r => setCamps(r.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!selectedCamp) { Alert.alert(t('common.error`), "Kies 'n kamp"); return; }`
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) { Alert.alert(t('common.error`), "Voer 'n geldige hoeveelheid in"); return; }`
    setSaving(true);
    try {
      await api.post(`/camps/${selectedCamp}/changes`, { type, reason, quantity: Number(quantity), notes, date });
      router.back();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('common.failedToSave'));
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GlassCard style={styles.card}>
        <Text style={styles.label}>Kamp</Text>
        <View style={styles.campList}>
          {camps.map(c => (
            <TouchableOpacity key={c.id} style={[styles.option, selectedCamp === c.id && styles.optionSelected]} onPress={() => setSelectedCamp(c.id)}>
              <Text style={[styles.optionText, selectedCamp === c.id && styles.optionTextSelected]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tipe</Text>
        <View style={styles.typeRow}>
          {(['addition', 'removal'] as const).map(tp => (
            <TouchableOpacity key={tp} style={[styles.typeBtn, type === tp && styles.typeBtnActive]} onPress={() => setType(tp)}>
              <Text style={[styles.typeBtnText, type === tp && styles.typeBtnTextActive]}>
                {tp === 'addition' ? t('livestock.addition') : t('livestock.removal')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('livestock.reason')}</Text>
        <View style={styles.campList}>
          {REASONS.map(r => (
            <TouchableOpacity key={r} style={[styles.option, reason === r && styles.optionSelected]} onPress={() => setReason(r)}>
              <Text style={[styles.optionText, reason === r && styles.optionTextSelected]}>{t(`livestock.${r}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('livestock.quantity')}</Text>
        <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textSecondary} />

        <Text style={styles.label}>{t('common.date')}</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />

        <Text style={styles.label}>Notas (opsioneel)</Text>
        <TextInput style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder="Opsionele notas..." placeholderTextColor={Colors.textSecondary} />
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
  campList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  option: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  optionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.textSecondary, fontSize: 13 },
  optionTextSelected: { color: '#fff', fontWeight: '700' },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeBtn: { flex: 1, padding: Spacing.sm, borderRadius: Radius.sm, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },
});
