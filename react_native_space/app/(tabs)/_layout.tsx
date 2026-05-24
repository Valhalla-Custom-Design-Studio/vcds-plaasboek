import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { t } from '../../src/i18n';

export default function TabsLayout() {
  const { user, lang } = useAuth();
  if (!user) return <Redirect href="/auth/login" />;

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2D5016',
      tabBarInactiveTintColor: '#888',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e0e0e0' },
      headerStyle: { backgroundColor: '#2D5016' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Tabs.Screen name="index" options={{ title: t(lang,'home'), tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="journal" options={{ title: t(lang,'journal'), tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} /> }} />
      <Tabs.Screen name="livestock" options={{ title: t(lang,'livestock'), tabBarIcon: ({ color, size }) => <Ionicons name="paw" size={size} color={color} /> }} />
      <Tabs.Screen name="expenses" options={{ title: t(lang,'expenses'), tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
      <Tabs.Screen name="sos" options={{ title: 'SOS', tabBarIcon: ({ color, size }) => <Ionicons name="alert-circle" size={size} color={color} />, tabBarBadge: undefined }} />
    </Tabs>
  );
}
