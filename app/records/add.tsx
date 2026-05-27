
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL;
const INCOME_CATS = ['Livestock Sales','Crop Sales','Wool/Mohair','Dairy','Rental Income','Government Grant','Other Income'];
const EXPENSE_CATS = ['Feed & Supplements','Veterinary','Fuel','Labour','Equipment','Repairs','Seeds & Fertilizer','Insurance','Rates & Taxes','Electricity','Water','Other Expense'];

const T = {
  en: { title:'Add Record', type:'Type', income:'Income', expense:'Expense', category:'Category', description:'Description *', amount:'Amount (R) *', vat:'VAT Amount (R)', date:'Date', section:'Farm Section', tags:'Tags (comma separated)', aiParse:'🎙️ AI Parse from Text', aiPlaceholder:'Type or paste: "Sold 5 lambs for R4500"', parse:'Parse', save:'Save Record', saving:'Saving...', success:'Record saved!' },
  af: { title:'Voeg Rekord By', type:'Tipe', income:'Inkomste', expense:'Uitgawe', category:'Kategorie', description:'Beskrywing *', amount:'Bedrag (R) *', vat:'BTW Bedrag (R)', date:'Datum', section:'Plaasafdeling', tags:'Etikette (komma geskei)', aiParse:'🎙️ KI Ontleed van Teks', aiPlaceholder:'Tik of plak: "Verkoop 5 lammers vir R4500"', parse:'Ontleed', save:'Stoor Rekord', saving:'Stoor...', success:'Rekord gestoor!' },
};

