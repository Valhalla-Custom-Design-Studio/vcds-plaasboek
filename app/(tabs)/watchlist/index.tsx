import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/auth';

type WatchlistEntry = {
  id: string; type: 'vehicle' | 'person' | 'farm';
  identifier: string; description: string; reason: string;
  reportedBy: string; createdAt: string; status: 'active' | 'resolved';
  district: string;
};

export default function WatchlistScreen() {
  const { token } = useAuthStore();
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | 'vehicle' | 'person' | 'farm'>('all');
  const [form, setForm] = useState({ type: 'vehicle', identifier: '', description: '', reason: '', district: '' });

  const fetchEntries = async () => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/watchlist?type=${filter === 'all' ? '' : filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setEntries(json.entries || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchEntries(); }, [filter]);

  const addEntry = async () => {
    if (!form.identifier || !form.reason) { Alert.alert('Vul alle velde in'); return; }
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/watchlist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowAdd(false);
      setForm({ type: 'vehicle', identifier: '', description: '', reason: '', district: '' });
      fetchEntries();
    } catch { Alert.alert('Kon nie voeg nie'); }
  };

  const markResolved = async (id: string) => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/watchlist/${id}/resolve`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      });
      fetchEntries();
    } catch {}
  };

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Alles' }, { key: 'vehicle', label: 'Voertuig' },
    { key: 'person', label: 'Persoon' }, { key: 'farm', label: 'Plaas' },
  ];

  const typeIcon = (type: string) => ({ vehicle: '🚗', person: '👤', farm: '🏚️' }[type] || '⚠️');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Waglys</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Rapporteer</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Gemeenskap waaksaamheidsnetwerk</Text>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} style={[styles.filterBtn, filter === f.key && styles.filterActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEntries(); }} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <View style={[styles.card, item.status === 'resolved' && styles.cardResolved]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{typeIcon(item.type)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardId}>{item.identifier}</Text>
                  <Text style={styles.cardDistrict}>{item.district}</Text>
                </View>
                <View style={[styles.badge, item.status === 'resolved' ? styles.badgeResolved : styles.badgeActive]}>
                  <Text style={styles.badgeText}>{item.status === 'resolved' ? 'Opgelos' : 'Aktief'}</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <Text style={styles.cardReason}>⚠️ {item.reason}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardReporter}>Gerapporteer deur {item.reportedBy}</Text>
                {item.status === 'active' && (
                  <TouchableOpacity onPress={() => markResolved(item.id)}>
                    <Text style={styles.resolveText}>Opgelos ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Geen aktiewe waglys inskrywings nie</Text></View>}
        />
      )}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rapporteer Verdagte</Text>
            {['vehicle', 'person', 'farm'].map((t) => (
              <TouchableOpacity key={t} style={[styles.typeBtn, form.type === t && styles.typeBtnActive]} onPress={() => setForm((f) => ({ ...f, type: t }))}>
                <Text style={styles.typeBtnText}>{typeIcon(t)} {t === 'vehicle' ? 'Voertuig' : t === 'person' ? 'Persoon' : 'Plaas'}</Text>
              </TouchableOpacity>
            ))}
            {[
              ['Identifiseerder (nomplaat, naam, ens.)', 'identifier'],
              ['Beskrywing', 'description'],
              ['Rede vir vermoede', 'reason'],
              ['Distrik', 'district'],
            ].map(([placeholder, key]) => (
              <TextInput key={key} style={styles.input} placeholder={placeholder} placeholderTextColor={Colors.muted}
                value={(form as any)[key]} onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))} />
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.submitBtn} onPress={addEntry}><Text style={styles.submitBtnText}>Stuur</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}><Text style={styles.cancelBtnText}>Kanselleer</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  subtitle: { fontSize: 12, color: Colors.muted, paddingHorizontal: 16, marginBottom: 12 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.card },
  filterActive: { backgroundColor: Colors.primary },
  filterText: { color: Colors.text, fontSize: 13 },
  filterTextActive: { color: '#000', fontWeight: '600' },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10 },
  cardResolved: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  cardIcon: { fontSize: 24 },
  cardId: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardDistrict: { fontSize: 12, color: Colors.muted },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeActive: { backgroundColor: '#3a1a1a' },
  badgeResolved: { backgroundColor: '#1a3a1a' },
  badgeText: { fontSize: 11, fontWeight: '600', color: Colors.text },
  cardDesc: { fontSize: 14, color: Colors.text, marginBottom: 4 },
  cardReason: { fontSize: 13, color: '#f87171', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardReporter: { fontSize: 11, color: Colors.muted },
  resolveText: { color: '#4ade80', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.muted, fontSize: 15 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  typeBtn: { backgroundColor: Colors.card, borderRadius: 10, padding: 12, marginBottom: 8 },
  typeBtnActive: { backgroundColor: Colors.primary },
  typeBtnText: { color: Colors.text, fontWeight: '600' },
  input: { backgroundColor: Colors.card, borderRadius: 10, padding: 12, color: Colors.text, marginBottom: 10 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  submitBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#000', fontWeight: '700' },
  cancelBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: Colors.text, fontWeight: '600' },
});
