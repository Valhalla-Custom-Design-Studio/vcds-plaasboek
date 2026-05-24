import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../src/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Nie Gevind Nie' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🌾</Text>
        <Text style={styles.title}>Hierdie bladsy bestaan nie.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Gaan terug na tuis</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.lg },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: Spacing.md },
  link: { marginTop: Spacing.sm },
  linkText: { color: Colors.primary, fontSize: 16, textDecorationLine: 'underline' },
});
