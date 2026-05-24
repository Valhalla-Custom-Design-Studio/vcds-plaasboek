import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => setToken(t));
  }, []);

  useEffect(() => {
    if (token === undefined) return;
    const inAuth = segments[0] === 'auth';
    if (!token && !inAuth) {
      router.replace('/auth/login');
    } else if (token && inAuth) {
      router.replace('/(tabs)');
    }
  }, [token, segments]);

  if (token === undefined) {
    return <View style={{ flex: 1, backgroundColor: '#1c1007', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#92400e" size="large" /></View>;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
    </Stack>
  );
}
