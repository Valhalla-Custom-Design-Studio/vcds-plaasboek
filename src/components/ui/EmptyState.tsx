import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  accentColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon, title, subtitle, ctaLabel, onCta, accentColor = '#D97706',
}) => (
  <View style={styles.container}>
    {icon && <View style={styles.iconWrap}>{icon}</View>}
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {ctaLabel && onCta && (
      <TouchableOpacity style={[styles.btn, { borderColor: accentColor }]} onPress={onCta} activeOpacity={0.75}>
        <Text style={[styles.btnText, { color: accentColor }]}>{ctaLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888888', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
  btnText: { fontSize: 14, fontWeight: '600' },
});