export default function AddRecord() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [type, setType] = useState<'income'|'expense'>('income');
  const [category, setCategory] = useState('');
  const [form, setForm] = useState({ description:'', amount_zar:'', vat_amount:'', record_date: new Date().toISOString().split('T')[0], farm_section:'', tags:'' });
  const [aiText, setAiText] = useState('');
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const t = T[lang];
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const aiParse = async () => {
    if (!aiText.trim()) return;
    setParsing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API}/api/records/ai-parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (data.parsed) {
        setType(data.parsed.type);
        setCategory(data.parsed.category);
        setForm(p => ({ ...p, description: data.parsed.description, amount_zar: String(data.parsed.amount_zar || ''), record_date: data.parsed.record_date || p.record_date }));
      }
    } catch { Alert.alert('Error', 'AI parse failed'); }
    setParsing(false);
  };

  const save = async () => {
    if (!form.description || !form.amount_zar || !category) { Alert.alert('Error', lang === 'af' ? 'Vul alle verpligte velde in' : 'Fill in all required fields'); return; }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, type, category, amount_zar: Number(form.amount_zar), vat_amount: Number(form.vat_amount || 0), tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] }),
      });
      if (res.ok) { Alert.alert('✅', t.success, [{ text: 'OK', onPress: () => router.back() }]); }
      else { const e = await res.json(); Alert.alert('Error', e.error || 'Failed'); }
    } catch { Alert.alert('Error', 'Save failed'); }
    setSaving(false);
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={v => setLang(v ? 'af' : 'en')} trackColor={{true:'#92400e'}} thumbColor="#fff"/><Text style={s.langLabel}>AF</Text></View>
      </View>

      {/* AI Parser */}
      <View style={s.aiBox}>
        <Text style={s.aiLabel}>{t.aiParse}</Text>
        <TextInput style={s.aiInput} value={aiText} onChangeText={setAiText} placeholder={t.aiPlaceholder} placeholderTextColor="#92400e88" multiline />
        <TouchableOpacity style={[s.parseBtn, parsing && {opacity:0.6}]} onPress={aiParse} disabled={parsing}>
          {parsing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.parseTxt}>{t.parse}</Text>}
        </TouchableOpacity>
      </View>

      {/* Type Toggle */}
      <Text style={s.label}>{t.type}</Text>
      <View style={s.typeRow}>
        <TouchableOpacity style={[s.typeBtn, type==='income' && s.incomeActive]} onPress={() => { setType('income'); setCategory(''); }}>
          <Text style={[s.typeTxt, type==='income' && s.typeActiveTxt]}>📈 {t.income}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.typeBtn, type==='expense' && s.expenseActive]} onPress={() => { setType('expense'); setCategory(''); }}>
          <Text style={[s.typeTxt, type==='expense' && s.typeActiveTxt]}>📉 {t.expense}</Text>
        </TouchableOpacity>
      </View>

      {/* Category */}
      <Text style={s.label}>{t.category}</Text>
      <View style={s.catGrid}>
        {cats.map(c => (
          <TouchableOpacity key={c} style={[s.catBtn, category===c && s.catActive]} onPress={() => setCategory(c)}>
            <Text style={[s.catTxt, category===c && s.catActiveTxt]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {[
        { key:'description', label:t.description, multi:true },
        { key:'amount_zar', label:t.amount, keyboard:'numeric' as any },
        { key:'vat_amount', label:t.vat, keyboard:'numeric' as any },
        { key:'record_date', label:t.date },
        { key:'farm_section', label:t.section },
        { key:'tags', label:t.tags },
      ].map(f => (
        <View key={f.key}>
          <Text style={s.label}>{f.label}</Text>
          <TextInput style={[s.input, f.multi && {height:70,textAlignVertical:'top'}]} value={(form as any)[f.key]} onChangeText={v => set(f.key, v)} keyboardType={f.keyboard} multiline={f.multi} placeholderTextColor="#92400e88" />
        </View>
      ))}

      <TouchableOpacity style={[s.saveBtn, saving && {opacity:0.6}]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveTxt}>{t.save}</Text>}
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#1c1007'},
  header:{flexDirection:'row',alignItems:'center',padding:16,paddingTop:50,gap:8},
  back:{color:'#d97706',fontSize:22}, title:{flex:1,fontSize:20,fontWeight:'bold',color:'#fef3c7'},
  langRow:{flexDirection:'row',alignItems:'center',gap:4}, langLabel:{color:'#92400e',fontSize:11},
  aiBox:{margin:16,backgroundColor:'#292524',borderRadius:10,padding:14,borderWidth:1,borderColor:'#92400e'},
  aiLabel:{color:'#d97706',fontSize:13,fontWeight:'600',marginBottom:8},
  aiInput:{backgroundColor:'#1c1007',borderRadius:8,padding:10,color:'#fef3c7',fontSize:13,minHeight:50},
  parseBtn:{marginTop:8,backgroundColor:'#92400e',padding:10,borderRadius:8,alignItems:'center'},
  parseTxt:{color:'#fff',fontWeight:'bold',fontSize:13},
  label:{color:'#d97706',fontSize:13,marginHorizontal:16,marginTop:12,marginBottom:4},
  typeRow:{flexDirection:'row',gap:12,marginHorizontal:16},
  typeBtn:{flex:1,backgroundColor:'#292524',padding:14,borderRadius:8,alignItems:'center',borderWidth:1,borderColor:'#44403c'},
  incomeActive:{backgroundColor:'#14532d',borderColor:'#4ade80'},
  expenseActive:{backgroundColor:'#7f1d1d',borderColor:'#f87171'},
  typeTxt:{color:'#a8a29e',fontWeight:'600'}, typeActiveTxt:{color:'#fff'},
  catGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginHorizontal:16},
  catBtn:{backgroundColor:'#292524',paddingHorizontal:12,paddingVertical:7,borderRadius:20,borderWidth:1,borderColor:'#44403c'},
  catActive:{backgroundColor:'#92400e',borderColor:'#d97706'},
  catTxt:{color:'#a8a29e',fontSize:12}, catActiveTxt:{color:'#fff',fontWeight:'bold'},
  input:{backgroundColor:'#292524',marginHorizontal:16,borderRadius:8,padding:12,color:'#fef3c7',fontSize:14},
  saveBtn:{margin:16,backgroundColor:'#92400e',padding:16,borderRadius:10,alignItems:'center'},
  saveTxt:{color:'#fff',fontWeight:'bold',fontSize:16},
});
