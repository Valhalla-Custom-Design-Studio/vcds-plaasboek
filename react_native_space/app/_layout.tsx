import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthContext, useAuthProvider } from '../src/hooks/useAuth';
import * as Notifications from 'expo-notifications';
import { posthog } from '../../src/lib/posthog';
import { initSentry } from '../src/lib/sentry';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }),
});

initSentry();
posthog.capture('app_opened');

export default function RootLayout() {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="journal/[id]" />
        <Stack.Screen name="livestock/add" />
        <Stack.Screen name="expenses/add" />
        <Stack.Screen name="workers/[id]" />
        <Stack.Screen name="sos/index" />
        <Stack.Screen name="settings/index" />
      </Stack>
    </AuthContext.Provider>
  );
}
