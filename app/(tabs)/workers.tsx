import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKERS_KEY = 'plaasboek_workers';

interface Worker {
  id: string;
  name: string;
  role: string;
  wage: number;
  phone: string;
  startDate: string;
  active: boolean;
}

const strings = {
  en: { title: 'Workers', add: '+ Add Worker', name: 'Full Name', role: 'Role', wage: 'Monthly Wage (R)', phone: 'Phone Number', save: 'Save', cancel: 'Cancel', total: 'Total Monthly Wages', active: 'Active', noData: 'No workers recorded' },
  af: { title: 'Werkers', add: '+ Voeg Werker By', name: 'Volle Naam', role: 'Rol', wage: 'Maandelikse Loon (R)', phone: 'Telefoonnommer', save: 'Stoor', cancel: 'Kanselleer', total: 'Totale Maandelikse Lone', active: 'Aktief', noData: 'Geen werkers aangeteken nie' },
};

export default function Workers() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [wage, setWage] = useState('');
  const [phone, setPhone] = useState('');
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(WORKERS_KEY);
    setWorkers(raw ? JSON.parse(raw) : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!name || !wage) { Alert.alert('Error', lang === 'af' ? 'Vul naam en loon in' : 'Fill in name and wage'); return; }
    const updated = [...workers, { id: `local_${Date.now()}`, name, role, wage: parseFloat(wage), phone, startDate: new Date().toISOString().split('T')[0], active: true }];
    await AsyncStorage.setItem(WORKERS_KEY, JSON.stringify(updated));
    setWorkers(updated); setModal(false); setName(''); setRole(''); setWage(''); setPhone('');
  };

  const toggleActive = async (id: string) => {
    const updated = workers.map(w => w.id === id ? { ...w, active: !w.active } : w);
    await AsyncStorage.setItem(WORKERS_KEY, JSON.stringify(updated));
    setWorkers(updated);
  };

  const totalWages = workers.filter(w => w.active).reduce((s, w) => s + w.wage, 0);
  const fmt = (n: number) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <View style={s.totalCard}><Text style={s.totalLabel}>{t.total}</Text><Text style={s.totalAmt}>{fmt(totalWages)}</Text></View>
      <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}><Text style={s.addTxt}>{t.add}</Text></TouchableOpacity>
      <FlatList
        data={workers}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={[s.card, !item.active && s.cardInactive]}>
            <View style={s.avatar}><Text style={s.avatarTxt}>{item.name.charAt(0).toUpperCase()}</Text></View>
            <View style={s.cardBody}>
              <Text style={s.cardName}>{item.name}</Text>
              <Text style={s.cardSub}>{item.role || '—'} • {item.phone || '—'}</Text>
              <Text style={s.cardWage}>{fmt(item.wage)}/mo</Text>
            </View>
            <Switch value={item.active} onValueChange={() => toggleActive(item.id)} trackColor={{ true: '#92400e' }} />
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>{t.noData}</Text>}
      />
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{t.add}</Text>
            <TextInput style={s.input} placeholder={t.name} placeholderTextColor="#64748b" value={name} onChangeText={setName} />
            <TextInput style={s.input} placeholder={t.role} placeholderTextColor="#64748b" value={role} onChangeText={setRole} />
            <TextInput style={s.input} placeholder={t.wage} placeholderTextColor="#64748b" value={wage} onChangeText={setWage} keyboardType="numeric" />
            <TextInput style={s.input} placeholder={t.phone} placeholderTextColor="#64748b" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}><Text style={s.cancelTxt}>{t.cancel}</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={save}><Text style={s.saveTxt}>{t.save}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef9f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#92400e' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, langLabel: { color: '#fff', fontSize: 12 },
  totalCard: { margin: 12, padding: 16, backgroundColor: '#1c1007', borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#d97706', fontSize: 14 }, totalAmt: { color: '#f87171', fontSize: 20, fontWeight: 'bold' },
  addBtn: { marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 10, backgroundColor: '#92400e', alignItems: 'center' },
  addTxt: { color: '#fff', fontWeight: 'bold' },
  card: { flexDirection: 'row', alignItems: 'center', margin: 6, marginHorizontal: 12, padding: 12, backgroundColor: '#fff', borderRadius: 8, elevation: 1 },
  cardInactive: { opacity: 0.5 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#92400e', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cardBody: { flex: 1 }, cardName: { fontSize: 14, fontWeight: '600', color: '#1f2937' }, cardSub: { fontSize: 11, color: '#6b7280', marginTop: 2 }, cardWage: { fontSize: 13, color: '#92400e', fontWeight: '600', marginTop: 2 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#0f172a', color: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 15 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#334155', alignItems: 'center' },
  cancelTxt: { color: '#94a3b8', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#92400e', alignItems: 'center' },
  saveTxt: { color: '#fff', fontWeight: 'bold' },
});
