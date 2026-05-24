import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Colors, Radius } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'outline';
  style?: ViewStyle;
}

export function GradientButton({ title, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const bg = variant === 'danger' ? Colors.error : variant === 'outline' ? 'transparent' : Colors.primary;
  const border = variant === 'outline' ? Colors.primary : 'transparent';
  const textColor = variant === 'outline' ? Colors.primary : '#fff';

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg, borderColor: border, borderWidth: variant === 'outline' ? 1.5 : 0 }, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  text: { fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
