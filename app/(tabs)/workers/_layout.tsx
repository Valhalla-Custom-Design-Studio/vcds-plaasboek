import { Stack } from 'expo-router';
import { Colors } from '../../../src/theme';

export default function WorkersLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: Colors.background },
      headerTintColor: Colors.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: Colors.background },
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
