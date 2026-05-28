import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../src/services/api';

const MOODS = ['great','good','neutral','bad','terrible'];
const MOOD_EMOJI: Record<string,string> = { great:'😄', good:'🙂', neutral:'😐', bad:'😕', terrible:'😢' };

export default function JournalAddScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id && id !== 'add';
  const [form, setForm] = useState({ title: '', body: '', mood: 'neutral', weather: '', tags: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/api/journal/${id}`).then(r => {
        const e = r.data.entry;
        setForm({ title: e.title, body: e.body || '', mood: e.mood || 'neutral', weather: e.weather || '', tags: (e.tags || []).join(', ') });
      });
    }
  }, [id]);
        .catch((err) => { /* VCDS:SAFE */ if (__DEV__) { void 0; } });

  const save = async () => {
    if (!form.title) { Alert.alert('Fout', 'Titel is verpligtend'); return; }
    setLoading(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (isEdit) await api.patch(`/api/journal/${id}`, payload);
      else await api.post('/api/journal', payload);
      router.back();
    } catch (e: any) {
      Alert.alert('Fout', e?.response?.data?.message || 'Stoor misluk');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>{isEdit ? 'Wysig Inskrywing' : 'Nuwe Inskrywing'}</Text>
      <Text style={s.label}>Titel *</Text>
      <TextInput style={s.input} value={form.title} onChangeText={v => setForm(f => ({...f, title: v}))} placeholder="Vandag op die plaas..." />
      <Text style={s.label}>Stemming</Text>
      <View style={s.moodRow}>
        {MOODS.map(m => (
          <TouchableOpacity key={m} style={[s.moodBtn, form.mood === m && s.moodActive]} onPress={() => setForm(f => ({...f, mood: m}))}>
            <Text style={s.moodEmoji}>{MOOD_EMOJI[m]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.label}>Weer</Text>
      <TextInput style={s.input} value={form.weather} onChangeText={v => setForm(f => ({...f, weather: v}))} placeholder="Sonnig, 28°C" />
      <Text style={s.label}>Notas</Text>
      <TextInput style={[s.input, s.textarea]} value={form.body} onChangeText={v => setForm(f => ({...f, body: v}))} multiline numberOfLines={6} placeholder="Wat het vandag gebeur..." />
      <Text style={s.label}>Etikette (komma-geskei)</Text>
      <TextInput style={s.input} value={form.tags} onChangeText={v => setForm(f => ({...f, tags: v}))} placeholder="vee, reën, oes" />
      <TouchableOpacity style={s.btn} onPress={save} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Stoor</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
        <Text style={s.cancelText}>Kanselleer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#2D5016', marginBottom: 24 },
  label: { fontSize: 14, color: '#555', marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  textarea: { height: 120, textAlignVertical: 'top' },
  moodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  moodBtn: { padding: 8, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  moodActive: { borderColor: '#2D5016', backgroundColor: '#e8f5e9' },
  moodEmoji: { fontSize: 28 },
  btn: { backgroundColor: '#2D5016', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { padding: 16, alignItems: 'center' },
  cancelText: { color: '#888', fontSize: 16 },
});
