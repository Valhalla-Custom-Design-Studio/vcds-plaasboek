import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSubscription } from '../src/hooks/useSubscription';
import { PaywallGate } from '../src/components/PaywallGate';
import AgriScoreContent from '../src/screens/AgriScoreContent';

export default function AgriScoreScreen() {
  const { tier } = useSubscription();
  return (
    <View style={s.container}>
      <PaywallGate
        required="pro"
        currentTier={tier}
        subscribeRoute="/subscription"
        featureName="AgriScore™"
        accentColor="#16A34A"
      >
        <AgriScoreContent />
      </PaywallGate>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C1A0F' },
});
