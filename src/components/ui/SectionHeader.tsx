import React from 'react';
import { Text, StyleSheet } from 'react-native';

export const SectionHeader: React.FC<{ title: string; color?: string }> = ({ title, color = '#D97706' }) => (
  <Text style={[styles.header, { color }]}>{title}</Text>
);

const styles = StyleSheet.create({
  header: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8,
  },
});
