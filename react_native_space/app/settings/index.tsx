import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import api from '../../src/services/api';

export default function SettingsScreen() {
  const { user, logout, lang, setLang } = useAuth();
  const [rainfall, setRainfall] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRain, setNewRain] = useState({ date: new Date().toISOString().split('T')[0], mm: '' });

  useEffect(() => {
    Promise.all([
      api.get('/api/rainfall').then(r => setRainfall(r.data.entries || [])),
      api.get('/api/emergency-contacts').then(r => setContacts(r.data.contacts || [])),
      api.get('/api/subscriptions/current').then(r => setSubscription(r.data.subscription)),
      api.get('/api/subscriptions/plans').then(r => setPlans(r.data.plans || [])),
    ]).catch(console.error);
  }, []);

  const addRainfall = async () => {
    if (!newRain.mm) { Alert.alert('Fout', 'Voer mm in'); return; }
    try {
      await api.post('/api/rainfall', { date: newRain.date, mm: parseFloat(newRain.mm) });
      const res = await api.get('/api/rainfall');
      setRainfall(res.data.entries || []);
      setNewRain(r => ({ ...r, mm: '' }));
    } catch { Alert.alert('Fout', 'Stoor misluk'); }
  };

  const upgrade = async (planId: string) => {
    setLoading(true);
    try {
      const res = await api.post('/api/payments/initiate', { plan_id: planId });
      Alert.alert('Betaling', `Gaan na: ${res.data.payment_url}\n\nKopieer die URL en maak in jou blaaier oop.`);
    } catch { Alert.alert('Fout', 'Betaling misluk'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Teken Uit', 'Is jy seker?', [
      { text: 'Kanselleer', style: 'cancel' },
      { text: 'Teken Uit', style: 'destructive', onPress: async () => { await logout(); router.replace('/auth/login'); } },
    ]);
  };

  return (
    <ScrollView style={s.container}>
      {/* Profile */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>👤 Profiel</Text>
        <View style={s.row}><Text style={s.rowLabel}>Naam</Text><Text style={s.rowVal}>{user?.name}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>E-pos</Text><Text style={s.rowVal}>{user?.email}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Plaas</Text><Text style={s.rowVal}>{user?.farmName || '—'}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Tier</Text>
          <View style={[s.tierBadge, { backgroundColor: user?.tier === 'pro' ? '#FFD700' : '#ccc' }]}>
            <Text style={s.tierText}>{user?.tier?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Language */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>🌐 Taal / Language</Text>
        <View style={s.langRow}>
          <Text style={s.langLabel}>Afrikaans</Text>
          <Switch value={lang === 'af'} onValueChange={v => setLang(v ? 'af' : 'en')} trackColor={{ true: '#2D5016' }} />
          <Text style={s.langLabel}>English</Text>
        </View>
      </View>

      {/* Rainfall */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>🌧️ Reënval</Text>
        <View style={s.rainInput}>
          <TextInput style={[s.input, { flex: 1 }]} value={newRain.date} onChangeText={v => setNewRain(r => ({...r, date: v}))} placeholder="JJJJ-MM-DD" />
          <TextInput style={[s.input, { width: 80 }]} value={newRain.mm} onChangeText={v => setNewRain(r => ({...r, mm: v}))} placeholder="mm" keyboardType="decimal-pad" />
          <TouchableOpacity style={s.addBtn} onPress={addRainfall}><Ionicons name="add" size={20} color="#fff" /></TouchableOpacity>
        </View>
        {rainfall.slice(0, 5).map(r => (
          <View key={r.id} style={s.row}>
            <Text style={s.rowLabel}>{r.date}</Text>
            <Text style={s.rowVal}>{r.mm}mm</Text>
          </View>
        ))}
      </View>

      {/* Emergency Contacts */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>🆘 Noodkontakte</Text>
          <TouchableOpacity onPress={() => router.push('/settings/contacts')}><Ionicons name="add-circle" size={24} color="#2D5016" /></TouchableOpacity>
        </View>
        {contacts.map(c => (
          <View key={c.id} style={s.row}>
            <Text style={s.rowLabel}>{c.name} {c.is_primary ? '⭐' : ''}</Text>
            <Text style={s.rowVal}>{c.phone}</Text>
          </View>
        ))}
        {!contacts.length && <Text style={s.empty}>Geen noodkontakte nie</Text>}
      </View>

      {/* Subscription */}
      {user?.tier !== 'pro' && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>⭐ Opgradeer na Pro</Text>
          {plans.filter(p => p.tier_name === 'pro').map(p => (
            <TouchableOpacity key={p.id} style={s.upgradeBtn} onPress={() => upgrade(p.id)} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={s.upgradeBtnText}>R{p.price_zar}/maand — Opgradeer</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#F44336" />
        <Text style={s.logoutText}>Teken Uit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { fontSize: 14, color: '#666' },
  rowVal: { fontSize: 14, color: '#333', fontWeight: '500' },
  tierBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  tierText: { fontSize: 11, fontWeight: 'bold', color: '#333' },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  langLabel: { fontSize: 15, color: '#333' },
  rainInput: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14 },
  addBtn: { backgroundColor: '#2D5016', borderRadius: 8, padding: 10 },
  empty: { color: '#888', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  upgradeBtn: { backgroundColor: '#2D5016', borderRadius: 10, padding: 14, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 12, elevation: 1 },
  logoutText: { color: '#F44336', fontSize: 16, fontWeight: '600' },
});
