import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { api } from '../src/services/api';
import { useLanguage } from '../src/context/LanguageContext';
import { useAuth } from '../src/context/AuthContext';
import { GlassCard } from '../src/components/GlassCard';
import { GradientButton } from '../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../src/theme';

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('auth.signOut'), 'Is jy seker jy wil afmeld?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.signOut'), style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.farm_name && <Text style={styles.farm}>🌾 {user.farm_name}</Text>}
        {user?.status === 'pending' && (
          <View style={styles.pendingBadge}><Text style={styles.pendingText}>⏳ {t('auth.pendingBanner')}</Text></View>
        )}
      </View>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Plaas Profiel</Text>
        {[
          { label: 'Plot Nommer', value: user?.plot_number },
          { label: 'Naaste Dorp', value: user?.nearest_town },
          { label: 'Alert Radius', value: user?.alert_radius_km ? `${user.alert_radius_km}km` : null },
        ].filter(i => i.value).map(({ label, value }) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ))}
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Navigasie</Text>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/emergencies/contacts')}>
          <Text style={styles.navItemText}>📞 Noodkontakte</Text>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/emergencies/medical-profile')}>
          <Text style={styles.navItemText}>🏥 Mediese Profiel</Text>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
        {user?.role === 'admin' && (
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/workers/admin-users')}>
            <Text style={styles.navItemText}>⚙️ Admin</Text>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        )}
      </GlassCard>

      <GlassCard style={styles.section}>
        <View style={styles.langRow}>
          <Text style={styles.langLabel}>Taal / Language</Text>
          <View style={styles.langToggle}>
            <TouchableOpacity style={[styles.langBtn, language === 'af' && styles.langBtnActive]} onPress={() => setLanguage('af')}>
              <Text style={[styles.langBtnText, language === 'af' && styles.langBtnTextActive]}>AF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.langBtn, language === 'en' && styles.langBtnActive]} onPress={() => setLanguage('en')}>
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.version}>Plaasboek v1.0.0</Text>
      </GlassCard>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 {t('auth.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '700', color: Colors.text },
  email: { color: Colors.textSecondary, marginTop: 2 },
  farm: { color: Colors.primary, marginTop: 4 },
  pendingBadge: { marginTop: 8, backgroundColor: '#f59e0b22', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.sm },
  pendingText: { color: '#f59e0b', fontWeight: '600', fontSize: 13 },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { color: Colors.textSecondary, fontSize: 14 },
  infoValue: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  navItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  navItemText: { color: Colors.text, fontSize: 16 },
  navArrow: { color: Colors.textSecondary, fontSize: 20 },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  langLabel: { color: Colors.text, fontSize: 16 },
  langToggle: { flexDirection: 'row', gap: Spacing.xs },
  langBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  langBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  langBtnText: { color: Colors.textSecondary, fontWeight: '700' },
  langBtnTextActive: { color: '#fff' },
  version: { color: Colors.textSecondary, textAlign: 'center', fontSize: 12 },
  logoutBtn: { backgroundColor: '#ef444422', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});
