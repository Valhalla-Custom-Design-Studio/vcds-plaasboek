import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { OfflineProvider } from '../src/context/OfflineContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <OfflineProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0C1A0F' } }}>
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="profile" options={{ presentation: 'modal', headerShown: true, title: 'Profiel', headerStyle: { backgroundColor: '#0C1A0F' }, headerTintColor: '#fff' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </OfflineProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
