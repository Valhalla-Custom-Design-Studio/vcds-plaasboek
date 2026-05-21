import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const strings = {
  en: { title: "Plaasboek™", register: "Create Account", name: "Full name", email: "Email address", password: "Password", confirm: "Confirm password", terms: "I agree to the Terms & Privacy Policy", submit: "Create Account", have_account: "Already have an account?", login: "Log In" },
  af: { title: "Plaasboek™", register: "Skep Rekening", name: "Volle naam", email: "E-posadres", password: "Wagwoord", confirm: "Bevestig wagwoord", terms: "Ek stem saam met die Bepalings & Privaatheidsbeleid", submit: "Skep Rekening", have_account: "Het reeds 'n rekening?", login: "Teken In" },
};

export default function Register({ navigation }: any) {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) { Alert.alert('Error', lang==='af' ? 'Vul alle velde in' : 'Please fill in all fields'); return; }
    if (password !== confirm) { Alert.alert('Error', lang==='af' ? 'Wagwoorde stem nie ooreen nie' : 'Passwords do not match'); return; }
    if (!agreed) { Alert.alert('Error', lang==='af' ? 'Stem saam met bepalings' : 'Please agree to terms'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/register`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      await AsyncStorage.setItem('token', data.token);
      navigation?.replace('Home');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{paddingBottom:40}}>
      <View style={s.header}>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <View style={s.form}>
        <Text style={s.heading}>{t.register}</Text>
        <TextInput style={s.input} placeholder={t.name} placeholderTextColor="#64748b" value={name} onChangeText={setName} accessibilityLabel={t.name} />
        <TextInput style={s.input} placeholder={t.email} placeholderTextColor="#64748b" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" accessibilityLabel={t.email} />
        <TextInput style={s.input} placeholder={t.password} placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry accessibilityLabel={t.password} />
        <TextInput style={s.input} placeholder={t.confirm} placeholderTextColor="#64748b" value={confirm} onChangeText={setConfirm} secureTextEntry accessibilityLabel={t.confirm} />
        <TouchableOpacity style={s.termsRow} onPress={()=>setAgreed(!agreed)} accessibilityRole="checkbox" accessibilityState={{checked:agreed}}>
          <View style={[s.checkbox, agreed && {backgroundColor:'#92400e', borderColor:'#92400e'}]}>
            {agreed && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.termsText}>{t.terms}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.submitBtn, {backgroundColor:'#92400e'}]} onPress={handleRegister} disabled={loading} accessibilityRole="button">
          <Text style={s.submitTxt}>{loading ? '...' : t.submit}</Text>
        </TouchableOpacity>
        <View style={s.loginRow}>
          <Text style={s.loginPrompt}>{t.have_account} </Text>
          <TouchableOpacity onPress={()=>navigation?.navigate('Login')}><Text style={[s.loginLink, {color:'#92400e'}]}>{t.login}</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#1c1007'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:24,paddingTop:50,paddingBottom:10},
  title:{fontSize:24,fontWeight:'bold',color:'#f8fafc'},
  langRow:{flexDirection:'row',alignItems:'center',gap:6}, langLabel:{color:'#94a3b8',fontSize:12},
  form:{paddingHorizontal:24,paddingTop:10},
  heading:{fontSize:22,fontWeight:'bold',color:'#f1f5f9',marginBottom:20},
  input:{backgroundColor:'#1e293b',color:'#f1f5f9',padding:14,borderRadius:10,marginBottom:12,fontSize:15},
  termsRow:{flexDirection:'row',alignItems:'center',marginBottom:20,gap:10},
  checkbox:{width:22,height:22,borderRadius:4,borderWidth:2,borderColor:'#475569',alignItems:'center',justifyContent:'center'},
  checkmark:{color:'#fff',fontSize:14,fontWeight:'bold'},
  termsText:{color:'#94a3b8',fontSize:13,flex:1},
  submitBtn:{padding:16,borderRadius:10,alignItems:'center',marginBottom:20},
  submitTxt:{color:'#fff',fontWeight:'bold',fontSize:16},
  loginRow:{flexDirection:'row',justifyContent:'center'},
  loginPrompt:{color:'#94a3b8'}, loginLink:{fontWeight:'bold'},
});
