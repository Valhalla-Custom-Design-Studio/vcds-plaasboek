import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIVESTOCK_KEY = 'plaasboek_livestock';

interface Animal {
  id: string;
  name: string;
  type: string;
  count: number;
  notes: string;
  date: string;
}

const TYPES_AF = ['Beeste', 'Skape', 'Varke', 'Perde', 'Hoenders', 'Bokke', 'Ander'];
const TYPES_EN = ['Cattle', 'Sheep', 'Pigs', 'Horses', 'Chickens', 'Goats', 'Other'];

const strings = {
  en: { title: 'Livestock', add: '+ Add Animal', name: 'Name / Tag', type: 'Type', count: 'Count', notes: 'Notes (optional)', save: 'Save', cancel: 'Cancel', total: 'Total Animals', noData: 'No livestock recorded' },
  af: { title: 'Vee', add: '+ Voeg Dier By', name: 'Naam / Merker', type: 'Tipe', count: 'Aantal', notes: 'Notas (opsioneel)', save: 'Stoor', cancel: 'Kanselleer', total: 'Totale Diere', noData: 'Geen vee aangeteken nie' },
};

export default function Livestock() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Beeste');
  const [count, setCount] = useState('');
  const [notes, setNotes] = useState('');
  const t = strings[lang];
  const types = lang === 'af' ? TYPES_AF : TYPES_EN;

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(LIVESTOCK_KEY);
    setAnimals(raw ? JSON.parse(raw) : []);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!name || !count) { Alert.alert('Error', lang === 'af' ? 'Vul naam en aantal in' : 'Fill in name and count'); return; }
    const updated = [...animals, { id: `local_${Date.now()}`, name, type, count: parseInt(count), notes, date: new Date().toISOString().split('T')[0] }];
    await AsyncStorage.setItem(LIVESTOCK_KEY, JSON.stringify(updated));
    setAnimals(updated); setModal(false); setName(''); setCount(''); setNotes('');
  };

  const total = animals.reduce((s, a) => s + a.count, 0);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <View style={s.totalCard}><Text style={s.totalLabel}>{t.total}</Text><Text style={s.totalAmt}>{total}</Text></View>
      <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}><Text style={s.addTxt}>{t.add}</Text></TouchableOpacity>
      <FlatList
        data={animals}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#92400e" />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.cardEmoji}>{item.type === 'Beeste' || item.type === 'Cattle' ? '🐄' : item.type === 'Skape' || item.type === 'Sheep' ? '🐑' : item.type === 'Varke' || item.type === 'Pigs' ? '🐷' : item.type === 'Perde' || item.type === 'Horses' ? '🐴' : item.type === 'Hoenders' || item.type === 'Chickens' ? '🐔' : item.type === 'Bokke' || item.type === 'Goats' ? '🐐' : '🐾'}</Text>
            <View style={s.cardBody}>
              <Text style={s.cardName}>{item.name}</Text>
              <Text style={s.cardSub}>{item.type} • {item.date}</Text>
              {item.notes ? <Text style={s.cardNotes}>{item.notes}</Text> : null}
            </View>
            <Text style={s.cardCount}>{item.count}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>{t.noData}</Text>}
      />
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{t.add}</Text>
            <TextInput style={s.input} placeholder={t.name} placeholderTextColor="#64748b" value={name} onChangeText={setName} />
            <TextInput style={s.input} placeholder={t.count} placeholderTextColor="#64748b" value={count} onChangeText={setCount} keyboardType="numeric" />
            <TextInput style={s.input} placeholder={t.notes} placeholderTextColor="#64748b" value={notes} onChangeText={setNotes} />
            <Text style={s.catLabel}>{t.type}</Text>
            <View style={s.catRow}>
              {types.map((tp, i) => (
                <TouchableOpacity key={tp} style={[s.catBtn, type === (lang === 'af' ? TYPES_AF[i] : TYPES_EN[i]) && s.catActive]} onPress={() => setType(lang === 'af' ? TYPES_AF[i] : TYPES_EN[i])}>
                  <Text style={s.catTxt}>{tp}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  totalLabel: { color: '#d97706', fontSize: 14 }, totalAmt: { color: '#4ade80', fontSize: 24, fontWeight: 'bold' },
  addBtn: { marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 10, backgroundColor: '#92400e', alignItems: 'center' },
  addTxt: { color: '#fff', fontWeight: 'bold' },
  card: { flexDirection: 'row', alignItems: 'center', margin: 6, marginHorizontal: 12, padding: 12, backgroundColor: '#fff', borderRadius: 8, elevation: 1 },
  cardEmoji: { fontSize: 28, marginRight: 12 },
  cardBody: { flex: 1 }, cardName: { fontSize: 14, fontWeight: '600', color: '#1f2937' }, cardSub: { fontSize: 11, color: '#6b7280', marginTop: 2 }, cardNotes: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  cardCount: { fontSize: 22, fontWeight: 'bold', color: '#92400e' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#0f172a', color: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 15 },
  catLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#334155' },
  catActive: { backgroundColor: '#92400e' }, catTxt: { color: '#f1f5f9', fontSize: 12 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#334155', alignItems: 'center' },
  cancelTxt: { color: '#94a3b8', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#92400e', alignItems: 'center' },
  saveTxt: { color: '#fff', fontWeight: 'bold' },
});
