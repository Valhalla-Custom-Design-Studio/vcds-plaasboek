import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../theme';

interface Plan {
  id: string;
  name: string;
  tier_name: string;
  price_zar: number;
  description: string;
  features: string[];
}

interface Props {
  plan: Plan;
  isCurrentPlan: boolean;
  onSelect: (planId: string) => void;
}

export function TierCard({ plan, isCurrentPlan, onSelect }: Props) {
  const isPro = plan.tier_name === 'pro';
  return (
    <View style={[styles.card, isPro && styles.proBorder, isCurrentPlan && styles.activeBorder]}>
      {isPro && <View style={styles.badge}><Text style={styles.badgeText}>PRO</Text></View>}
      <Text style={styles.name}>{plan.name}</Text>
      <Text style={styles.price}>
        {plan.price_zar === 0 ? 'Gratis' : `R${plan.price_zar}/maand`}
      </Text>
      <Text style={styles.desc}>{plan.description}</Text>
      {plan.features.map((f, i) => (
        <Text key={i} style={styles.feature}>✓ {f}</Text>
      ))}
      {!isCurrentPlan && (
        <TouchableOpacity style={[styles.btn, isPro && styles.proBtn]} onPress={() => onSelect(plan.id)}>
          <Text style={styles.btnText}>{isPro ? 'Opgradeer na Pro' : 'Kies Free'}</Text>
        </TouchableOpacity>
      )}
      {isCurrentPlan && (
        <View style={styles.currentBadge}><Text style={styles.currentText}>✓ Huidige Plan</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 20, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 16 },
  proBorder: { borderColor: Colors.gold },
  activeBorder: { borderColor: Colors.primary, borderWidth: 2 },
  badge: { backgroundColor: Colors.gold, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, marginBottom: 8 },
  badgeText: { color: '#000', fontWeight: '800', fontSize: 11 },
  name: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  price: { color: Colors.primaryLight, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  desc: { color: Colors.textMuted, fontSize: 13, marginBottom: 12 },
  feature: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4 },
  btn: { marginTop: 16, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  proBtn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  currentBadge: { marginTop: 16, backgroundColor: Colors.primaryDark, borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center' },
  currentText: { color: Colors.primaryLight, fontWeight: '700' },
});
