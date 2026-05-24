import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineSyncService, FarmRecord } from '../../src/services/OfflineSyncService';

const MONTHS_AF = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const strings = {
  en: { title: 'Reports', income: 'Income', expenses: 'Expenses', net: 'Net Profit', thisYear: 'This Year', monthly: 'Monthly Breakdown', topCats: 'Top Expense Categories', noData: 'No data yet', export: 'Export CSV' },
  af: { title: 'Verslae', income: 'Inkomste', expenses: 'Uitgawes', net: 'Netto Wins', thisYear: 'Hierdie Jaar', monthly: 'Maandelikse Uiteensetting', topCats: 'Top Uitgawe Kategorieë', noData: 'Geen data nog nie', export: 'Voer CSV Uit' },
};

export default function Reports() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const t = strings[lang];
  const months = lang === 'af' ? MONTHS_AF : MONTHS_EN;

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const load = useCallback(async () => {
    const token = await AsyncStorage.getItem('token') ?? '';
    const data = await OfflineSyncService.getRecords(token);
    setRecords(data);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const yearRecords = records.filter(r => new Date(r.date).getFullYear() === now.getFullYear());
  const totalIncome = yearRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const totalExpenses = yearRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const net = totalIncome - totalExpenses;
  const fmt = (n: number) => `R${Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const mo = yearRecords.filter(r => new Date(r.date).getMonth() === i);
    return {
      month: months[i],
      income: mo.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0),
      expenses: mo.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
    };
  });

  const catTotals: Record<string, number> = {};
  yearRecords.filter(r => r.type === 'expense').forEach(r => {
    const c = r.category ?? 'Ander';
    catTotals[c] = (catTotals[c] ?? 0) + r.amount;
  });
  const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = topCats[0]?.[1] ?? 1;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#92400e" />}>
      <View style={s.header}>
        <Text style={s.title}>{t.title} {now.getFullYear()}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <View style={s.summaryRow}>
        <View style={[s.sumCard, { borderTopColor: '#16a34a' }]}><Text style={s.sumLabel}>{t.income}</Text><Text style={[s.sumAmt, { color: '#4ade80' }]}>{fmt(totalIncome)}</Text></View>
        <View style={[s.sumCard, { borderTopColor: '#dc2626' }]}><Text style={s.sumLabel}>{t.expenses}</Text><Text style={[s.sumAmt, { color: '#f87171' }]}>{fmt(totalExpenses)}</Text></View>
      </View>
      <View style={[s.netCard, { borderColor: net >= 0 ? '#16a34a' : '#dc2626' }]}>
        <Text style={s.netLabel}>{t.net}</Text>
        <Text style={[s.netAmt, { color: net >= 0 ? '#4ade80' : '#f87171' }]}>{net < 0 ? '-' : ''}{fmt(net)}</Text>
      </View>
      <Text style={s.sectionTitle}>{t.monthly}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chartScroll}>
        {monthlyData.map(m => {
          const maxVal = Math.max(m.income, m.expenses, 1);
          return (
            <View key={m.month} style={s.barGroup}>
              <View style={s.bars}>
                <View style={[s.bar, { height: (m.income / maxVal) * 80, backgroundColor: '#4ade80' }]} />
                <View style={[s.bar, { height: (m.expenses / maxVal) * 80, backgroundColor: '#f87171' }]} />
              </View>
              <Text style={s.barLabel}>{m.month}</Text>
            </View>
          );
        })}
      </ScrollView>
      {topCats.length > 0 && (
        <>
          <Text style={s.sectionTitle}>{t.topCats}</Text>
          {topCats.map(([cat, amt]) => (
            <View key={cat} style={s.catRow}>
              <Text style={s.catName}>{cat}</Text>
              <View style={s.catBarBg}><View style={[s.catBar, { width: `${(amt / maxCat) * 100}%` as any }]} /></View>
              <Text style={s.catAmt}>{fmt(amt)}</Text>
            </View>
          ))}
        </>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1007' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50 },
  title: { fontSize: 20, fontWeight: '700', color: '#fef3c7' },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, langLabel: { color: '#92400e', fontSize: 12 },
  summaryRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 12 },
  sumCard: { flex: 1, backgroundColor: '#292524', padding: 14, borderRadius: 10, borderTopWidth: 3 },
  sumLabel: { color: '#d97706', fontSize: 12 }, sumAmt: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  netCard: { marginHorizontal: 16, backgroundColor: '#292524', padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel: { color: '#fef3c7', fontSize: 14, fontWeight: '600' }, netAmt: { fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { color: '#d97706', fontSize: 14, fontWeight: '600', marginHorizontal: 16, marginBottom: 12 },
  chartScroll: { paddingLeft: 16, marginBottom: 20 },
  barGroup: { alignItems: 'center', marginRight: 12, width: 36 },
  bars: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: 90 },
  bar: { width: 14, borderRadius: 3, minHeight: 2 },
  barLabel: { color: '#78716c', fontSize: 10, marginTop: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, gap: 8 },
  catName: { color: '#fef3c7', fontSize: 12, width: 80 },
  catBarBg: { flex: 1, height: 8, backgroundColor: '#292524', borderRadius: 4, overflow: 'hidden' },
  catBar: { height: 8, backgroundColor: '#f87171', borderRadius: 4 },
  catAmt: { color: '#f87171', fontSize: 11, width: 80, textAlign: 'right' },
});
