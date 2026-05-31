import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PaywallGate } from '../../src/components/PaywallGate';

export default function Screen() {
  const router = useRouter();
  return (
    <PaywallGate
      appId="plaasboek"
      feature="advanced_reports"
      requiredTier="pro"
      accentColor="#16A34A"
      onUpgrade={() => router.push('/subscription')}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Gevorderde Verslae</Text>
      </View>
    </PaywallGate>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 16 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
});
