import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSubscription } from '../../src/hooks/useSubscription';
import { PaywallGate } from '../../src/components/PaywallGate';
import PatternLearnContent from '../../src/screens/PatternLearnContent';

export default function PatternLearnScreen() {
  const { tier } = useSubscription();
  return (
    <View style={s.container}>
      <PaywallGate
        required="platinum"
        currentTier={tier}
        subscribeRoute="/subscription"
        featureName="PatternLearn™"
        accentColor="#C9A84C"
      >
        <PatternLearnContent />
      </PaywallGate>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C1A0F' },
});
