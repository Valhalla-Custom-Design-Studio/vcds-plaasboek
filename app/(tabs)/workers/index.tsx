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

export default function WorkersScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/workers');
      setWorkers(res.data || []);
    } catch { Alert.alert(t('common.error'), t('common.failedToLoad')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!name.trim() || !idNumber.trim() || !position.trim()) { Alert.alert(t('common.error'), 'Vul alle velde in'); return; }
    if (idNumber.length !== 13) { Alert.alert(t('common.error'), 'SA ID moet 13 syfers wees'); return; }
    setSaving(true);
    try {
      await api.post('/workers', { name, idNumber, position });
      setName(''); setIdNumber(''); setPosition('');
      setShowAdd(false);
      load();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('common.failedToSave'));
    } finally { setSaving(false); }
  };

  const isAdmin = user?.role === 'admin';

  const renderItem = ({ item }: any) => (
    <TouchableOpacity onPress={() => router.push(`/(tabs)/workers/worker/${item.id}`)}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.workerName}>{item.name}</Text>
            <Text style={styles.position}>{item.position}</Text>
          </View>
          <Text style={styles.idNumber}>{item.id_number?.slice(0, 6)}*****</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.workers')}</Text>
      </View>

      {isAdmin && (
        <GlassCard style={styles.adminCard}>
          <Text style={styles.adminTitle}>⚙️ Admin</Text>
          <View style={styles.adminRow}>
            <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/(tabs)/workers/admin-users')}>
              <Text style={styles.adminBtnText}>👥 Gebruikers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/(tabs)/workers/admin-sos')}>
              <Text style={styles.adminBtnText}>🆘 SOS Gebeure</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      )}

      <FlatList
        data={workers}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👷</Text>
            <Text style={styles.emptyText}>Geen werkers nie</Text>
          </View>
        ) : null}
      />
      <View style={styles.fab}>
        <GradientButton title="+ Voeg Werker By" onPress={() => setShowAdd(true)} />
      </View>
      <FloatingSosButton />

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modal}>
            <Text style={styles.modalTitle}>Voeg Werker By</Text>
            {[
              { label: 'Naam', value: name, set: setName, placeholder: 'Volle naam' },
              { label: 'SA ID Nommer', value: idNumber, set: setIdNumber, placeholder: '13 syfers', keyboard: 'number-pad' as const },
              { label: 'Posisie', value: position, set: setPosition, placeholder: 'bv. Plaaswerker' },
            ].map(({ label, value, set, placeholder, keyboard }) => (
              <View key={label}>
                <Text style={styles.inputLabel}>{label}</Text>
                <TextInput style={styles.input} value={value} onChangeText={set} placeholder={placeholder} placeholderTextColor={Colors.textSecondary} keyboardType={keyboard} />
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <GradientButton title={saving ? t('common.loading') : t('common.save')} onPress={handleAdd} disabled={saving} style={styles.saveBtn} />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.md },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  adminCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  adminTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  adminRow: { flexDirection: 'row', gap: Spacing.sm },
  adminBtn: { flex: 1, backgroundColor: Colors.primary + '22', borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  adminBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workerName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  position: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  idNumber: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'monospace' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modal: { margin: Spacing.md, marginBottom: Spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  inputLabel: { color: Colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginTop: Spacing.sm },
  input: { backgroundColor: Colors.surface, color: Colors.text, borderRadius: Radius.sm, padding: Spacing.sm, fontSize: 16, borderWidth: 1, borderColor: Colors.border },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { flex: 1, padding: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm, backgroundColor: Colors.surface },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1 },
});
