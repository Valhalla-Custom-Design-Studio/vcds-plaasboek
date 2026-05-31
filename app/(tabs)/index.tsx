import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { OfflineSyncService } from '../../src/services/OfflineSyncService';
import { Colors, Shadow, Spacing, Radius, PlatinumTokens } from '../../src/theme';
import { PlatinumCard } from '../../src/components/ui/PlatinumCard';
import { SectionHeader } from '../../src/components/ui/SectionHeader';

const strings = {
  en: {
    title: 'Plaasboek™', subtitle: 'Farm Record Keeping',
    thisMonth: 'This Month', income: 'Income', expenses: 'Expenses', net: 'Net',
    addRecord: '+ Add Record', reports: 'Reports', livestock: 'Livestock',
    workers: 'Workers', greeting: 'Good morning, Boer!',
  },
  af: {
    title: 'Plaasboek™', subtitle: 'Plaasrekordhouding',
    thisMonth: 'Hierdie Maand', income: 'Inkomste', expenses: 'Uitgawes', net: 'Netto',
    addRecord: '+ Voeg Rekord By', reports: 'Verslae', livestock: 'Vee',
    workers: 'Werkers', greeting: 'Goeie môre, Boer!',
  },
};

export default function Dashboard() {
  const [lang, setLang] = useState<'en' | 'af'>('af');
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expenses: 0 });
  const router = useRouter();
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => {
    const l = v ? 'af' : 'en';
    setLang(l);
    AsyncStorage.setItem('lang', l);
  };

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
  const fmt = (n: number) =>
    `R${Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  const quickActions = [
    { emoji: '🐄', label: t.livestock, route: '/(tabs)/livestock' },
    { emoji: '👷', label: t.workers, route: '/(tabs)/workers' },
    { emoji: '📊', label: t.reports, route: '/(tabs)/reports' },
    { emoji: '💰', label: t.expenses, route: '/(tabs)/expenses' },
    { emoji: '🧠', label: 'PatternLearn™', route: '/(tabs)/pattern-learn' },
    { emoji: '🌾', label: 'AgriScore™', route: '/agriscore' },
  ];

  return (
    <ScrollView
      style={s.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadSummary(); }}
          tintColor={Colors.gold || '#F59E0B'}
        />
      }
    >
      {/* Hero Header */}
      <LinearGradient
        colors={['#0C1A0F', '#132218', '#1A2E1F']}
        style={s.hero}
      >
        <View style={s.heroRow}>
          <View>
            <Text style={s.title}>{t.title}</Text>
            <Text style={s.subtitle}>{t.subtitle}</Text>
          </View>
          <View style={s.langRow}>
            <Text style={s.langLabel}>EN</Text>
            <Switch
              value={lang === 'af'}
              onValueChange={toggleLang}
              trackColor={{ true: Colors.primary || '#15803D', false: '#374151' }}
              thumbColor={Colors.gold || '#F59E0B'}
            />
            <Text style={s.langLabel}>AF</Text>
          </View>
        </View>
        <Text style={s.greeting}>{t.greeting}</Text>
      </LinearGradient>

      <View style={s.body}>
        {/* Monthly Summary */}
        <SectionHeader title={t.thisMonth} />
        <View style={s.summaryRow}>
          <PlatinumCard style={s.statCard} accentColor="#22C55E">
            <Text style={s.statLabel}>{t.income}</Text>
            <Text style={[s.statAmt, { color: '#4ADE80' }]}>{fmt(summary.income)}</Text>
          </PlatinumCard>
          <PlatinumCard style={s.statCard} accentColor="#EF4444">
            <Text style={s.statLabel}>{t.expenses}</Text>
            <Text style={[s.statAmt, { color: '#F87171' }]}>{fmt(summary.expenses)}</Text>
          </PlatinumCard>
        </View>

        {/* Net Card */}
        <PlatinumCard
          style={s.netCard}
          accentColor={net >= 0 ? '#22C55E' : '#EF4444'}
          glowColor={net >= 0 ? '#22C55E' : '#EF4444'}
        >
          <Text style={s.netLabel}>{t.net}</Text>
          <Text style={[s.netAmt, { color: net >= 0 ? '#4ADE80' : '#F87171' }]}>
            {net < 0 ? '-' : ''}{fmt(net)}
          </Text>
        </PlatinumCard>

        {/* Add Record CTA */}
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push('/records/add' as any)}
        >
          <LinearGradient
            colors={[Colors.primary || '#15803D', Colors.primaryLight || '#22C55E']}
            style={s.addBtnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={s.addTxt}>{t.addRecord}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <SectionHeader title="Vinnige Aksies" />
        <View style={s.quickGrid}>
          {quickActions.map(({ emoji, label, route }) => (
            <TouchableOpacity
              key={route}
              style={s.quickBtn}
              onPress={() => router.push(route as any)}
            >
              <PlatinumCard style={s.quickCard}>
                <Text style={s.quickIcon}>{emoji}</Text>
                <Text style={s.quickLabel}>{label}</Text>
              </PlatinumCard>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#0C1A0F' },
  hero: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#F0FDF4' },
  subtitle: { fontSize: 12, color: Colors.primary || '#15803D', fontWeight: '600' },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langLabel: { color: '#86EFAC', fontSize: 12, fontWeight: '600' },
  greeting: { color: '#F0FDF4', fontSize: 16, marginTop: 4 },
  body: { padding: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1 },
  statLabel: { color: '#86EFAC', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statAmt: { fontSize: 18, fontWeight: '800' },
  netCard: { marginBottom: 16 },
  netLabel: { color: '#F0FDF4', fontSize: 14, fontWeight: '600' },
  netAmt: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  addBtn: { marginBottom: 20, borderRadius: 12, overflow: 'hidden' },
  addBtnGradient: { padding: 16, alignItems: 'center', borderRadius: 12 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  quickBtn: { width: '47%' },
  quickCard: { alignItems: 'center', paddingVertical: 16 },
  quickIcon: { fontSize: 28, marginBottom: 6 },
  quickLabel: { color: '#F0FDF4', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
