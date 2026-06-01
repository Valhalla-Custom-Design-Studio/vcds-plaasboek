import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Vibration, Alert
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Colors, Radius } from '../theme';

const SOS_TYPES = [
  { key: 'attack', emoji: '🚨', color: Colors.attack },
  { key: 'medical', emoji: '🚑', color: Colors.medical },
  { key: 'fire', emoji: '🔥', color: Colors.fire },
  { key: 'general', emoji: '🆘', color: Colors.general },
];

export function FloatingSosButton() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isCounting, setIsCounting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPulse = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();
  };

  const stopPulse = () => { pulseAnim.stopAnimation(); pulseAnim.setValue(1); };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setCountdown(3);
    setIsCounting(true);
    startPulse();
    Vibration.vibrate([0, 200, 100, 200]);
    let count = 3;
    countdownRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownRef.current!);
        setIsCounting(false);
        stopPulse();
        fireSOS(type);
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsCounting(false);
    setSelectedType(null);
    stopPulse();
  };

  const fireSOS = async (type: string) => {
    setIsSending(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = user?.latitude || 0;
      let lng = user?.longitude || 0;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      // Layer 1 + 3: API call
      let notifiedCount = 0, smsCount = 0;
      try {
        const res = await api.post('/sos', { latitude: lat, longitude: lng, sosType: type });
        notifiedCount = res.data.notifiedCount;
        smsCount = res.data.smsCount;
      } catch {}
      // Layer 2: Device SMS
      const cachedContacts = await AsyncStorage.getItem('emergency_contacts');
      if (cachedContacts) {
        const contacts = JSON.parse(cachedContacts);
        const phones = contacts.map((c: any) => c.phone);
        const lang = user?.language === 'af' ? 'af' : 'en';
        const farmName = user?.farmName || user?.name || 'Plaas';
        const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
        const body = lang === 'af'
          ? `NOODGEVAL: ${type.toUpperCase()}\nPlaas: ${farmName}\nGPS: ${lat}, ${lng}\n${mapsLink}\nSTUUR HULP DADELIK`
          : `EMERGENCY: ${type.toUpperCase()}\nFarm: ${farmName}\nGPS: ${lat}, ${lng}\n${mapsLink}\nSEND HELP IMMEDIATELY`;
        const available = await SMS.isAvailableAsync();
        if (available && phones.length > 0) {
          await SMS.sendSMSAsync(phones, body);
        }
      }
      Alert.alert(t('sos.sent_'), `${t('sos.sent_')} \u2014 ${notifiedCount} push, ${smsCount} SMS`);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setIsSending(false);
      setShowModal(false);
      setSelectedType(null);
    }
  };

  const typeColor = SOS_TYPES.find(s => s.key === selectedType)?.color || Colors.error;

  return (
    <>
      <Animated.View style={[styles.fabWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Text style={styles.fabText}>🆘</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.overlay}>
          {isCounting ? (
            <View style={[styles.countdownBox, { backgroundColor: typeColor }]}>
              <Text style={styles.countdownText}>SOS in {countdown}...</Text>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelCountdown}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          ) : isSending ? (
            <View style={styles.countdownBox}>
              <Text style={styles.countdownText}>{t('sos.sending')}</Text>
            </View>
          ) : (
            <View style={styles.typeModal}>
              <Text style={styles.chooseText}>{t('sos.chooseType')}</Text>
              <View style={styles.typeGrid}>
                {SOS_TYPES.map(s => (
                  <TouchableOpacity key={s.key} style={[styles.typeBtn, { backgroundColor: s.color }]} onPress={() => handleTypeSelect(s.key)}>
                    <Text style={styles.typeEmoji}>{s.emoji}</Text>
                    <Text style={styles.typeLabel}>{t(`sos.${s.key}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrapper: { position: 'absolute', bottom: 90, right: 20, zIndex: 999 },
  fab: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.error,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 10,
  },
  fabText: { fontSize: 28 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  countdownBox: {
    width: '100%', padding: 40, borderRadius: Radius.xl,
    alignItems: 'center', backgroundColor: Colors.error,
  },
  countdownText: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 32, paddingVertical: 12, borderRadius: Radius.full },
  cancelText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  typeModal: { width: '100%', backgroundColor: '#1A2E1F', borderRadius: Radius.xl, padding: 24 },
  chooseText: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  typeBtn: { width: '45%', padding: 20, borderRadius: Radius.lg, alignItems: 'center' },
  typeEmoji: { fontSize: 36, marginBottom: 8 },
  typeLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { marginTop: 16, alignItems: 'center', padding: 12 },
});
