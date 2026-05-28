import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Vibration,
  Alert, Animated, Platform
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COOLDOWN_MS = 60000; // 60 second cooldown
const CONTACTS_KEY = 'plaasboek_emergency_contacts';
const LAST_SOS_KEY = 'plaasboek_last_sos';

const strings = {
  en: {
    title: 'Farm SOS',
    subtitle: 'Emergency alert system',
    panic: 'PANIC',
    hold: 'Hold 3 seconds to activate',
    sending: 'Sending Alert...',
    sent: 'Alert Sent',
    cooldown: 'Cooldown active',
    location: 'Getting location...',
    contacts: 'Emergency Contacts',
    addContacts: 'Add emergency contacts in Settings',
    cancel: 'Cancel',
    confirm: 'Confirm SOS?',
    confirmMsg: 'This will alert all emergency contacts with your GPS location.',
    lastSent: 'Last sent',
    noContacts: 'No emergency contacts set',
  },
  af: {
    title: 'Plaas SOS',
    subtitle: 'Noodalertstelsel',
    panic: 'PANIEK',
    hold: 'Hou 3 sekondes om te aktiveer',
    sending: 'Stuur Alert...',
    sent: 'Alert Gestuur',
    cooldown: 'Afkoel aktief',
    location: 'Kry ligging...',
    contacts: 'Noodkontakte',
    addContacts: 'Voeg noodkontakte by in Instellings',
    cancel: 'Kanselleer',
    confirm: 'Bevestig SOS?',
    confirmMsg: 'Dit sal alle noodkontakte met jou GPS-ligging waarsku.',
    lastSent: 'Laas gestuur',
    noContacts: 'Geen noodkontakte gestel nie',
  }
};

export default function FarmSOSScreen() {
  const [lang] = useState<'en' | 'af'>('af');
  const t = strings[lang];
  const [status, setStatus] = useState<'idle' | 'holding' | 'sending' | 'sent' | 'cooldown'>('idle');
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [contacts, setContacts] = useState<any[]>([]);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const holdTimer = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cooldownInterval = useRef<any>(null);

  useEffect(() => {
    loadContacts();
    checkCooldown();
    return () => {
      clearTimeout(holdTimer.current);
      clearInterval(cooldownInterval.current);
    };
  }, []);

  const loadContacts = async () => {
    const stored = await AsyncStorage.getItem(CONTACTS_KEY);
    if (stored) setContacts(JSON.parse(stored));
    const last = await AsyncStorage.getItem(LAST_SOS_KEY);
    if (last) setLastSent(last);
  };

  const checkCooldown = async () => {
    const lastSosTime = await AsyncStorage.getItem('plaasboek_last_sos_time');
    if (lastSosTime) {
      const elapsed = Date.now() - parseInt(lastSosTime);
      if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        setCooldownLeft(remaining);
        setStatus('cooldown');
        startCooldownTimer(remaining);
      }
    }
  };

  const startCooldownTimer = (seconds: number) => {
    let remaining = seconds;
    cooldownInterval.current = setInterval(() => {
      remaining--;
      setCooldownLeft(remaining);
      if (remaining <= 0) {
        clearInterval(cooldownInterval.current);
        setStatus('idle');
      }
    }, 1000);
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  const onPressIn = () => {
    if (status !== 'idle') return;
    setStatus('holding');
    startPulse();
    Vibration.vibrate(200);
    holdTimer.current = setTimeout(() => {
      stopPulse();
      triggerSOS();
    }, 3000);
  };

  const onPressOut = () => {
    if (status === 'holding') {
      clearTimeout(holdTimer.current);
      stopPulse();
      setStatus('idle');
    }
  };

  const triggerSOS = async () => {
    setStatus('sending');
    Vibration.vibrate([0, 300, 100, 300, 100, 300]);

    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      let locationText = 'Location unavailable';
      if (locStatus === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        locationText = `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`;
      }

      // Wire BulkSMS SOS alert via backend API
      await fetch(`${API_BASE}/sos`, {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ location: locationText, contacts }),
      // });

      const timestamp = new Date().toLocaleString();
      await AsyncStorage.setItem(LAST_SOS_KEY, timestamp);
      await AsyncStorage.setItem('plaasboek_last_sos_time', Date.now().toString());
      setLastSent(timestamp);
      setStatus('sent');

      setTimeout(() => {
        setStatus('cooldown');
        setCooldownLeft(COOLDOWN_MS / 1000);
        startCooldownTimer(COOLDOWN_MS / 1000);
      }, 3000);

    } catch (e) {
      setStatus('idle');
      Alert.alert('Error', 'Failed to send SOS. Please try again.');
    }
  };

  const btnColor = status === 'idle' ? '#ef4444'
    : status === 'holding' ? '#f97316'
    : status === 'sent' ? '#22c55e'
    : status === 'cooldown' ? '#6b7280'
    : '#f59e0b';

  const btnText = status === 'sending' ? t.sending
    : status === 'sent' ? t.sent
    : status === 'cooldown' ? `${t.cooldown} ${cooldownLeft}s`
    : t.panic;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      <View style={styles.sosCentered}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.sosBtn, { backgroundColor: btnColor }]}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={0.8}
            disabled={status === 'sending' || status === 'sent' || status === 'cooldown'}
          >
            <Text style={styles.sosBtnText}>{btnText}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.holdHint}>{t.hold}</Text>
        {lastSent && (
          <Text style={styles.lastSent}>{t.lastSent}: {lastSent}</Text>
        )}
      </View>

      <View style={styles.contactsSection}>
        <Text style={styles.contactsTitle}>📞 {t.contacts}</Text>
        {contacts.length === 0 ? (
          <Text style={styles.noContacts}>{t.addContacts}</Text>
        ) : (
          contacts.slice(0, 3).map((c: any, i: number) => (
            <View key={i} style={styles.contactCard}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactPhone}>{c.phone}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  header: { padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#ef4444', marginTop: 4 },
  sosCentered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sosBtn: {
    width: 200, height: 200, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
    elevation: 12, shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 30, shadowOpacity: 0.8,
  },
  sosBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 28, letterSpacing: 4 },
  holdHint: { color: '#888', fontSize: 13, marginTop: 24 },
  lastSent: { color: '#666', fontSize: 12, marginTop: 8 },
  contactsSection: { padding: 24 },
  contactsTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 12 },
  noContacts: { color: '#888', fontSize: 14 },
  contactCard: {
    backgroundColor: '#0F2035', borderRadius: 12, padding: 12,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between',
  },
  contactName: { color: '#fff', fontWeight: '600' },
  contactPhone: { color: '#22c55e' },
});
