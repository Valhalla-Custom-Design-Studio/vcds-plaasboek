/**
 * VCDS™ PaywallGate — Inline feature gate component
 * Usage: <PaywallGate required="pro" subscribeRoute="/subscribe">
 *          <LockedFeature />
 *        </PaywallGate>
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { VCDSTier } from '../hooks/useSubscription';

interface PaywallGateProps {
  required: VCDSTier;
  currentTier: VCDSTier;
  subscribeRoute?: string;
  featureName?: string;
  children: React.ReactNode;
  accentColor?: string;
}

const TIER_RANK: Record<VCDSTier, number> = { free: 0, pro: 1, platinum: 2 };

export function PaywallGate({
  required, currentTier, subscribeRoute = '/subscribe',
  featureName, children, accentColor = '#C9A84C',
}: PaywallGateProps) {
  const router = useRouter();
  const hasAccess = TIER_RANK[currentTier] >= TIER_RANK[required];
  if (hasAccess) return <>{children}</>;

  const tierLabel = required === 'pro' ? 'Pro' : 'Platinum';

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
        style={styles.overlay}
      >
        <Ionicons name="lock-closed" size={32} color={accentColor} />
        <Text style={[styles.title, { color: accentColor }]}>
          {featureName ? `${featureName} — ` : ''}{tierLabel} Funksie
        </Text>
        <Text style={styles.sub}>
          Gradeer op na {tierLabel} om toegang te kry tot hierdie funksie.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: accentColor }]}
          onPress={() => router.push(subscribeRoute as any)}
        >
          <Text style={styles.btnText}>Gradeer Op →</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden', borderRadius: 16 },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: 24, borderRadius: 16, minHeight: 180,
  },
  title: { fontSize: 18, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  sub: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  btn: {
    marginTop: 16, paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 24, alignItems: 'center',
  },
  btnText: { color: '#000', fontWeight: '700', fontSize: 14 },
});
