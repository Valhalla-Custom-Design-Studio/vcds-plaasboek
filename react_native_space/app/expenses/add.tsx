import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import api from '../../src/services/api';

const CATEGORIES = ['Voer','Brandstof','Arbeid','Mediese','Toerusting','Saad','Kunsmis','Versekering','Onderhoud','Ander'];

export default function ExpensesAddScreen() {
  const [form, setForm] = useState({ category: 'Voer', description: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.description || !form.amount) { Alert.alert('Fout', 'Beskrywing en bedrag is verpligtend'); return; }
    setLoading(true);
    try {
      await api.post('/api/expenses', { ...form, amount: parseFloat(form.amount) });
      router.back();
    } catch (e: any) { Alert.alert('Fout', e?.response?.data?.message || 'Stoor misluk'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>Nuwe Uitgawe</Text>
      <Text style={s.label}>Kategorie</Text>
      <View style={s.pickerWrap}>
        <Picker selectedValue={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
          {CATEGORIES.map(c => <Picker.Item key={c} label={c} value={c} />)}
        </Picker>
      </View>
      <Text style={s.label}>Beskrywing *</Text>
      <TextInput style={s.input} value={form.description} onChangeText={v => setForm(f => ({...f, description: v}))} placeholder="Beskrywing van uitgawe" />
      <Text style={s.label}>Bedrag (R) *</Text>
      <TextInput style={s.input} value={form.amount} onChangeText={v => setForm(f => ({...f, amount: v}))} keyboardType="decimal-pad" placeholder="0.00" />
      <Text style={s.label}>Datum</Text>
      <TextInput style={s.input} value={form.date} onChangeText={v => setForm(f => ({...f, date: v}))} placeholder="JJJJ-MM-DD" />
      <Text style={s.label}>Notas</Text>
      <TextInput style={[s.input, s.textarea]} value={form.notes} onChangeText={v => setForm(f => ({...f, notes: v}))} multiline numberOfLines={3} />
      <TouchableOpacity style={s.btn} onPress={save} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Stoor</Text>}
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
  textarea: { height: 80, textAlignVertical: 'top' },
  pickerWrap: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginBottom: 16 },
  btn: { backgroundColor: '#2D5016', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
