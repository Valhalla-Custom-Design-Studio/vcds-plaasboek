import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PostHogProvider } from 'posthog-react-native';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from '../src/context/AuthContext';
import { OfflineProvider } from '../src/context/OfflineContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { FloatingSosButton } from '../src/components/FloatingSosButton';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { useOffline } from '../src/context/OfflineContext';
import { usePathname } from 'expo-router';

// ─── Sentry init ─────────────────────────────────────────────
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ||
    'https://1b6c309c189780c7ef9a9e8fea7096d3@o4511432712650752.ingest.de.sentry.io/4511461329666128',
  environment: process.env.APP_ENV || 'production',
  enableNative: true,
  tracesSampleRate: 0.2,
});

// ─── PostHog key ─────────────────────────────────────────────
const POSTHOG_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY ||
  'phc_w8M2RMQe86ghfbEgYUu4TWhgxZyL9EHDvPVLJBUcoxHC';

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
        <Stack.Screen
          name="subscription/index"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Profile',
            headerStyle: { backgroundColor: '#0C1A0F' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="records/index"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Records',
            headerStyle: { backgroundColor: '#0C1A0F' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      {showSos && <FloatingSosButton />}
    </>
  );
}

export default Sentry.wrap(function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PostHogProvider
        apiKey={POSTHOG_KEY}
        options={{ host: 'https://eu.i.posthog.com' }}
      >
        <LanguageProvider>
          <AuthProvider>
            <OfflineProvider>
              <InnerLayout />
            </OfflineProvider>
          </AuthProvider>
        </LanguageProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
});
