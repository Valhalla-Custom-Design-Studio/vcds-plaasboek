import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineSyncService } from '../../src/services/OfflineSyncService';
import type { FarmRecord } from '../../src/services/OfflineSyncService';

const strings = {
  en: { title: "Records", income: "Income", expense: "Expense", all: "All", add: "Add", date: "Date", amount: "Amount", category: "Category", offline: "Offline — cached data", loading: "Loading..." },
  af: { title: "Rekords", income: "Inkomste", expense: "Uitgawe", all: "Alles", add: "Voeg By", date: "Datum", amount: "Bedrag", category: "Kategorie", offline: "Vanlyn — kas-data", loading: "Laai..." },
};

export default function Records() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [filter, setFilter] = useState('all');
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const loadRecords = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token') ?? '';
      const data = await OfflineSyncService.getRecords(token);
      setRecords(data);
      const stale = await OfflineSyncService.isCacheStale();
      setIsOffline(stale && data.length > 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const onRefresh = () => { setRefreshing(true); loadRecords(); };

  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#92400e" /><Text style={s.loadingText}>{t.loading}</Text></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#92400e'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      {isOffline && <View style={s.offlineBanner}><Text style={s.offlineText}>📴 {t.offline}</Text></View>}
      <View style={s.filterRow}>
        {['all', 'income', 'expense'].map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter===f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter===f && s.filterTextActive]}>{t[f as keyof typeof t] as string}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#92400e" />}
        renderItem={({item}) => (
          <View style={[s.card, item.type==='income' ? s.incomeCard : s.expenseCard]}>
            <View style={s.cardRow}>
              <Text style={s.cardDesc}>{lang==='af' ? item.desc : item.desc_en}</Text>
              <Text style={[s.cardAmount, item.type==='income' ? s.incomeText : s.expenseText]}>
                {item.type==='income' ? '+' : '-'}R{item.amount.toLocaleString('en-ZA')}
              </Text>
            </View>
            <Text style={s.cardDate}>{item.date}</Text>
            {!item.synced && <Text style={s.pendingBadge}>⏳ Pending sync</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No records found.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#fef9f0'},
  center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#fef9f0'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,backgroundColor:'#92400e'},
  title:{fontSize:20,fontWeight:'700',color:'#fff'},
  langRow:{flexDirection:'row',alignItems:'center',gap:4},
  langLabel:{color:'#fff',fontSize:12},
  loadingText:{marginTop:8,color:'#92400e'},
  offlineBanner:{backgroundColor:'#fef3c7',padding:8,marginHorizontal:12,marginTop:8,borderRadius:6,borderWidth:1,borderColor:'#f59e0b'},
  offlineText:{color:'#92400e',fontSize:12,textAlign:'center'},
  filterRow:{flexDirection:'row',gap:8,padding:12},
  filterBtn:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:'#e5e7eb'},
  filterActive:{backgroundColor:'#92400e'},
  filterText:{color:'#374151',fontSize:13},
  filterTextActive:{color:'#fff'},
  card:{margin:8,marginHorizontal:12,padding:12,borderRadius:8,backgroundColor:'#fff',borderLeftWidth:4},
  incomeCard:{borderLeftColor:'#10b981'},
  expenseCard:{borderLeftColor:'#ef4444'},
  cardRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  cardDesc:{fontSize:14,fontWeight:'600',color:'#1f2937',flex:1},
  cardAmount:{fontSize:15,fontWeight:'700'},
  incomeText:{color:'#10b981'},
  expenseText:{color:'#ef4444'},
  cardDate:{fontSize:12,color:'#6b7280',marginTop:4},
  pendingBadge:{fontSize:10,color:'#f59e0b',marginTop:2},
  empty:{textAlign:'center',color:'#9ca3af',marginTop:40},
});
