import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineSyncService, FarmRecord } from '../../src/services/OfflineSyncService';

const CATEGORIES = ['Voer', 'Brandstof', 'Arbeid', 'Toerusting', 'Veearts', 'Heinings', 'Ander'];
const CATEGORIES_EN = ['Feed', 'Fuel', 'Labour', 'Equipment', 'Vet', 'Fencing', 'Other'];
const CAT_COLORS: Record<string, string> = { Voer: '#16a34a', Feed: '#16a34a', Brandstof: '#f59e0b', Fuel: '#f59e0b', Arbeid: '#3b82f6', Labour: '#3b82f6', Toerusting: '#8b5cf6', Equipment: '#8b5cf6', Veearts: '#ec4899', Vet: '#ec4899', Heinings: '#06b6d4', Fencing: '#06b6d4', Ander: '#6b7280', Other: '#6b7280' };

const strings = {
  en: { title: 'Expenses', add: '+ Add Expense', amount: 'Amount (R)', description: 'Description', category: 'Category', save: 'Save', cancel: 'Cancel', total: 'Total This Month', noData: 'No expenses yet' },
  af: { title: 'Uitgawes', add: '+ Voeg Uitgawe By', amount: 'Bedrag (R)', description: 'Beskrywing', category: 'Kategorie', save: 'Stoor', cancel: 'Kanselleer', total: 'Totaal Hierdie Maand', noData: 'Geen uitgawes nog nie' },
};

export default function Expenses() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Ander');
  const t = strings[lang];
  const cats = lang === 'af' ? CATEGORIES : CATEGORIES_EN;

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const load = useCallback(async () => {
    const token = await AsyncStorage.getItem('token') ?? '';
    const data = await OfflineSyncService.getRecords(token);
    setRecords(data.filter(r => r.type === 'expense'));
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!amount || !desc) { Alert.alert('Error', lang === 'af' ? 'Vul alle velde in' : 'Fill in all fields'); return; }
    await OfflineSyncService.queueOfflineRecord({ type: 'expense', desc, desc_en: desc, amount: parseFloat(amount), date: new Date().toISOString().split('T')[0], category });
    setModal(false); setAmount(''); setDesc(''); load();
  };

  const total = records.reduce((s, r) => s + r.amount, 0);
  const fmt = (n: number) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <View style={s.totalCard}><Text style={s.totalLabel}>{t.total}</Text><Text style={s.totalAmt}>{fmt(total)}</Text></View>
      <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}><Text style={s.addTxt}>{t.add}</Text></TouchableOpacity>
      <FlatList
        data={records}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#92400e" />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={[s.catDot, { backgroundColor: CAT_COLORS[item.category ?? 'Ander'] ?? '#6b7280' }]} />
            <View style={s.cardBody}>
              <Text style={s.cardDesc}>{lang === 'af' ? item.desc : item.desc_en}</Text>
              <Text style={s.cardCat}>{item.category} • {item.date}</Text>
            </View>
            <Text style={s.cardAmt}>{fmt(item.amount)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>{t.noData}</Text>}
      />
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{t.add}</Text>
            <TextInput style={s.input} placeholder={t.amount} placeholderTextColor="#64748b" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <TextInput style={s.input} placeholder={t.description} placeholderTextColor="#64748b" value={desc} onChangeText={setDesc} />
            <Text style={s.catLabel}>{t.category}</Text>
            <View style={s.catRow}>
              {cats.map((c, i) => (
                <TouchableOpacity key={c} style={[s.catBtn, category === (lang === 'af' ? CATEGORIES[i] : CATEGORIES_EN[i]) && s.catActive]} onPress={() => setCategory(lang === 'af' ? CATEGORIES[i] : CATEGORIES_EN[i])}>
                  <Text style={s.catTxt}>{c}</Text>
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
  totalLabel: { color: '#d97706', fontSize: 14 }, totalAmt: { color: '#f87171', fontSize: 20, fontWeight: 'bold' },
  addBtn: { marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 10, backgroundColor: '#92400e', alignItems: 'center' },
  addTxt: { color: '#fff', fontWeight: 'bold' },
  card: { flexDirection: 'row', alignItems: 'center', margin: 6, marginHorizontal: 12, padding: 12, backgroundColor: '#fff', borderRadius: 8, elevation: 1 },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  cardBody: { flex: 1 }, cardDesc: { fontSize: 14, fontWeight: '600', color: '#1f2937' }, cardCat: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  cardAmt: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
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
