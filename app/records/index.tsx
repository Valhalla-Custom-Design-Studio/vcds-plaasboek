import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const strings = {
  en: { title: "Records", income: "Income", expense: "Expense", all: "All", add: "Add", date: "Date", amount: "Amount", category: "Category" },
  af: { title: "Rekords", income: "Inkomste", expense: "Uitgawe", all: "Alles", add: "Voeg By", date: "Datum", amount: "Bedrag", category: "Kategorie" },
};

const MOCK = [
  { id:'1', type:'income', desc:'Beesverkoop', desc_en:'Cattle Sale', amount:12500, date:'2026-05-20' },
  { id:'2', type:'expense', desc:'Voer', desc_en:'Feed', amount:3200, date:'2026-05-18' },
  { id:'3', type:'income', desc:'Wolverkoop', desc_en:'Wool Sale', amount:8400, date:'2026-05-15' },
];

export default function Records() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [filter, setFilter] = useState('all');
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const filtered = filter === 'all' ? MOCK : MOCK.filter(r => r.type === filter);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <View style={s.filters}>
        {['all','income','expense'].map(f=>(
          <TouchableOpacity key={f} style={[s.chip, filter===f && s.chipActive]} onPress={()=>setFilter(f)}>
            <Text style={[s.chipTxt, filter===f && s.chipTxtActive]}>{(t as any)[f]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={i=>i.id} renderItem={({item})=>(
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.desc}>{lang==='af' ? item.desc : item.desc_en}</Text>
            <Text style={[s.amount, {color: item.type==='income' ? '#4ade80' : '#f87171'}]}>
              {item.type==='income' ? '+' : '-'}R{item.amount.toLocaleString()}
            </Text>
          </View>
          <Text style={s.date}>{item.date}</Text>
        </View>
      )} />
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#1c1007'}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:20,paddingTop:50},
  title:{fontSize:24,fontWeight:'bold',color:'#fef3c7'}, langRow:{flexDirection:'row',alignItems:'center',gap:6}, langLabel:{color:'#92400e',fontSize:12},
  filters:{flexDirection:'row',paddingHorizontal:16,gap:8,marginBottom:12},
  chip:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:'#292524'},
  chipActive:{backgroundColor:'#92400e'}, chipTxt:{color:'#d97706',fontSize:13}, chipTxtActive:{color:'#fff'},
  card:{backgroundColor:'#292524',margin:8,marginHorizontal:16,padding:16,borderRadius:10},
  cardRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  desc:{color:'#fef3c7',fontSize:15,fontWeight:'600'}, amount:{fontSize:16,fontWeight:'bold'},
  date:{color:'#92400e',fontSize:12,marginTop:4},
});
