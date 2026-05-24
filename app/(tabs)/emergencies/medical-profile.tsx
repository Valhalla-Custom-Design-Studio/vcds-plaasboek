import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { GradientButton } from '../../../src/components/GradientButton';
import { Colors, Spacing, Radius } from '../../../src/theme';

export default function MedicalProfileScreen() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    bloodType: user?.bloodType || '', allergies: user?.allergies || '',
    chronicConditions: user?.chronicConditions || '', medications: user?.medications || '',
    medicalAidName: user?.medicalAidName || '', medicalAidNumber: user?.medicalAidNumber || '',
    nearestHospital: user?.nearestHospital || '', doctorName: user?.doctorName || '', doctorPhone: user?.doctorPhone || '',
  });
  const [saving, setSaving] = useState(false);

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try { await updateUser(form); Alert.alert(t('common.success'), t('common.saved')); }
    catch (err: any) { Alert.alert(t('common.error'), err.message); }
    finally { setSaving(false); }
  };

  const fields = [
    { key: 'bloodType', label: t('medical.bloodType') },
    { key: 'allergies', label: t('medical.allergies'), multi: true },
    { key: 'chronicConditions', label: t('medical.chronicConditions'), multi: true },
    { key: 'medications', label: t('medical.medications'), multi: true },
    { key: 'medicalAidName', label: t('medical.medicalAidName') },
    { key: 'medicalAidNumber', label: t('medical.medicalAidNumber') },
    { key: 'nearestHospital', label: t('medical.nearestHospital') },
    { key: 'doctorName', label: t('medical.doctorName') },
    { key: 'doctorPhone', label: t('medical.doctorPhone'), phone: true },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t('medical.title')}</Text>
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>🏥 {t('medical.info')}</Text>
      </View>
      {fields.map(({ key, label, multi, phone }) => (
        <View key={key}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[styles.input, multi && styles.textarea]}
            value={(form as any)[key]}
            onChangeText={v => update(key, v)}
            placeholder={label}
            placeholderTextColor={Colors.textMuted}
            multiline={multi}
            numberOfLines={multi ? 3 : 1}
            keyboardType={phone ? 'phone-pad' : 'default'}
          />
        </View>
      ))}
      <GradientButton title={t('common.save')} onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: 60, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, fontFamily: 'Georgia', marginBottom: 16 },
  infoBanner: { backgroundColor: Colors.primary + '22', borderRadius: Radius.md, padding: 12, marginBottom: 20 },
  infoText: { color: Colors.primary, fontSize: 14 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: { height: 52, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radius.md, paddingHorizontal: 16, color: Colors.textPrimary, fontSize: 16 },
  textarea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
});
