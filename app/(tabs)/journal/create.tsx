import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useOffline } from '../../../src/context/OfflineContext';
import { GradientButton } from '../../../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../../../src/theme';

const WEATHER_OPTIONS = ['sunny','cloudy','rainy','stormy','windy','cold'];

export default function JournalCreateScreen() {
  const { t } = useLanguage();
  const { isOnline, queueAction } = useOffline();
  const [form, setForm] = useState({ weather: '', rainfallMm: '', activities: '', notes: '', entryDate: new Date().toISOString().split('T')[0], entryTime: new Date().toTimeString().slice(0,5) });
  const [loading, setLoading] = useState(false);

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.entryDate) { Alert.alert(t('common.error'), t('validation.allRequired')); return; }
    setLoading(true);
    try {
      if (isOnline) {
        await api.post('/journal', { ...form, rainfallMm: form.rainfallMm ? parseFloat(form.rainfallMm) : null });
      } else {
        await queueAction('journal:create', { ...form, rainfallMm: form.rainfallMm ? parseFloat(form.rainfallMm) : null });
        Alert.alert(t('common.saved'), t('offline.savedOffline'));
      }
      router.back();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← {t('common.back')}</Text></TouchableOpacity>
        <Text style={styles.title}>{t('journal.addEntry')}</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>{t('common.date')}</Text>
        <TextInput style={styles.input} value={form.entryDate} onChangeText={v => update('entryDate', v)} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>{t('common.time')}</Text>
        <TextInput style={styles.input} value={form.entryTime} onChangeText={v => update('entryTime', v)} placeholder="HH:MM" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>{t('journal.weather')}</Text>
        <View style={styles.weatherRow}>
          {WEATHER_OPTIONS.map(w => (
            <TouchableOpacity key={w} style={[styles.weatherChip, form.weather === w && styles.weatherChipActive]} onPress={() => update('weather', w)}>
              <Text style={styles.weatherChipText}>{t(`weather.${w}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>{t('journal.rainfall')}</Text>
        <TextInput style={styles.input} value={form.rainfallMm} onChangeText={v => update('rainfallMm', v)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>{t('journal.activities')}</Text>
        <TextInput style={[styles.input, styles.textarea]} value={form.activities} onChangeText={v => update('activities', v)} multiline numberOfLines={4} placeholder={t('journal.activities')} placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>{t('journal.notes')}</Text>
        <TextInput style={[styles.input, styles.textarea]} value={form.notes} onChangeText={v => update('notes', v)} multiline numberOfLines={3} placeholder={t('journal.notes')} placeholderTextColor={Colors.textMuted} />
        <GradientButton title={t('common.save')} onPress={handleSave} loading={loading} style={{ marginTop: 16 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 60 },
  header: { paddingTop: 60, marginBottom: 24 },
  back: { color: Colors.primary, fontSize: 16, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, fontFamily: 'Georgia' },
  form: { gap: 8 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 8 },
  input: { height: 52, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radius.md, paddingHorizontal: 16, color: Colors.textPrimary, fontSize: 16 },
  textarea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  weatherRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  weatherChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.inputBorder, backgroundColor: Colors.inputBg },
  weatherChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  weatherChipText: { color: Colors.textPrimary, fontSize: 13 },
});
