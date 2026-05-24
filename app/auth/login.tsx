import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { GradientButton } from '../../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert(t('common.error'), t('validation.allRequired')); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/journal');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
        <Text style={styles.langText}>{language === 'af' ? 'EN' : 'AF'}</Text>
      </TouchableOpacity>
      <Text style={styles.logo}>🌾</Text>
      <Text style={styles.title}>Plaasboek</Text>
      <Text style={styles.tagline}>Jou plaas. Jou data. Jou veiligheid.</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder={t('auth.email')} placeholderTextColor={Colors.textMuted}
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder={t('auth.password')} placeholderTextColor={Colors.textMuted}
          value={password} onChangeText={setPassword} secureTextEntry />
        <GradientButton title={t('auth.signIn')} onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />
        <TouchableOpacity style={styles.link} onPress={() => router.push('/auth/register')}>
          <Text style={styles.linkText}>{t('auth.noAccount')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  langToggle: { position: 'absolute', top: 60, right: 24, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.surfaceBorder },
  langText: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13 },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 36, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center', fontFamily: 'Georgia' },
  tagline: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 40 },
  form: { gap: 12 },
  input: { height: 52, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radius.md, paddingHorizontal: 16, color: Colors.textPrimary, fontSize: 16 },
  link: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: Colors.primary, fontSize: 15 },
});
