import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { GradientButton } from '../../../src/components/GradientButton';
import { GlassCard } from '../../../src/components/GlassCard';
import { Colors, Spacing, Radius } from '../../../src/theme';

const CATEGORIES = ['fuel', 'feed', 'vet', 'fencing', 'labour', 'equipment', 'other'];

export default function ExpenseCreateScreen() {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('fuel');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { Alert.alert(t('common.error'), "Voer 'n geldige bedrag in"); return; }`
    if (!description.trim()) { Alert.alert(t('common.error'), "Voer 'n beskrywing in"); return; }`
    setSaving(true);
    try {
      await api.post('/expenses', { amount: Number(amount), category, description, date });
      router.back();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('common.failedToSave'));
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GlassCard style={styles.card}>
        <Text style={styles.label}>{t('expenses.amount')}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>R</Text>
          <TextInput style={[styles.input, styles.amountInput]} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={Colors.textSecondary} />
        </View>

        <Text style={styles.label}>{t('expenses.category')}</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} style={[styles.catBtn, category === c && styles.catBtnActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.catText, category === c && styles.catTextActive]}>{t(`expenses.${c}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('expenses.description')}</Text>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Beskrywing..." placeholderTextColor={Colors.textSecondary} />

        <Text style={styles.label}>{t('common.date')}</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />
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
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  currency: { color: Colors.primary, fontSize: 20, fontWeight: '700' },
  amountInput: { flex: 1 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  catBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { color: Colors.textSecondary, fontSize: 13 },
  catTextActive: { color: '#fff', fontWeight: '700' },
});
