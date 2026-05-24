import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', farmName: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { Alert.alert('Fout', 'Vul alle velde in'); return; }
    if (form.password !== form.confirm) { Alert.alert('Fout', 'Wagwoorde stem nie ooreen nie'); return; }
    if (form.password.length < 8) { Alert.alert('Fout', 'Wagwoord moet minstens 8 karakters wees'); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email.trim().toLowerCase(), password: form.password, farmName: form.farmName });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Registrasie Misluk', e?.response?.data?.message || 'Probeer weer');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.title}>🌾 Skep Rekening</Text>
        {[
          { label: 'Volle Naam', key: 'name', placeholder: 'Jan van der Berg' },
          { label: 'E-posadres', key: 'email', placeholder: 'jan@plaas.co.za', keyboard: 'email-address' },
          { label: 'Plaasnaam', key: 'farmName', placeholder: 'Groenplaas' },
          { label: 'Wagwoord', key: 'password', placeholder: '••••••••', secure: true },
          { label: 'Bevestig Wagwoord', key: 'confirm', placeholder: '••••••••', secure: true },
        ].map(f => (
          <View key={f.key}>
            <Text style={s.label}>{f.label}</Text>
            <TextInput style={s.input} value={(form as any)[f.key]} onChangeText={set(f.key)}
              placeholder={f.placeholder} secureTextEntry={f.secure} keyboardType={(f as any).keyboard || 'default'} autoCapitalize="none" />
          </View>
        ))}
        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Skep Rekening</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.link}>Het reeds 'n rekening? Teken In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2D5016', marginBottom: 24 },
  label: { fontSize: 14, color: '#555', marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  btn: { backgroundColor: '#2D5016', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#2D5016', marginTop: 16, fontSize: 14 },
});
