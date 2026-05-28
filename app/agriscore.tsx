import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AgriScoreData {
  overall: number;
  livestock: number;
  finance: number;
  security: number;
  rainfall: number;
  lastUpdated: string;
  insights: string[];
  recommendations: string[];
}

const CACHE_KEY = 'plaasboek_agriscore';

const strings = {
  en: {
    title: 'AgriScore™',
    subtitle: 'Your farm's AI-powered health rating',
    overall: 'Overall Score',
    livestock: '🐄 Livestock', finance: '💰 Finance',
    security: '🔒 Security', rainfall: '🌧 Rainfall',
    insights: 'Insights', recommendations: 'Recommendations',
    lastUpdated: 'Last updated', loading: 'Calculating your AgriScore™...',
    noData: 'Add farm data to generate your AgriScore™',
    refresh: 'Refresh',
  },
  af: {
    title: 'AgriTelling™',
    subtitle: 'Jou plaas se KI-aangedrewe gesondheidstelling',
    overall: 'Algehele Telling',
    livestock: '🐄 Vee', finance: '💰 Finansies',
    security: '🔒 Sekuriteit', rainfall: '🌧 Reënval',
    insights: 'Insigte', recommendations: 'Aanbevelings',
    lastUpdated: 'Laas opgedateer', loading: 'Bereken jou AgriTelling™...',
    noData: 'Voeg plaasdata by om jou AgriTelling™ te genereer',
    refresh: 'Verfris',
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
};

export default function AgriScoreScreen() {
  const [lang] = useState<'en' | 'af'>('af');
  const t = strings[lang];
  const [data, setData] = useState<AgriScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadScore = async () => {
    try {
      // Try cache first (offline support)
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setData(JSON.parse(cached));
      }
      // Fetch live AgriScore from API
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/agriscore`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const liveScore: AgriScoreData = await response.json();
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(liveScore));
          setData(liveScore);
        } else if (!cached) {
          // No cache and API failed — show error state
          setData(null);
        }
      } catch (apiErr) {
        // Offline — use cache only, already set above
        if (!cached) setData(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadScore(); }, []);

  const onRefresh = () => { setRefreshing(true); loadScore(); };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noData}>{t.noData}</Text>
      </View>
    );
  }

  const scoreColor = getScoreColor(data.overall);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      {/* Main Score */}
      <View style={[styles.mainScore, { borderColor: scoreColor }]}>
        <Text style={[styles.scoreNumber, { color: scoreColor }]}>{data.overall}</Text>
        <Text style={[styles.scoreLabel, { color: scoreColor }]}>{getScoreLabel(data.overall)}</Text>
        <Text style={styles.outOf}>{t.overall} / 100</Text>
        <Text style={styles.lastUpdated}>{t.lastUpdated}: {data.lastUpdated}</Text>
      </View>

      {/* Sub-scores */}
      <View style={styles.subScores}>
        {([
          [t.livestock, data.livestock],
          [t.finance, data.finance],
          [t.security, data.security],
          [t.rainfall, data.rainfall],
        ] as [string, number][]).map(([label, score]) => (
          <View key={label} style={styles.subScoreCard}>
            <Text style={styles.subScoreLabel}>{label}</Text>
            <Text style={[styles.subScoreNumber, { color: getScoreColor(score) }]}>{score}</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${score}%` as any, backgroundColor: getScoreColor(score) }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 {t.insights}</Text>
        {data.insights.map((insight, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{insight}</Text>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ {t.recommendations}</Text>
        {data.recommendations.map((rec, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.bullet}>{i + 1}.</Text>
            <Text style={styles.listText}>{rec}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A1628' },
  loadingText: { color: '#22c55e', marginTop: 16, fontSize: 14 },
  noData: { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  header: { padding: 24, paddingTop: 48 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#22c55e', marginTop: 4 },
  mainScore: {
    marginHorizontal: 24, borderRadius: 20, padding: 32, alignItems: 'center',
    borderWidth: 3, backgroundColor: '#0F2035', marginBottom: 16,
  },
  scoreNumber: { fontSize: 72, fontWeight: 'bold' },
  scoreLabel: { fontSize: 20, fontWeight: '600', marginTop: 4 },
  outOf: { color: '#aaa', fontSize: 13, marginTop: 8 },
  lastUpdated: { color: '#666', fontSize: 12, marginTop: 4 },
  subScores: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  subScoreCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#0F2035',
    borderRadius: 16, padding: 16,
  },
  subScoreLabel: { color: '#ccc', fontSize: 13, marginBottom: 4 },
  subScoreNumber: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  barBg: { height: 6, backgroundColor: '#1a3a5c', borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#0F2035', borderRadius: 16, padding: 16, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 12 },
  listItem: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bullet: { color: '#22c55e', fontWeight: 'bold', fontSize: 14 },
  listText: { color: '#ccc', fontSize: 14, flex: 1, lineHeight: 20 },
});
