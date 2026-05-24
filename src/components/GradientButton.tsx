import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../theme';

interface Props {
  title: string; onPress: () => void; loading?: boolean;
  disabled?: boolean; style?: ViewStyle; variant?: 'primary' | 'danger';
}

export function GradientButton({ title, onPress, loading, disabled, style, variant = 'primary' }: Props) {
  const colors: [string, string] = variant === 'danger'
    ? [Colors.error, '#B91C1C']
    : [Colors.primary, Colors.primaryDark];
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[styles.wrapper, style]} activeOpacity={0.85}>
      <LinearGradient colors={colors} style={styles.gradient}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.text}>{title.toUpperCase()}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: Radius.md, overflow: 'hidden' },
  gradient: { height: 52, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  text: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
});
