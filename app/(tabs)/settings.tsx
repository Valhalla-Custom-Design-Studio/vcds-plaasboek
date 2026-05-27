import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const strings = {
  en: { title: 'Settings', language: 'Language', afrikaans: 'Afrikaans', english: 'English', account: 'Account', logout: 'Log Out', subscription: 'Subscription', tier: 'Current Plan', free: 'Free', premium: 'Premium', upgrade: 'Upgrade to Premium', about: 'About', version: 'Version', privacy: 'Privacy Policy', terms: 'Terms of Service', logoutConfirm: 'Are you sure you want to log out?', yes: 'Yes', no: 'No', notifications: 'Notifications', pushEnabled: 'Push Notifications', offlineMode: 'Offline Mode', clearCache: 'Clear Cache', cacheCleared: 'Cache cleared' },
  af: { title: 'Instellings', language: 'Taal', afrikaans: 'Afrikaans', english: 'Engels', account: 'Rekening', logout: 'Teken Uit', subscription: 'Intekening', tier: 'Huidige Plan', free: 'Gratis', premium: 'Premium', upgrade: 'Opgradeer na Premium', about: 'Oor', version: 'Weergawe', privacy: 'Privaatheidsbeleid', terms: 'Diensbepalings', logoutConfirm: 'Is jy seker jy wil uitteken?', yes: 'Ja', no: 'Nee', notifications: 'Kennisgewings', pushEnabled: 'Stoot Kennisgewings', offlineMode: 'Vanlyn Modus', clearCache: 'Maak Kas Skoon', cacheCleared: 'Kas geskoonmaak' },
};

export default function Settings() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [tier, setTier] = useState('free');
  const router = useRouter();
  const t = strings[lang];

  useEffect(() => {
    AsyncStorage.getItem('lang').then(v => v && setLang(v as any));
    AsyncStorage.getItem('push_enabled').then(v => v !== null && setPushEnabled(v === 'true'));
    AsyncStorage.getItem('token').then(async token => {
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setTier(payload.tier ?? 'free');
        } catch {}
      }
    });
  }, []);

  const switchLang = (l: 'en'|'af') => { setLang(l); AsyncStorage.setItem('lang', l); };
  const togglePush = (v: boolean) => { setPushEnabled(v); AsyncStorage.setItem('push_enabled', String(v)); };

  const logout = () => {
    Alert.alert(t.logoutConfirm, '', [
      { text: t.no, style: 'cancel' },
      { text: t.yes, style: 'destructive', onPress: async () => {
        await AsyncStorage.multiRemove(['token', 'lang', 'push_enabled']);
        router.replace('/auth/login');
      }},
    ]);
  };

  const clearCache = async () => {
    await AsyncStorage.multiRemove(['plaasboek_records', 'plaasboek_records_ts', 'plaasboek_offline_queue', 'plaasboek_livestock', 'plaasboek_workers']);
    Alert.alert(t.cacheCleared);
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}><Text style={s.title}>{t.title}</Text></View>

      <Text style={s.sectionLabel}>{t.language}</Text>
      <View style={s.section}>
        <TouchableOpacity style={[s.row, lang === 'af' && s.rowActive]} onPress={() => switchLang('af')}>
          <Text style={s.rowLabel}>{t.afrikaans}</Text>
          {lang === 'af' && <Text style={s.check}>✓</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[s.row, lang === 'en' && s.rowActive]} onPress={() => switchLang('en')}>
          <Text style={s.rowLabel}>{t.english}</Text>
          {lang === 'en' && <Text style={s.check}>✓</Text>}
        </TouchableOpacity>
      </View>

      <Text style={s.sectionLabel}>{t.notifications}</Text>
      <View style={s.section}>
        <View style={s.row}>
          <Text style={s.rowLabel}>{t.pushEnabled}</Text>
          <Switch value={pushEnabled} onValueChange={togglePush} trackColor={{ true: '#92400e' }} />
        </View>
      </View>

      <Text style={s.sectionLabel}>{t.subscription}</Text>
      <View style={s.section}>
        <View style={s.row}>
          <Text style={s.rowLabel}>{t.tier}</Text>
          <Text style={[s.badge, tier === 'premium' ? s.badgePremium : s.badgeFree]}>{tier === 'premium' ? t.premium : t.free}</Text>
        </View>
        <TouchableOpacity style={s.upgradeBtn} onPress={() => router.push('/subscription')}>
          <Text style={s.upgradeTxt}>{tier !== 'free' ? t.subscription : t.upgrade}</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionLabel}>{t.account}</Text>
      <View style={s.section}>
        <TouchableOpacity style={s.row} onPress={clearCache}>
          <Text style={s.rowLabel}>{t.clearCache}</Text>
          <Text style={s.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.row, s.logoutRow]} onPress={logout}>
          <Text style={s.logoutTxt}>{t.logout}</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionLabel}>{t.about}</Text>
      <View style={s.section}>
        <View style={s.row}><Text style={s.rowLabel}>{t.version}</Text><Text style={s.rowValue}>1.0.0</Text></View>
        <TouchableOpacity style={s.row}><Text style={s.rowLabel}>{t.privacy}</Text><Text style={s.arrow}>›</Text></TouchableOpacity>
        <TouchableOpacity style={s.row}><Text style={s.rowLabel}>{t.terms}</Text><Text style={s.arrow}>›</Text></TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1007' },
  header: { padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fef3c7' },
  sectionLabel: { color: '#d97706', fontSize: 12, fontWeight: '600', marginHorizontal: 16, marginTop: 20, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  section: { backgroundColor: '#292524', marginHorizontal: 16, borderRadius: 10, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#3f3f46' },
  rowActive: { backgroundColor: '#3f2a1a' },
  rowLabel: { color: '#fef3c7', fontSize: 15 },
  rowValue: { color: '#78716c', fontSize: 14 },
  check: { color: '#f59e0b', fontSize: 18, fontWeight: 'bold' },
  arrow: { color: '#78716c', fontSize: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, fontSize: 12, fontWeight: '600' },
  badgeFree: { backgroundColor: '#334155', color: '#94a3b8' },
  badgePremium: { backgroundColor: '#92400e', color: '#fef3c7' },
  upgradeBtn: { margin: 12, padding: 14, borderRadius: 10, backgroundColor: '#92400e', alignItems: 'center' },
  upgradeTxt: { color: '#fff', fontWeight: 'bold' },
  logoutRow: { borderBottomWidth: 0 },
  logoutTxt: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
