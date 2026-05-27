
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL;
const T = {
  en: { title:'Plaasboek™', subtitle:'Farm Record Keeping', add:'+ Add Record', records:'View Records', reports:'Reports & Analytics', ai:'🎙️ AI Bookkeeper', income:'Income', expenses:'Expenses', profit:'Net Profit', thisMonth:'This Month', loading:'Loading...' },
  af: { title:'Plaasboek™', subtitle:'Plaasrekordhouding', add:'+ Voeg Rekord By', records:'Bekyk Rekords', reports:'Verslae & Analise', ai:'🎙️ KI Boekhouer', income:'Inkomste', expenses:'Uitgawes', profit:'Netto Wins', thisMonth:'Hierdie Maand', loading:'Laai...' },
};

export default function PlaasboekHome() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const t = T[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const load = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) { router.replace('/auth/login'); return; }
      const res = await fetch(`${API}/api/records/summary`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSummary(await res.json().then(d => d.summary));
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: any) => `R${Number(n||0).toLocaleString('af-ZA', { minimumFractionDigits: 2 })}`;
  const profit = Number(summary?.net_profit || 0);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#d97706" /></View>;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#d97706" />}>
      <View style={s.header}>
        <View><Text style={s.title}>{t.title}</Text><Text style={s.subtitle}>{t.subtitle}</Text></View>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}} thumbColor="#fff"/><Text style={s.langLabel}>AF</Text></View>
      </View>

      <Text style={s.monthLabel}>{t.thisMonth} — {new Date().getFullYear()}</Text>
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { borderTopColor:'#16a34a' }]}>
          <Text style={s.summaryLabel}>{t.income}</Text>
          <Text style={[s.summaryAmt, { color:'#4ade80' }]}>{fmt(summary?.total_income)}</Text>
        </View>
        <View style={[s.summaryCard, { borderTopColor:'#dc2626' }]}>
          <Text style={s.summaryLabel}>{t.expenses}</Text>
          <Text style={[s.summaryAmt, { color:'#f87171' }]}>{fmt(summary?.total_expenses)}</Text>
        </View>
      </View>
      <View style={[s.profitCard, { borderColor: profit >= 0 ? '#16a34a' : '#dc2626' }]}>
        <Text style={s.profitLabel}>{t.profit}</Text>
        <Text style={[s.profitAmt, { color: profit >= 0 ? '#4ade80' : '#f87171' }]}>{fmt(profit)}</Text>
      </View>

      {[
        { label: t.add, path: '/records/add', color: '#92400e' },
        { label: t.records, path: '/records', color: '#44403c' },
        { label: t.reports, path: '/reports', color: '#0369a1' },
        { label: t.ai, path: '/records/add', color: '#7c3aed' },
      ].map(btn => (
        <TouchableOpacity key={btn.label} style={[s.btn, { backgroundColor: btn.color }]} onPress={() => router.push(btn.path as any)}>
          <Text style={s.btnTxt}>{btn.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#1c1007'}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#1c1007'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:20,paddingTop:50},
  title:{fontSize:28,fontWeight:'bold',color:'#fef3c7'}, subtitle:{fontSize:13,color:'#d97706'},
  langRow:{flexDirection:'row',alignItems:'center',gap:6}, langLabel:{color:'#92400e',fontSize:12},
  monthLabel:{color:'#fef3c7',fontSize:16,fontWeight:'600',marginHorizontal:20,marginTop:8,marginBottom:8},
  summaryRow:{flexDirection:'row',gap:12,marginHorizontal:20,marginBottom:12},
  summaryCard:{flex:1,backgroundColor:'#292524',padding:16,borderRadius:10,borderTopWidth:3},
  summaryLabel:{color:'#d97706',fontSize:13}, summaryAmt:{fontSize:20,fontWeight:'bold',marginTop:4},
  profitCard:{marginHorizontal:20,marginBottom:16,backgroundColor:'#292524',padding:16,borderRadius:10,borderWidth:2,alignItems:'center'},
  profitLabel:{color:'#a8a29e',fontSize:13}, profitAmt:{fontSize:28,fontWeight:'bold',marginTop:4},
  btn:{margin:8,marginHorizontal:20,padding:16,borderRadius:10,alignItems:'center'},
  btnTxt:{color:'#fff',fontWeight:'bold',fontSize:16},
});
