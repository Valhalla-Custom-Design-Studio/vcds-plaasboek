import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatZAR } from '../utils/formatZAR';
import { t } from '../i18n';

export interface TierFeature { label: string; included: boolean; }
export interface TierCardProps {
  name: string; price: number; period?: string; features: TierFeature[];
  isRecommended?: boolean; isSelected?: boolean; onSelect: () => void; testID?: string;
}

const TierCard: React.FC<TierCardProps> = ({
  name, price, period = 'month', features, isRecommended, isSelected, onSelect, testID
}) => {
  const accessLabel = `${name} plan, ${formatZAR(price)} per ${period}. ${
    isSelected ? 'Currently selected.' : 'Tap to select.'
  } ${isRecommended ? 'Recommended plan.' : ''}`;
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selected, isRecommended && styles.recommended]}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityLabel={accessLabel}
      accessibilityState={{ checked: isSelected }}
      testID={testID ?? `tier-card-${name.toLowerCase()}`}
    >
      {isRecommended && (
        <View style={styles.badge} accessibilityElementsHidden>
          <Text style={styles.badgeText}>RECOMMENDED</Text>
        </View>
      )}
      <Text style={styles.tierName}>{name}</Text>
      <Text style={styles.price} accessibilityElementsHidden>
        {formatZAR(price)}<Text style={styles.period}>/{period}</Text>
      </Text>
      <View style={styles.features}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow} accessibilityElementsHidden>
            <Text style={[styles.featureIcon, !f.included && styles.excluded]}>{f.included ? '✓' : '✗'}</Text>
            <Text style={[styles.featureLabel, !f.included && styles.excludedText]}>{f.label}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={[styles.cta, isSelected && styles.ctaSelected]} onPress={onSelect}
        accessibilityRole="button" accessibilityLabel={isSelected ? `${name} selected` : `Select ${name} plan`}>
        <Text style={styles.ctaText}>{isSelected ? '✓ Selected' : t('payment.subscribe')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0', padding: 20, marginVertical: 8, backgroundColor: '#FFF' },
  selected: { borderColor: '#1A1A2E', backgroundColor: '#F0F4FF' },
  recommended: { borderColor: '#C0392B' },
  badge: { backgroundColor: '#C0392B', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  tierName: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  price: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
  period: { fontSize: 14, fontWeight: '400', color: '#666' },
  features: { marginVertical: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  featureIcon: { color: '#27AE60', fontWeight: '700', marginRight: 8, width: 16 },
  excluded: { color: '#BDC3C7' },
  featureLabel: { fontSize: 14, color: '#333' },
  excludedText: { color: '#BDC3C7' },
  cta: { backgroundColor: '#1A1A2E', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  ctaSelected: { backgroundColor: '#27AE60' },
  ctaText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

export default TierCard;
