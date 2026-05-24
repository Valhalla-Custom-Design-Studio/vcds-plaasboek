import { Stack } from 'expo-router';
import { Colors } from '../../../src/theme';

export default function EmergenciesLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: Colors.background },
      headerTintColor: Colors.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: Colors.background },
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="contacts" options={{ title: 'Noodkontakte', headerShown: true }} />
      <Stack.Screen name="medical-profile" options={{ title: 'Mediese Profiel', headerShown: true }} />
      <Stack.Screen name="farm-profile" options={{ title: 'Plaasprofiel', headerShown: true }} />
      <Stack.Screen name="sos-settings" options={{ title: 'SOS Instellings', headerShown: true }} />
      <Stack.Screen name="event/[id]" options={{ title: 'SOS Gebeurtenis', headerShown: true }} />
    </Stack>
  );
}
