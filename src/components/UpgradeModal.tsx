/**
 * VCDS™ UpgradeModal — Full-screen upgrade prompt
 * Triggered when user taps a locked feature
 */
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
  requiredTier?: 'pro' | 'platinum';
  subscribeRoute?: string;
  accentColor?: string;
  proFeatures?: string[];
  platinumFeatures?: string[];
}

export function UpgradeModal({
  visible, onClose, featureName, requiredTier = 'pro',
  subscribeRoute = '/subscribe', accentColor = '#C9A84C',
  proFeatures = [], platinumFeatures = [],
}: UpgradeModalProps) {
  const router = useRouter();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <LinearGradient colors={['#111827', '#1F2937']} style={styles.sheet}>
          <View style={styles.handle} />
          <Ionicons name="star" size={40} color={accentColor} style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={[styles.title, { color: accentColor }]}>
            {featureName ? `${featureName} is ` : ''}
            {requiredTier === 'platinum' ? 'Platinum Eksklusief' : 'Pro Funksie'}
          </Text>
          <Text style={styles.sub}>Ontsluit premium funksies met 'n opgradering.</Text>

          <ScrollView style={{ marginTop: 16 }} showsVerticalScrollIndicator={false}>
            {proFeatures.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>✦ Pro — R99/maand</Text>
                {proFeatures.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </>
            )}
            {platinumFeatures.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: accentColor, marginTop: 16 }]}>
                  ✦ Platinum — R199/maand
                </Text>
                {platinumFeatures.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={accentColor} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.cta, { backgroundColor: accentColor }]}
            onPress={() => { onClose(); router.push(subscribeRoute as any); }}
          >
            <Text style={styles.ctaText}>Gradeer Nou Op →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Nie nou nie</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#374151', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 8 },
  sectionLabel: { color: '#3B82F6', fontWeight: '700', fontSize: 13, marginBottom: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText: { color: '#D1D5DB', fontSize: 13 },
  cta: { marginTop: 24, paddingVertical: 14, borderRadius: 28, alignItems: 'center' },
  ctaText: { color: '#000', fontWeight: '800', fontSize: 16 },
  cancel: { marginTop: 12, alignItems: 'center' },
  cancelText: { color: '#6B7280', fontSize: 14 },
});
