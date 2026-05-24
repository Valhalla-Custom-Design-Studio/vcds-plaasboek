import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../src/services/api';
import { format } from 'date-fns';

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [worker, setWorker] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/api/workers/${id}`), api.get(`/api/workers/${id}/logs`)]).then(([w, l]) => {
      setWorker(w.data.worker);
      setLogs(l.data.logs || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#2D5016" /></View>;
  if (!worker) return <View style={s.center}><Text>Werker nie gevind nie</Text></View>;

  const totalDays = logs.length;
  const totalEarned = logs.reduce((sum: number, l: any) => sum + (parseFloat(l.hours_worked) / 8) * (worker.daily_rate || 0), 0);

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <View style={s.avatar}><Text style={s.avatarText}>{worker.name[0]}</Text></View>
        <Text style={s.name}>{worker.name}</Text>
        <Text style={s.role}>{worker.role || 'Werker'}</Text>
      </View>
      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statVal}>{totalDays}</Text><Text style={s.statLabel}>Dae Gewerk</Text></View>
        <View style={s.stat}><Text style={s.statVal}>R{totalEarned.toFixed(0)}</Text><Text style={s.statLabel}>Totaal Verdien</Text></View>
        <View style={s.stat}><Text style={s.statVal}>R{worker.daily_rate || 0}</Text><Text style={s.statLabel}>Per Dag</Text></View>
      </View>
      <Text style={s.sectionTitle}>Daaglikse Logs</Text>
      {logs.map((l: any) => (
        <View key={l.id} style={s.logCard}>
          <Text style={s.logDate}>{format(new Date(l.date), 'dd MMM yyyy')}</Text>
          <Text style={s.logHours}>{l.hours_worked}h</Text>
          {l.task && <Text style={s.logTask}>{l.task}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#2D5016', padding: 32, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  role: { color: '#c8e6c9', fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#2D5016' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', paddingHorizontal: 16, marginBottom: 8 },
  logCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 6, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logDate: { flex: 1, fontSize: 14, color: '#333' },
  logHours: { fontSize: 14, fontWeight: 'bold', color: '#2D5016' },
  logTask: { fontSize: 12, color: '#888' },
});
