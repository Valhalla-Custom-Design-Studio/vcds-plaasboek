import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOffline } from '../context/OfflineContext';
import { useLanguage } from '../context/LanguageContext';
import { Colors } from '../theme';

export function OfflineBanner() {
  const { isOnline, isSyncing } = useOffline();
  const { t } = useLanguage();
  if (isOnline && !isSyncing) return null;
  return (
    <View style={[styles.banner, isSyncing ? styles.syncing : styles.offline]}>
      <Text style={styles.text}>{isSyncing ? t('offline.syncing') : t('offline.banner')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingVertical: 6, paddingHorizontal: 16, alignItems: 'center' },
  offline: { backgroundColor: Colors.warning },
  syncing: { backgroundColor: Colors.primary },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
