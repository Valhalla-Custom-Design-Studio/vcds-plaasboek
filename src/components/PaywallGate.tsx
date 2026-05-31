import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

interface PaywallGateProps {
  appId: string;
  feature: string;
  requiredTier: 'pro' | 'platinum' | 'elite' | 'starter' | 'business' | 'enterprise';
  accentColor?: string;
  onUpgrade?: () => void;
  children: React.ReactNode;
}

export function PaywallGate({
  appId,
  feature,
  requiredTier,
  accentColor = '#F59E0B',
  onUpgrade,
  children,
}: PaywallGateProps) {
  const { hasFeature, loading } = useSubscription(appId);

  if (loading) return null;
  if (hasFeature(feature)) return <>{children}</>;

  const tierLabels: Record<string, string> = {
    pro: 'Pro',
    platinum: 'Platinum',
    elite: 'Elite',
    starter: 'Starter',
    business: 'Business',
    enterprise: 'Enterprise',
  };

  return (
    <View style={styles.gate}>
      <Text style={[styles.lockIcon]}>🔒</Text>
      <Text style={styles.title}>
        {tierLabels[requiredTier] || requiredTier} Funksie
      </Text>
      <Text style={styles.subtitle}>
        Gradeer op na {tierLabels[requiredTier]} om hierdie funksie te gebruik.
      </Text>
      {onUpgrade && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: accentColor }]}
          onPress={onUpgrade}
        >
          <Text style={styles.btnText}>Gradeer Op</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  lockIcon: { fontSize: 48 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
});
