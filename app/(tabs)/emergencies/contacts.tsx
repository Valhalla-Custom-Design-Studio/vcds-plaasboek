import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { api } from '../../../src/services/api';
import { useLanguage } from '../../../src/context/LanguageContext';
import { GlassCard } from '../../../src/components/GlassCard';
import { GradientButton } from '../../../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../../../src/theme';

const CATEGORIES = ['saps','ambulance','fire','neighbourhood','friend','security','farmwatch','medical','family','other'];
const CAT_COLORS: Record<string, string> = {
  saps: '#1D4ED8', ambulance: '#DC2626', fire: '#EA580C', neighbourhood: '#7C3AED',
  friend: '#059669', security: '#0891B2', farmwatch: '#15803D', medical: '#DB2777', family: '#D97706', other: '#687280',
};

export default function ContactsScreen() {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', category: 'saps', relationship: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const res = await api.get('/emergency-contacts'); setContacts(res.data.items || []); }
    catch (err: any) { Alert.alert(t('common.error'), err.message); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', category: 'saps', relationship: '' }); setShowModal(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, phone: c.phone, category: c.category, relationship: c.relationship || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.phone) { Alert.alert(t('common.error'), t('validation.allRequired')); return; }
    setSaving(true);
    try {
      if (editing) await api.patch(`/emergency-contacts/${editing.id}`, form);
      else await api.post('/emergency-contacts', form);
      setShowModal(false);
      load();
    } catch (err: any) { Alert.alert(t('common.error'), err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('common.delete'), t('journal.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try { await api.delete(`/emergency-contacts/${id}`); load(); }
        catch (err: any) { Alert.alert(t('common.error'), err.message); }
      }},
    ]);
  };

  const handleTestSMS = async (phone: string) => {
    try { await api.post('/sos/test-sms', { phone }); Alert.alert(t('common.success'), t('contacts.testSmsSent')); }
    catch { Alert.alert(t('common.error'), t('contacts.testSmsFailed')); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('contacts.title')}</Text>
        <Text style={styles.count}>{contacts.length}/20</Text>
      </View>
      <FlatList
        data={contacts}
        keyExtractor={(i: any) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }: any) => (
          <GlassCard style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={[styles.catBadge, { backgroundColor: (CAT_COLORS[item.category] || '#687280') + '33' }]}>
                <Text style={[styles.catText, { color: CAT_COLORS[item.category] || '#687280' }]}>{t(`contacts.${item.category}`) || item.category}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity onPress={() => handleTestSMS(item.phone)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>📱</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>✏️</Text>
                </TouchableOpacity>
                {!item.is_default && (
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactPhone}>{item.phone}</Text>
          </GlassCard>
        )}
      />
      {contacts.length < 20 ? (
        <TouchableOpacity style={styles.fab} onPress={openAdd}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.maxBanner}><Text style={styles.maxText}>{t('contacts.max20')}</Text></View>
      )}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? t('contacts.editContact') : t('contacts.addContact')}</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder={t('contacts.contactName')} placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} placeholder={t('contacts.phone')} placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
            <View style={styles.catRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.catChip, form.category === c && { backgroundColor: Colors.primary }]} onPress={() => setForm(p => ({ ...p, category: c }))}>
                  <Text style={styles.catChipText}>{t(`contacts.${c}`) || c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <GradientButton title={t('common.save')} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, fontFamily: 'Georgia' },
  count: { color: Colors.textSecondary, fontSize: 16 },
  list: { padding: Spacing.md, paddingBottom: 120 },
  contactCard: { marginBottom: 10 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  catText: { fontSize: 12, fontWeight: '700' },
  contactActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  actionText: { fontSize: 18 },
  contactName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  contactPhone: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },
  maxBanner: { margin: 16, backgroundColor: Colors.warning + '33', borderRadius: Radius.md, padding: 12, alignItems: 'center' },
  maxText: { color: Colors.warning, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1A2E1F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { height: 52, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radius.md, paddingHorizontal: 16, color: Colors.textPrimary, fontSize: 16, marginBottom: 12 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  catChipText: { color: Colors.textPrimary, fontSize: 12 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surfaceBorder },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
});
