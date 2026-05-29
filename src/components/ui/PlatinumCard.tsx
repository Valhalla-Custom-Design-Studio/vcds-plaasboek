import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface PlatinumCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
  glow?: boolean;
}

export const PlatinumCard: React.FC<PlatinumCardProps> = ({ children, style, accentColor, glow = false }) => (
  <View style={[
    styles.card,
    accentColor && { borderColor: `${accentColor}33`, borderWidth: 1 },
    glow && accentColor && {
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    style,
  ]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
