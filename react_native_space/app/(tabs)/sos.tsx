import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Vibration, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import api from '../../src/services/api';
import { format } from 'date-fns';

export default function SOSTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [dms, setDms] = useState<any>(null);
  const [dmLoading, setDmLoading] = useState(false);
  const holdTimer = useRef<any>(null);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sosRes, dmsRes] = await Promise.all([
        api.get('/api/sos'),
        api.get('/api/sos/dms/status').catch(() => ({ data: null })),
      ]);
      setEvents(sosRes.data.events || []);
      setDms(dmsRes.data?.dms || null);
    } catch (e) { console.error(e); }
  };

  const triggerSOS = async () => {
    setLoading(true);
    Vibration.vibrate([0, 500, 200, 500]);
    try {
      let lat, lng;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      await api.post('/api/sos/trigger', { trigger_type: 'manual', latitude: lat, longitude: lng });
      Alert.alert('🚨 SOS GESTUUR', 'Jou noodkontakte is in kennis gestel. Bly kalm.');
      loadData();
    } catch (e: any) {
      Alert.alert('Fout', e?.response?.data?.message || 'SOS misluk');
    } finally { setLoading(false); }
  };

  const confirmSOS = () => {
    Alert.alert('🚨 BEVESTIG SOS', 'Dit sal jou noodkontakte per SMS en push-kennisgewing in kennis stel. Is jy seker?',
      [{ text: 'Kanselleer', style: 'cancel' }, { text: '🚨 STUUR SOS', style: 'destructive', onPress: triggerSOS }]
    );
  };

  const standDown = async (id: string) => {
    try {
      await api.post(`/api/sos/${id}/stand-down`);
      loadData();
    } catch { Alert.alert('Fout', 'Staan af misluk'); }
  };

  const dmHeartbeat = async () => {
    setDmLoading(true);
    try {
      await api.post('/api/sos/dms/heartbeat');
      Alert.alert('✅ Veilig', 'Dooie Man Skakelaar hernu');
      loadData();
    } catch { Alert.alert('Fout', 'Hartklop misluk'); }
    finally { setDmLoading(false); }
  };

  const toggleDMS = async () => {
    setDmLoading(true);
    try {
      if (dms?.is_armed) {
        await api.post('/api/sos/dms/disarm');
        Alert.alert('Gedeaktiveer', 'Dooie Man Skakelaar is gedeaktiveer');
      } else {
        await api.post('/api/sos/dms/arm', { interval_minutes: 60 });
        Alert.alert('Geaktiveer', 'Dooie Man Skakelaar is geaktiveer. Stuur elke 60 minute 'n hartklop.');
      }
      loadData();
    } catch { Alert.alert('Fout', 'DMS aksie misluk'); }
    finally { setDmLoading(false); }
  };

  const activeEvents = events.filter(e => e.status === 'active');

  return (
    <ScrollView style={s.container}>
      {activeEvents.length > 0 && (
        <View style={s.activeAlert}>
          <Text style={s.activeAlertText}>🚨 {activeEvents.length} AKTIEWE SOS NOODGEVAL</Text>
          {activeEvents.map(e => (
            <TouchableOpacity key={e.id} style={s.standDownBtn} onPress={() => standDown(e.id)}>
              <Text style={s.standDownText}>Staan Af — {format(new Date(e.createdAt), 'HH:mm dd MMM')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={s.sosBtn} onPress={confirmSOS} disabled={loading}>
        {loading ? <ActivityIndicator size="large" color="#fff" /> : (
          <>
            <Ionicons name="alert-circle" size={64} color="#fff" />
            <Text style={s.sosBtnText}>SOS</Text>
            <Text style={s.sosBtnSub}>Druk vir noodgeval</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={s.dmsCard}>
        <View style={s.dmsHeader}>
          <Ionicons name="timer-outline" size={24} color={dms?.is_armed ? '#F44336' : '#888'} />
          <Text style={s.dmsTitle}>Dooie Man Skakelaar</Text>
          <View style={[s.dmsBadge, { backgroundColor: dms?.is_armed ? '#F44336' : '#ccc' }]}>
            <Text style={s.dmsBadgeText}>{dms?.is_armed ? 'AKTIEF' : 'AF'}</Text>
          </View>
        </View>
        <Text style={s.dmsSub}>As jy nie elke {dms?.interval_minutes || 60} minute 'n hartklop stuur nie, word SOS outomaties gestuur.</Text>
        <View style={s.dmsActions}>
          <TouchableOpacity style={[s.dmsBtn, { backgroundColor: dms?.is_armed ? '#F44336' : '#2D5016' }]} onPress={toggleDMS} disabled={dmLoading}>
            <Text style={s.dmsBtnText}>{dms?.is_armed ? 'Deaktiveer' : 'Aktiveer'}</Text>
          </TouchableOpacity>
          {dms?.is_armed && (
            <TouchableOpacity style={[s.dmsBtn, { backgroundColor: '#4CAF50' }]} onPress={dmHeartbeat} disabled={dmLoading}>
              <Text style={s.dmsBtnText}>❤️ Ek is Veilig</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={s.historyTitle}>Geskiedenis</Text>
      {events.slice(0, 10).map(e => (
        <View key={e.id} style={s.historyCard}>
          <View style={[s.statusDot, { backgroundColor: e.status === 'active' ? '#F44336' : e.status === 'acknowledged' ? '#FF9800' : '#4CAF50' }]} />
          <View style={s.historyInfo}>
            <Text style={s.historyType}>{e.trigger_type.toUpperCase()} — {e.status}</Text>
            <Text style={s.historyDate}>{format(new Date(e.createdAt), 'dd MMM yyyy HH:mm')}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  activeAlert: { backgroundColor: '#F44336', padding: 16, margin: 16, borderRadius: 12 },
  activeAlertText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  standDownBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 10, marginTop: 8, alignItems: 'center' },
  standDownText: { color: '#fff', fontWeight: '600' },
  sosBtn: { backgroundColor: '#F44336', margin: 16, borderRadius: 20, padding: 40, alignItems: 'center', elevation: 8, shadowColor: '#F44336', shadowOpacity: 0.5, shadowRadius: 12 },
  sosBtnText: { color: '#fff', fontSize: 48, fontWeight: 'bold', marginTop: 8 },
  sosBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  dmsCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
  dmsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dmsTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#333' },
  dmsBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  dmsBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  dmsSub: { color: '#666', fontSize: 13, marginBottom: 12 },
  dmsActions: { flexDirection: 'row', gap: 8 },
  dmsBtn: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  dmsBtnText: { color: '#fff', fontWeight: 'bold' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', paddingHorizontal: 16, marginBottom: 8 },
  historyCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 6, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  historyInfo: { flex: 1 },
  historyType: { fontSize: 13, fontWeight: '600', color: '#333' },
  historyDate: { fontSize: 12, color: '#888', marginTop: 2 },
});
