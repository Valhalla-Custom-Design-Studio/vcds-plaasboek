import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../src/theme';

export default function Index() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!user) return <Redirect href="/auth/login" />;
  return <Redirect href="/(tabs)/journal" />;
}
