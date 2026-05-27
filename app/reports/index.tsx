
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL;
const T = {
  en: { title:'Reports & Analytics', summary:'Annual Summary', income:'Total Income', expenses:'Total Expenses', profit:'Net Profit', vat:'Total VAT', score:'AgriFinance Score', grade:'Grade', recommendation:'Recommendation', monthly:'Monthly Breakdown', sars:'SARS Tax Summary', export:'Export PDF Report', loading:'Loading...' },
  af: { title:'Verslae & Analise', summary:'Jaarlikse Opsomming', income:'Totale Inkomste', expenses:'Totale Uitgawes', profit:'Netto Wins', vat:'Totale BTW', score:'AgriFinansie Telling', grade:'Graad', recommendation:'Aanbeveling', monthly:'Maandelikse Uiteensetting', sars:'SARS Belasting Opsomming', export:'Voer PDF Verslag Uit', loading:'Laai...' },
};

export default function Reports() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [summary, setSummary] = useState<any>(null);
  const [scoreData, setScoreData] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = T[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);

  useEffect(() => {
    const load = async () => {
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      try {
        const [s, sc, m] = await Promise.all([
          fetch(`${API}/api/records/summary`, { headers: h }).then(r => r.json()),
          fetch(`${API}/api/records/agrifinance-score`, { headers: h }).then(r => r.json()),
          fetch(`${API}/api/records/monthly-breakdown`, { headers: h }).then(r => r.json()),
        ]);
        setSummary(s.summary);
        setScoreData(sc);
        setMonthly(m.breakdown || []);
      } catch { } finally { setLoading(false); }
    };
    load();
  }, []);

  const fmt = (n: any) => `R${Number(n||0).toLocaleString('af-ZA', { minimumFractionDigits: 2 })}`;
  const gradeColor: any = { A:'#16a34a', B:'#0369a1', C:'#d97706', D:'#dc2626', F:'#7f1d1d' };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#d97706" /></View>;

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={v => setLang(v ? 'af' : 'en')} trackColor={{true:'#92400e'}} thumbColor="#fff"/><Text style={s.langLabel}>AF</Text></View>
      </View>

      {/* Annual Summary */}
      <Text style={s.sectionTitle}>{t.summary} {new Date().getFullYear()}</Text>
      <View style={s.summaryGrid}>
        {[
          { label: t.income, value: fmt(summary?.total_income), color: '#16a34a' },
          { label: t.expenses, value: fmt(summary?.total_expenses), color: '#dc2626' },
          { label: t.profit, value: fmt(summary?.net_profit), color: Number(summary?.net_profit) >= 0 ? '#4ade80' : '#f87171' },
          { label: t.vat, value: fmt(summary?.total_vat), color: '#d97706' },
        ].map(item => (
          <View key={item.label} style={s.summaryCard}>
            <Text style={s.summaryLabel}>{item.label}</Text>
            <Text style={[s.summaryValue, { color: item.color }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* AgriFinance Score */}
      {scoreData && (
        <View style={[s.scoreCard, { borderColor: gradeColor[scoreData.grade] || '#d97706' }]}>
          <Text style={s.scoreTitle}>{t.score}</Text>
          <View style={s.scoreRow}>
            <Text style={[s.scoreNum, { color: gradeColor[scoreData.grade] }]}>{scoreData.score}</Text>
            <View style={[s.gradeBadge, { backgroundColor: gradeColor[scoreData.grade] }]}>
              <Text style={s.gradeTxt}>{t.grade}: {scoreData.grade}</Text>
            </View>
          </View>
          <Text style={s.scoreRec}>{scoreData.recommendation}</Text>
        </View>
      )}

      {/* Monthly Breakdown */}
      {monthly.length > 0 && (
        <>
          <Text style={s.sectionTitle}>{t.monthly}</Text>
          {monthly.map(m => (
            <View key={m.month} style={s.monthRow}>
              <Text style={s.monthLabel}>{m.month}</Text>
              <Text style={s.monthIncome}>+{fmt(m.income)}</Text>
              <Text style={s.monthExpense}>-{fmt(m.expenses)}</Text>
            </View>
          ))}
        </>
      )}

      <TouchableOpacity style={s.exportBtn}>
        <Text style={s.exportTxt}>📄 {t.export}</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#1c1007'}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#1c1007'},
  header:{flexDirection:'row',alignItems:'center',padding:16,paddingTop:50,gap:8},
  back:{color:'#d97706',fontSize:22}, title:{flex:1,fontSize:20,fontWeight:'bold',color:'#fef3c7'},
  langRow:{flexDirection:'row',alignItems:'center',gap:4}, langLabel:{color:'#92400e',fontSize:11},
  sectionTitle:{color:'#d97706',fontSize:16,fontWeight:'700',marginHorizontal:16,marginTop:20,marginBottom:10},
  summaryGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginHorizontal:16},
  summaryCard:{width:'47%',backgroundColor:'#292524',padding:14,borderRadius:10},
  summaryLabel:{color:'#a8a29e',fontSize:12}, summaryValue:{fontSize:18,fontWeight:'bold',marginTop:4},
  scoreCard:{margin:16,backgroundColor:'#292524',borderRadius:12,padding:16,borderWidth:2},
  scoreTitle:{color:'#fef3c7',fontSize:16,fontWeight:'bold',marginBottom:10},
  scoreRow:{flexDirection:'row',alignItems:'center',gap:16,marginBottom:10},
  scoreNum:{fontSize:48,fontWeight:'bold'}, gradeBadge:{paddingHorizontal:14,paddingVertical:6,borderRadius:8},
  gradeTxt:{color:'#fff',fontWeight:'bold',fontSize:14}, scoreRec:{color:'#d97706',fontSize:13,lineHeight:18},
  monthRow:{flexDirection:'row',justifyContent:'space-between',marginHorizontal:16,paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#292524'},
  monthLabel:{color:'#fef3c7',fontSize:13,flex:1}, monthIncome:{color:'#4ade80',fontSize:13}, monthExpense:{color:'#f87171',fontSize:13},
  exportBtn:{margin:16,backgroundColor:'#92400e',padding:16,borderRadius:10,alignItems:'center'},
  exportTxt:{color:'#fff',fontWeight:'bold',fontSize:15},
});
