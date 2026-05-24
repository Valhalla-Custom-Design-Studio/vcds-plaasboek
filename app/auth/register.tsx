import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { GradientButton } from '../../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function RegisterScreen() {
  const { signup } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', farmName: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) { Alert.alert(t('common.error'), t('validation.allRequired')); return; }
    if (form.password.length < 8) { Alert.alert(t('common.error'), t('validation.passwordLength')); return; }
    if (form.password !== form.confirmPassword) { Alert.alert(t('common.error'), t('validation.passwordMismatch')); return; }
    setLoading(true);
    try {
      await signup({ name: form.name, email: form.email.trim(), farmName: form.farmName, password: form.password });
      router.replace('/(tabs)/journal');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally { setLoading(false); }
  };

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
        <Text style={styles.langText}>{language === 'af' ? 'EN' : 'AF'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Plaasboek</Text>
      <Text style={styles.subtitle}>{t('auth.adminApprovalNote')}</Text>
      <View style={styles.form}>
        {[
          { key: 'name', label: t('auth.name'), opts: {} },
          { key: 'email', label: t('auth.email'), opts: { keyboardType: 'email-address', autoCapitalize: 'none' } },
          { key: 'farmName', label: t('auth.farmName'), opts: {} },
          { key: 'password', label: t('auth.password'), opts: { secureTextEntry: true } },
          { key: 'confirmPassword', label: t('auth.confirmPassword'), opts: { secureTextEntry: true } },
        ].map(({ key, label, opts }) => (
          <TextInput key={key} style={styles.input} placeholder={label} placeholderTextColor={Colors.textMuted}
            value={(form as any)[key]} onChangeText={v => update(key, v)} {...opts as any} />
        ))}
        <GradientButton title={t('auth.signUp')} onPress={handleSignup} loading={loading} style={{ marginTop: 8 }} />
        <TouchableOpacity style={styles.link} onPress={() => router.push('/auth/login')}>
          <Text style={styles.linkText}>{t('auth.alreadyRegistered')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  langToggle: { position: 'absolute', top: 60, right: 24, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Colors.surfaceBorder },
  langText: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13 },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center', fontFamily: 'Georgia', marginBottom: 8 },
  subtitle: { fontSize: 13, color: Colors.warning, textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 },
  form: { gap: 12 },
  input: { height: 52, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12, paddingHorizontal: 16, color: Colors.textPrimary, fontSize: 16 },
  link: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: Colors.primary, fontSize: 15 },
});
