import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';

export default function LoginScreen() {
  const { login, lang } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Fout', 'Vul alle velde in'); return; }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Aanmelding Misluk', e?.response?.data?.message || 'Probeer weer');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <Text style={s.logo}>🌾 Plaasboek™</Text>
        <Text style={s.subtitle}>Plaasrekordhouding</Text>
      </View>
      <View style={s.form}>
        <Text style={s.label}>E-posadres</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="naam@plaas.co.za" />
        <Text style={s.label}>Wagwoord</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Teken In</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={s.link}>Geen rekening nie? Registreer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2D5016' },
  header: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  logo: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  subtitle: { color: '#c8e6c9', fontSize: 16, marginTop: 8 },
  form: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 48 },
  label: { fontSize: 14, color: '#555', marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  btn: { backgroundColor: '#2D5016', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#2D5016', marginTop: 16, fontSize: 14 },
});
