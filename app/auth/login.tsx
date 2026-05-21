import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const strings = {
  en: { title: "Plaasboek™", login: "Log In", email: "Email address", password: "Password", forgot: "Forgot password?", no_account: "Don't have an account?", register: "Register", or: "or", google: "Continue with Google" },
  af: { title: "Plaasboek™", login: "Teken In", email: "E-posadres", password: "Wagwoord", forgot: "Wagwoord vergeet?", no_account: "Geen rekening nie?", register: "Registreer", or: "of", google: "Gaan voort met Google" },
};

export default function Login({ navigation }: any) {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', lang==='af' ? 'Vul alle velde in' : 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      await AsyncStorage.setItem('token', data.token);
      navigation?.replace('Home');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <View style={s.form}>
        <TextInput style={s.input} placeholder={t.email} placeholderTextColor="#64748b" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" accessibilityLabel={t.email} />
        <TextInput style={s.input} placeholder={t.password} placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry accessibilityLabel={t.password} />
        <TouchableOpacity style={s.forgot}><Text style={[s.forgotTxt, {color:'#92400e'}]}>{t.forgot}</Text></TouchableOpacity>
        <TouchableOpacity style={[s.loginBtn, {backgroundColor:'#92400e'}]} onPress={handleLogin} disabled={loading} accessibilityRole="button" accessibilityLabel={t.login}>
          <Text style={s.loginTxt}>{loading ? '...' : t.login}</Text>
        </TouchableOpacity>
        <Text style={s.orTxt}>{t.or}</Text>
        <TouchableOpacity style={s.googleBtn} accessibilityRole="button" accessibilityLabel={t.google}>
          <Text style={s.googleTxt}>{t.google}</Text>
        </TouchableOpacity>
        <View style={s.registerRow}>
          <Text style={s.registerPrompt}>{t.no_account} </Text>
          <TouchableOpacity onPress={()=>navigation?.navigate('Register')}><Text style={[s.registerLink, {color:'#92400e'}]}>{t.register}</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#1c1007',justifyContent:'center'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:24,paddingTop:50,paddingBottom:20},
  title:{fontSize:26,fontWeight:'bold',color:'#f8fafc'},
  langRow:{flexDirection:'row',alignItems:'center',gap:6}, langLabel:{color:'#94a3b8',fontSize:12},
  form:{paddingHorizontal:24},
  input:{backgroundColor:'#1e293b',color:'#f1f5f9',padding:14,borderRadius:10,marginBottom:12,fontSize:15},
  forgot:{alignSelf:'flex-end',marginBottom:16}, forgotTxt:{fontSize:13},
  loginBtn:{padding:16,borderRadius:10,alignItems:'center',marginBottom:16},
  loginTxt:{color:'#fff',fontWeight:'bold',fontSize:16},
  orTxt:{textAlign:'center',color:'#64748b',marginBottom:16},
  googleBtn:{padding:14,borderRadius:10,alignItems:'center',backgroundColor:'#1e293b',marginBottom:20},
  googleTxt:{color:'#f1f5f9',fontWeight:'600'},
  registerRow:{flexDirection:'row',justifyContent:'center'},
  registerPrompt:{color:'#94a3b8'}, registerLink:{fontWeight:'bold'},
});
