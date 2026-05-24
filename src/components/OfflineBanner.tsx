import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';
import { useOffline } from '../context/OfflineContext';

interface Props {
  isOnline?: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
}

export function OfflineBanner(props: Props) {
  // Allow both prop-driven and context-driven usage
  const ctx = useOffline();
  const isOnline = props.isOnline !== undefined ? props.isOnline : ctx.isOnline;
  const isSyncing = props.isSyncing !== undefined ? props.isSyncing : ctx.isSyncing;
  const pendingCount = props.pendingCount !== undefined ? props.pendingCount : ctx.pendingCount;

  if (isOnline && !isSyncing && pendingCount === 0) return null;

  let message = '';
  let bgColor = Colors.warning;

  if (!isOnline) {
    message = pendingCount > 0
      ? `📵 Offline — ${pendingCount} item${pendingCount > 1 ? 's' : ''} queued`
      : '📵 Offline — changes will sync when connected';
    bgColor = Colors.error;
  } else if (isSyncing) {
    message = `🔄 Syncing ${pendingCount} item${pendingCount > 1 ? 's' : ''}...`;
    bgColor = Colors.primary;
  }

  return (
    <View style={[styles.banner, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
