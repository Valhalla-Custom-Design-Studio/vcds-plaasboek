import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import api from '../../src/services/api';

const CHANGE_TYPES = ['birth','death','purchase','sale','transfer','treatment'];
const ANIMAL_TYPES = ['Beeste','Skape','Bokke','Varke','Perde','Hoenders','Ander'];

export default function LivestockAddScreen() {
  const [form, setForm] = useState({ animal_type: 'Beeste', change_type: 'birth', quantity: '1', unit_price: '', camp_id: '', notes: '', date: new Date().toISOString().split('T')[0] });
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/api/livestock/camps').then(r => setCamps(r.data.camps || [])); }, []);

  const save = async () => {
    setLoading(true);
    try {
      await api.post('/api/livestock/changes', { ...form, quantity: parseInt(form.quantity), unit_price: form.unit_price ? parseFloat(form.unit_price) : null, camp_id: form.camp_id || null });
      router.back();
    } catch (e: any) { Alert.alert('Fout', e?.response?.data?.message || 'Stoor misluk'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>Nuwe Vee Verandering</Text>
      <Text style={s.label}>Dier Tipe</Text>
      <View style={s.pickerWrap}>
        <Picker selectedValue={form.animal_type} onValueChange={v => setForm(f => ({...f, animal_type: v}))}>
          {ANIMAL_TYPES.map(a => <Picker.Item key={a} label={a} value={a} />)}
        </Picker>
      </View>
      <Text style={s.label}>Verandering Tipe</Text>
      <View style={s.pickerWrap}>
        <Picker selectedValue={form.change_type} onValueChange={v => setForm(f => ({...f, change_type: v}))}>
          {CHANGE_TYPES.map(c => <Picker.Item key={c} label={c.charAt(0).toUpperCase()+c.slice(1)} value={c} />)}
        </Picker>
      </View>
      <Text style={s.label}>Kamp</Text>
      <View style={s.pickerWrap}>
        <Picker selectedValue={form.camp_id} onValueChange={v => setForm(f => ({...f, camp_id: v}))}>
          <Picker.Item label="Geen kamp" value="" />
          {camps.map(c => <Picker.Item key={c.id} label={c.name} value={c.id} />)}
        </Picker>
      </View>
      <Text style={s.label}>Aantal</Text>
      <TextInput style={s.input} value={form.quantity} onChangeText={v => setForm(f => ({...f, quantity: v}))} keyboardType="numeric" />
      <Text style={s.label}>Eenheidsprys (R)</Text>
      <TextInput style={s.input} value={form.unit_price} onChangeText={v => setForm(f => ({...f, unit_price: v}))} keyboardType="decimal-pad" placeholder="0.00" />
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
