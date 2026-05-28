import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { trackEvent } from '../../src/lib/posthog';

const TIERS = {
  free: { label: 'Gratis', color: '#888', icon: 'leaf-outline' as const },
  pro: { label: 'Pro', color: '#FFD700', icon: 'star' as const },
};

interface Plan {
  id: string;
  name: string;
  tier_name: 'free' | 'pro';
  price_zar: number;
  features: string[];
}

interface Subscription {
  plan_name: string;
  price_zar: number;
  status: string;
  expires_at: string;
}

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/current'),
      ]);
      setPlans(plansRes.data.plans || []);
      setSubscription(subRes.data.subscription || null);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpgrade = async (plan: Plan) => {
    setPaying(plan.id);
    trackEvent('subscription_upgrade_tapped', { plan_id: plan.id, tier: plan.tier_name });
    try {
      const res = await api.post('/payments/initiate', { plan_id: plan.id });
      const url: string = res.data.payment_url;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Fout', 'Kan nie betaalblad oopmaak nie. Probeer weer.');
      }
    } catch {
      Alert.alert('Fout', 'Betaling kon nie begin nie. Probeer asseblief weer.');
    } finally {
      setPaying(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color="#2D5016" />
      </SafeAreaView>
    );
  }

  const currentTier = (user as any)?.tier || 'free';
  const tierMeta = TIERS[currentTier as keyof typeof TIERS] ?? TIERS.free;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.title}>Inskrywing</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Current plan badge */}
        <View style={s.currentBadge}>
          <Ionicons name={tierMeta.icon} size={22} color={tierMeta.color} />
          <Text style={s.currentLabel}>
            Huidige plan:{' '}
            <Text style={[s.currentTier, { color: tierMeta.color }]}>
              {tierMeta.label}
            </Text>
          </Text>
        </View>

        {/* Active subscription info */}
        {subscription && (
          <View style={s.subInfo}>
            <Text style={s.subInfoText}>
              Volgende faktuur: {new Date(subscription.expires_at).toLocaleDateString('af-ZA')}
            </Text>
            <Text style={[s.subInfoText, { color: subscription.status === 'active' ? '#4CAF50' : '#F44336' }]}>
              Status: {subscription.status === 'active' ? 'Aktief' : subscription.status}
            </Text>
          </View>
        )}

        {/* Plans */}
        {plans.map((plan) => {
          const meta = TIERS[plan.tier_name] ?? TIERS.free;
          const isCurrent = plan.tier_name === currentTier;
          const isFree = plan.price_zar === 0;

          return (
            <View key={plan.id} style={[s.planCard, isCurrent && s.planCardActive]}>
              <View style={s.planHeader}>
                <Ionicons name={meta.icon} size={28} color={meta.color} />
                <Text style={[s.planName, { color: meta.color }]}>{plan.name}</Text>
              </View>
              <Text style={s.planPrice}>
                {isFree ? 'Gratis' : `R${Number(plan.price_zar).toFixed(2)}/maand`}
              </Text>
              {plan.features?.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
              {!isCurrent && !isFree && (
                <TouchableOpacity
                  style={[s.upgradeBtn, paying === plan.id && s.upgradeBtnDisabled]}
                  onPress={() => handleUpgrade(plan)}
                  disabled={!!paying}
                >
                  {paying === plan.id
                    ? <ActivityIndicator size="small" color="#0C1A0F" />
                    : <Text style={s.upgradeBtnText}>Opgradeer na {plan.name}</Text>
                  }
                </TouchableOpacity>
              )}
              {isCurrent && (
                <View style={s.currentChip}>
                  <Text style={s.currentChipText}>✓ Huidige Plan</Text>
                </View>
              )}
            </View>
          );
        })}

        <Text style={s.disclaimer}>
          Betalings word veilig verwerk deur PayFast. Kanselleer enige tyd.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C1A0F' },
  center: { flex: 1, backgroundColor: '#0C1A0F', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  currentBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A2E1A', borderRadius: 12, padding: 12, marginBottom: 16 },
  currentLabel: { color: '#ccc', fontSize: 14 },
  currentTier: { fontWeight: '700' },
  subInfo: { backgroundColor: '#1A2E1A', borderRadius: 10, padding: 12, marginBottom: 20 },
  subInfoText: { color: '#aaa', fontSize: 13, marginBottom: 4 },
  planCard: { backgroundColor: '#1A2E1A', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2D5016' },
  planCardActive: { borderColor: '#FFD700', borderWidth: 2 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  planName: { fontSize: 18, fontWeight: '700' },
  planPrice: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText: { color: '#ccc', fontSize: 13, flex: 1 },
  upgradeBtn: { backgroundColor: '#2D5016', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  upgradeBtnDisabled: { opacity: 0.5 },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  currentChip: { backgroundColor: '#2D5016', borderRadius: 8, padding: 8, alignItems: 'center', marginTop: 10 },
  currentChipText: { color: '#4CAF50', fontWeight: '600', fontSize: 13 },
  disclaimer: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 8 },
});
