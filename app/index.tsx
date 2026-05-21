import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const strings = {
  en: { title: "Plaasboek™", subtitle: "Farm Record Keeping", records: "Recent Records", add: "Add Record", expenses: "Expenses", income: "Income", reports: "Reports", this_month: "This Month" },
  af: { title: "Plaasboek™", subtitle: "Plaasrekordhouding", records: "Onlangse Rekords", add: "Voeg Rekord By", expenses: "Uitgawes", income: "Inkomste", reports: "Verslae", this_month: "Hierdie Maand" },
};

export default function PlaasboekHome() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <View><Text style={s.title}>{t.title}</Text><Text style={s.subtitle}>{t.subtitle}</Text></View>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <Text style={s.monthLabel}>{t.this_month}</Text>
      <View style={s.summaryRow}>
        <View style={[s.summaryCard,{borderTopColor:'#16a34a'}]}><Text style={s.summaryLabel}>{t.income}</Text><Text style={[s.summaryAmt,{color:'#4ade80'}]}>R24,500</Text></View>
        <View style={[s.summaryCard,{borderTopColor:'#dc2626'}]}><Text style={s.summaryLabel}>{t.expenses}</Text><Text style={[s.summaryAmt,{color:'#f87171'}]}>R8,200</Text></View>
      </View>
      <TouchableOpacity style={s.addBtn}><Text style={s.addTxt}>{t.add}</Text></TouchableOpacity>
      <TouchableOpacity style={s.reportBtn}><Text style={s.reportTxt}>{t.reports}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#1c1007'}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:20,paddingTop:50},
  title:{fontSize:28,fontWeight:'bold',color:'#fef3c7'}, subtitle:{fontSize:13,color:'#d97706'},
  langRow:{flexDirection:'row',alignItems:'center',gap:6}, langLabel:{color:'#92400e',fontSize:12},
  monthLabel:{color:'#fef3c7',fontSize:16,fontWeight:'600',marginHorizontal:20,marginTop:8,marginBottom:8},
  summaryRow:{flexDirection:'row',gap:12,marginHorizontal:20,marginBottom:16},
  summaryCard:{flex:1,backgroundColor:'#292524',padding:16,borderRadius:10,borderTopWidth:3},
  summaryLabel:{color:'#d97706',fontSize:13}, summaryAmt:{fontSize:20,fontWeight:'bold',marginTop:4},
  addBtn:{margin:12,marginHorizontal:20,padding:16,borderRadius:10,backgroundColor:'#92400e',alignItems:'center'},
  addTxt:{color:'#fff',fontWeight:'bold',fontSize:16},
  reportBtn:{margin:12,marginHorizontal:20,padding:16,borderRadius:10,backgroundColor:'#1e293b',alignItems:'center'},
  reportTxt:{color:'#fff',fontWeight:'bold',fontSize:16},
});
