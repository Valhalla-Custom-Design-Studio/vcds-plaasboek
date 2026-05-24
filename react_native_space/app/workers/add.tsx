import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '../../src/services/api';

export default function WorkerAddScreen() {
  const [form, setForm] = useState({ name: '', role: '', phone: '', id_number: '', daily_rate: '', start_date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.name) { Alert.alert('Fout', 'Naam is verpligtend'); return; }
    setLoading(true);
    try {
      await api.post('/api/workers', { ...form, daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : null });
      router.back();
    } catch (e: any) { Alert.alert('Fout', e?.response?.data?.message || 'Stoor misluk'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>Nuwe Werker</Text>
      {[
        { label: 'Volle Naam *', key: 'name', placeholder: 'Jan Botha' },
        { label: 'Rol', key: 'role', placeholder: 'Plaaswerker' },
        { label: 'Telefoon', key: 'phone', placeholder: '0821234567', keyboard: 'phone-pad' },
        { label: 'ID Nommer', key: 'id_number', placeholder: '8001015009087', keyboard: 'numeric' },
        { label: 'Daaglikse Tarief (R)', key: 'daily_rate', placeholder: '250.00', keyboard: 'decimal-pad' },
        { label: 'Begindatum', key: 'start_date', placeholder: 'JJJJ-MM-DD' },
      ].map(f => (
        <View key={f.key}>
          <Text style={s.label}>{f.label}</Text>
          <TextInput style={s.input} value={(form as any)[f.key]} onChangeText={v => setForm(x => ({...x, [f.key]: v}))}
            placeholder={f.placeholder} keyboardType={(f as any).keyboard || 'default'} />
        </View>
      ))}
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
  btn: { backgroundColor: '#2D5016', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
