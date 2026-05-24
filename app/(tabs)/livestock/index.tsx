import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useAuth } from '../../../src/context/AuthContext';
import { GlassCard } from '../../../src/components/GlassCard';
import { GradientButton } from '../../../src/components/GradientButton';
import { OfflineBanner } from '../../../src/components/OfflineBanner';
import { FloatingSosButton } from '../../../src/components/FloatingSosButton';
import { Colors, Spacing, Radius } from '../../../src/theme';

export default function LivestockScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddCamp, setShowAddCamp] = useState(false);
  const [campName, setCampName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/camps');
      setCamps(res.data || []);
    } catch { Alert.alert(t('common.error'), t('common.failedToLoad')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleAddCamp = async () => {
    if (!campName.trim()) return;
    setSaving(true);
    try {
      await api.post('/camps', { name: campName.trim() });
      setCampName('');
      setShowAddCamp(false);
      load();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('common.failedToSave'));
    } finally { setSaving(false); }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity onPress={() => router.push(`/(tabs)/livestock/camp/${item.id}`)}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.campName}>{item.name}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{item.current_count}</Text>
            <Text style={styles.countLabel}> {t('livestock.head')}</Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>{t('livestock.title')}</Text>
        <TouchableOpacity style={styles.vetBtn} onPress={() => router.push('/(tabs)/livestock/vet-visits')}>
          <Text style={styles.vetBtnText}>💉 {t('livestock.vetVisits')}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={camps}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🐄</Text>
            <Text style={styles.emptyText}>{t('livestock.noCamps')}</Text>
          </View>
        ) : null}
      />
      <View style={styles.fab}>
        <GradientButton title={`+ ${t('livestock.addCamp')}`} onPress={() => setShowAddCamp(true)} />
      </View>
      <FloatingSosButton />

      <Modal visible={showAddCamp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modal}>
            <Text style={styles.modalTitle}>{t('livestock.addCamp')}</Text>
            <TextInput
              style={styles.input}
              value={campName}
              onChangeText={setCampName}
              placeholder={t('livestock.campName')}
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddCamp(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <GradientButton title={saving ? t('common.loading') : t('common.save')} onPress={handleAddCamp} disabled={saving} style={styles.saveBtn} />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  vetBtn: { backgroundColor: Colors.primary + '22', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.sm },
  vetBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  campName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  countBadge: { flexDirection: 'row', alignItems: 'baseline' },
  countText: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  countLabel: { color: Colors.textSecondary, fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modal: { margin: Spacing.md, marginBottom: Spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  input: { backgroundColor: Colors.surface, color: Colors.text, borderRadius: Radius.sm, padding: Spacing.sm, fontSize: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: { flex: 1, padding: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm, backgroundColor: Colors.surface },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1 },
});
