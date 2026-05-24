import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/context/AuthContext';
import { OfflineProvider } from '../src/context/OfflineContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { FloatingSosButton } from '../src/components/FloatingSosButton';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { useOffline } from '../src/context/OfflineContext';
import { usePathname } from 'expo-router';

function InnerLayout() {
  const { isOnline, isSyncing, pendingCount } = useOffline();
  const pathname = usePathname();
  const showSos = pathname.startsWith('/(tabs)');

  return (
    <>
      <StatusBar style="light" backgroundColor="#0C1A0F" />
      <OfflineBanner isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingCount} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0C1A0F' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" options={{ presentation: 'modal', headerShown: true, title: 'Profile', headerStyle: { backgroundColor: '#0C1A0F' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="records/index" options={{ presentation: 'modal', headerShown: true, title: 'Records', headerStyle: { backgroundColor: '#0C1A0F' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      {showSos && <FloatingSosButton />}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <AuthProvider>
          <OfflineProvider>
            <InnerLayout />
          </OfflineProvider>
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
