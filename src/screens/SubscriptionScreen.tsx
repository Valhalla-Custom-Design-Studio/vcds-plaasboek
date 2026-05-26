import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { TIERS, Tier } from '../constants/tiers';

interface SubscriptionScreenProps {
  currentTier?: Tier;
  onSubscribe?: (tier: Tier) => void;
}

export default function SubscriptionScreen({ currentTier = 'world', onSubscribe }: SubscriptionScreenProps) {
  const [loading, setLoading] = useState<Tier | null>(null);

  const PAYFAST_MERCHANT_ID = '11910323';
  const PAYFAST_MERCHANT_KEY = 'f61uspt7vtdta';

  const handleSubscribe = async (tier: Tier) => {
    if (tier === 'world') {
      onSubscribe?.(tier);
      return;
    }
    setLoading(tier);
    try {
      const amount = TIERS[tier].price.toFixed(2);
      const payfastUrl = `https://www.payfast.co.za/eng/process?merchant_id=${PAYFAST_MERCHANT_ID}&merchant_key=${PAYFAST_MERCHANT_KEY}&amount=${amount}&item_name=VCDS+${TIERS[tier].name}+Subscription&custom_str2=${tier}`;
      // In production: open in WebView, handle return_url webhook
      onSubscribe?.(tier);
    } catch (e) {
      Alert.alert('Error', 'Could not initiate payment. Try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Choose Your Plan</Text>
      <Text style={styles.subheading}>Upgrade for more AI power & features</Text>
      {(Object.keys(TIERS) as Tier[]).map((tier) => {
        const t = TIERS[tier];
        const isActive = currentTier === tier;
        return (
          <View key={tier} style={[styles.card, isActive && styles.activeCard, { borderColor: t.color }]}>
            <View style={[styles.badge, { backgroundColor: t.color }]}>
              <Text style={styles.badgeText}>{t.name}</Text>
            </View>
            <Text style={styles.price}>
              {t.price === 0 ? 'Free' : `R${t.price}/month`}
            </Text>
            {t.features.map((f) => (
              <Text key={f} style={styles.feature}>✓ {f}</Text>
            ))}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: t.color }, isActive && styles.activeButton]}
              onPress={() => handleSubscribe(tier)}
              disabled={isActive || loading === tier}
            >
              {loading === tier ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{isActive ? 'Current Plan' : `Get ${t.name}`}</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 4, color: '#1F2937' },
  subheading: { fontSize: 15, textAlign: 'center', color: '#6B7280', marginBottom: 24 },
  card: { borderWidth: 2, borderRadius: 16, padding: 20, marginBottom: 20, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  activeCard: { shadowOpacity: 0.15, elevation: 6 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  price: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  feature: { fontSize: 14, color: '#374151', marginBottom: 6 },
  button: { marginTop: 16, padding: 14, borderRadius: 10, alignItems: 'center' },
  activeButton: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
