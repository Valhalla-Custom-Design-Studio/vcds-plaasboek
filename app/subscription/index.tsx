import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../src/services/api';
import { PLAASBOEK_PLANS, PlaasboekTier } from '../../src/constants/tiers';

export default function SubscriptionScreen() {
  const [lang, setLang] = useState<'af' | 'en'>('af');
  const [loading, setLoading] = useState<string | null>(null);

  const subscribe = async (tier: PlaasboekTier) => {
    if (tier === 'free') { router.back(); return; }
    setLoading(tier);
    try {
      const res = await api.post('/payments/initiate', { tier });
      if (res.data.payment_url) {
        const { Linking } = require('react-native');
        await Linking.openURL(res.data.payment_url);
      }
    } catch {
      Alert.alert(lang === 'af' ? 'Fout' : 'Error', lang === 'af' ? 'Betaling kon nie begin nie.' : 'Payment could not be initiated.');
    } finally {
      setLoading(null);
    }
  };

  const plans = Object.values(PLAASBOEK_PLANS);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.langRow}>
        {(['af', 'en'] as const).map(l => (
          <TouchableOpacity key={l} onPress={() => setLang(l)} style={[s.langBtn, lang === l && s.langActive]}>
            <Text style={[s.langText, lang === l && s.langActiveText]}>{l.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.title}>{lang === 'af' ? 'Inskrywing' : 'Subscription'}</Text>
      <Text style={s.sub}>{lang === 'af' ? 'Bestuur jou plaas slimmer met Plaasboek™' : 'Manage your farm smarter with Plaasboek™'}</Text>
      {plans.map(plan => {
        const name = lang === 'af' ? plan.name_af : plan.name_en;
        const desc = lang === 'af' ? plan.description_af : plan.description_en;
        const features = lang === 'af' ? plan.features_af : plan.features_en;
        return (
          <View key={plan.id} style={[s.card, { borderColor: plan.color }, plan.recommended && s.recommended]}>
            {plan.recommended && (
              <View style={[s.badge, { backgroundColor: plan.color }]}>
                <Text style={s.badgeText}>{lang === 'af' ? '⭐ Gewild' : '⭐ Popular'}</Text>
              </View>
            )}
            <Text style={[s.tierName, { color: plan.color }]}>{name}</Text>
            <Text style={s.price}>{plan.price === 0 ? (lang === 'af' ? 'Gratis' : 'Free') : `R${plan.price}/maand`}</Text>
            <Text style={s.desc}>{desc}</Text>
            {features.map(f => <Text key={f} style={s.feature}>✓ {f}</Text>)}
            <TouchableOpacity style={[s.btn, { backgroundColor: plan.color }]} onPress={() => subscribe(plan.id)} disabled={loading === plan.id}>
              {loading === plan.id ? <ActivityIndicator color="#fff" /> : (
                <Text style={s.btnText}>{plan.price === 0 ? (lang === 'af' ? 'Gratis Begin' : 'Start Free') : (lang === 'af' ? 'Opgradeer' : 'Upgrade')}</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 40 },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 12 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#555' },
  langActive: { backgroundColor: '#2D5016', borderColor: '#2D5016' },
  langText: { color: '#888', fontWeight: '600', fontSize: 12 },
  langActiveText: { color: '#fff' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24 },
  card: { backgroundColor: '#111', borderWidth: 2, borderRadius: 16, padding: 20, marginBottom: 16 },
  recommended: { shadowColor: '#2D5016', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 8 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  tierName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  price: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  desc: { fontSize: 13, color: '#888', marginBottom: 12, lineHeight: 18 },
  feature: { fontSize: 14, color: '#ccc', marginBottom: 4 },
  btn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
