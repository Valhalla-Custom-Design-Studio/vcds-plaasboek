import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { OfflineSyncService } from '../../src/services/OfflineSyncService';

const strings = {
  en: { title: 'Plaasboek™', subtitle: 'Farm Record Keeping', thisMonth: 'This Month', income: 'Income', expenses: 'Expenses', net: 'Net', records: 'Records', addRecord: '+ Add Record', viewAll: 'View All Records', reports: 'Reports', livestock: 'Livestock', workers: 'Workers', offline: 'Offline mode', greeting: 'Good morning, Boer!' },
  af: { title: 'Plaasboek™', subtitle: 'Plaasrekordhouding', thisMonth: 'Hierdie Maand', income: 'Inkomste', expenses: 'Uitgawes', net: 'Netto', records: 'Rekords', addRecord: '+ Voeg Rekord By', viewAll: 'Sien Alle Rekords', reports: 'Verslae', livestock: 'Vee', workers: 'Werkers', offline: 'Vanlyn modus', greeting: 'Goeie môre, Boer!' },
};

export default function Dashboard() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expenses: 0 });
  const router = useRouter();
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const loadSummary = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token') ?? '';
      const records = await OfflineSyncService.getRecords(token);
      const now = new Date();
      const thisMonth = records.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const income = thisMonth.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const expenses = thisMonth.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      setSummary({ income, expenses });
    } catch {}
    setRefreshing(false);
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const net = summary.income - summary.expenses;
  const fmt = (n: number) => `R${Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSummary(); }} tintColor="#92400e" />}>
      <View style={s.header}>
        <View><Text style={s.title}>{t.title}</Text><Text style={s.subtitle}>{t.subtitle}</Text></View>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <Text style={s.greeting}>{t.greeting}</Text>
      <Text style={s.sectionLabel}>{t.thisMonth}</Text>
      <View style={s.summaryRow}>
        <View style={[s.card, { borderTopColor: '#16a34a' }]}><Text style={s.cardLabel}>{t.income}</Text><Text style={[s.cardAmt, { color: '#4ade80' }]}>{fmt(summary.income)}</Text></View>
        <View style={[s.card, { borderTopColor: '#dc2626' }]}><Text style={s.cardLabel}>{t.expenses}</Text><Text style={[s.cardAmt, { color: '#f87171' }]}>{fmt(summary.expenses)}</Text></View>
      </View>
      <View style={[s.netCard, { borderColor: net >= 0 ? '#16a34a' : '#dc2626' }]}>
        <Text style={s.netLabel}>{t.net}</Text>
        <Text style={[s.netAmt, { color: net >= 0 ? '#4ade80' : '#f87171' }]}>{net < 0 ? '-' : ''}{fmt(net)}</Text>
      </View>
      <TouchableOpacity style={s.addBtn} onPress={() => router.push('/(tabs)/records')}><Text style={s.addTxt}>{t.addRecord}</Text></TouchableOpacity>
      <View style={s.quickRow}>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/livestock')}><Text style={s.quickIcon}>🐄</Text><Text style={s.quickLabel}>{t.livestock}</Text></TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/workers')}><Text style={s.quickIcon}>👷</Text><Text style={s.quickLabel}>{t.workers}</Text></TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/reports')}><Text style={s.quickIcon}>📊</Text><Text style={s.quickLabel}>{t.reports}</Text></TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/expenses')}><Text style={s.quickIcon}>💰</Text><Text style={s.quickLabel}>{t.expenses}</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1007' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fef3c7' },
  subtitle: { fontSize: 12, color: '#d97706' },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langLabel: { color: '#92400e', fontSize: 12 },
  greeting: { color: '#fef3c7', fontSize: 16, marginHorizontal: 20, marginBottom: 12 },
  sectionLabel: { color: '#d97706', fontSize: 13, fontWeight: '600', marginHorizontal: 20, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 12 },
  card: { flex: 1, backgroundColor: '#292524', padding: 14, borderRadius: 10, borderTopWidth: 3 },
  cardLabel: { color: '#d97706', fontSize: 12 },
  cardAmt: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  netCard: { marginHorizontal: 20, backgroundColor: '#292524', padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel: { color: '#fef3c7', fontSize: 14, fontWeight: '600' },
  netAmt: { fontSize: 20, fontWeight: 'bold' },
  addBtn: { marginHorizontal: 20, marginBottom: 20, padding: 16, borderRadius: 10, backgroundColor: '#92400e', alignItems: 'center' },
  addTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 20, marginBottom: 30 },
  quickBtn: { flex: 1, minWidth: '40%', backgroundColor: '#292524', padding: 16, borderRadius: 10, alignItems: 'center' },
  quickIcon: { fontSize: 28, marginBottom: 6 },
  quickLabel: { color: '#fef3c7', fontSize: 13, fontWeight: '600' },
});
