import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, RefreshControl, TextInput, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useAuth } from '../../../src/context/AuthContext';
import { GlassCard } from '../../../src/components/GlassCard';
import { GradientButton } from '../../../src/components/GradientButton';
import { OfflineBanner } from '../../../src/components/OfflineBanner';
import { FloatingSosButton } from '../../../src/components/FloatingSosButton';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { PlatinumCard } from '../../../src/components/ui/PlatinumCard';
import { Colors, Spacing, Radius, Shadow } from '../../../src/theme';

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
    <TouchableOpacity onPress={() => router.push(`/(tabs)/livestock/camp/${item.id}` as any)}>
      <PlatinumCard style={styles.card} accentColor={Colors.primary}>
        <View style={styles.row}>
          <View>
            <Text style={styles.campName}>{item.name}</Text>
            <Text style={styles.campSub}>Kamp</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{item.current_count}</Text>
            <Text style={styles.countLabel}> {t('livestock.head')}</Text>
          </View>
        </View>
      </PlatinumCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <LinearGradient colors={['#0C1A0F', '#132218']} style={styles.header}>
        <Text style={styles.title}>{t('livestock.title')}</Text>
        <TouchableOpacity
          style={styles.vetBtn}
          onPress={() => router.push('/(tabs)/livestock/vet-visits' as any)}
        >
          <Text style={styles.vetBtnText}>💉 {t('livestock.vetVisits')}</Text>
        </TouchableOpacity>
      </LinearGradient>
      <FlatList
        data={camps}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={!loading ? (
          <EmptyState
            emoji="🐄"
            title={t('livestock.noCamps')}
            subtitle="Voeg jou eerste kamp by om jou veestapel te bestuur."
            ctaLabel="+ Voeg Kamp By"
            onCta={() => setShowAddCamp(true)}
            accentColor={Colors.primary}
          />
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
              <GradientButton
                title={saving ? t('common.loading') : t('common.save')}
                onPress={handleAddCamp}
                disabled={saving}
                style={styles.saveBtn}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: 52, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#F0FDF4' },
  vetBtn: {
    backgroundColor: (Colors.primary || '#15803D') + '22',
    paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.sm,
  },
  vetBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 120, paddingTop: 8 },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  campName: { fontSize: 18, fontWeight: '700', color: '#F0FDF4' },
  campSub: { color: '#86EFAC', fontSize: 12, marginTop: 2 },
  countBadge: { flexDirection: 'row', alignItems: 'baseline' },
  countText: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  countLabel: { color: '#86EFAC', fontSize: 13 },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modal: { margin: Spacing.md, marginBottom: Spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F0FDF4', marginBottom: Spacing.md },
  input: {
    backgroundColor: Colors.surface, color: '#F0FDF4', borderRadius: Radius.sm,
    padding: Spacing.sm, fontSize: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: { flex: 1, padding: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm, backgroundColor: Colors.surface },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1 },
});
