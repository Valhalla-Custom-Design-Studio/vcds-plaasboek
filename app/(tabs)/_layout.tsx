import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Shadow } from '../../src/theme';

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  if (!isLoading && !user) return <Redirect href="/auth/login" />;

  const tabs = [
    { name: 'index', emoji: '🏠', label: 'Tuis' },
    { name: 'journal', emoji: '📖', label: 'Joernaal' },
    { name: 'rainfall', emoji: '🌧️', label: 'Reën' },
    { name: 'livestock', emoji: '🐄', label: 'Vee' },
    { name: 'expenses', emoji: '💰', label: 'Uitgawes' },
    { name: 'workers', emoji: '👷', label: 'Werkers' },
    { name: 'emergencies', emoji: '🆘', label: 'Nood' },
    { name: 'watchlist', emoji: '👁️', label: 'Waglys' },
    { name: 'community', emoji: '🌾', label: 'Gemeenskap' },
    { name: 'pattern-learn', emoji: '🧠', label: 'PatternLearn™' },
    { name: 'reports', emoji: '📊', label: 'Verslae' },
    { name: 'settings', emoji: '⚙️', label: 'Instellings' },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.gold || '#F59E0B',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarStyle: {
          backgroundColor: Colors.tabBar || '#0F1F13',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          ...Shadow.sm,
        },
        tabBarLabelStyle: { fontSize: 10, marginBottom: 2, fontWeight: '600' },
      }}
    >
      {tabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, focused }) => (
              <Text style={{
                fontSize: 20,
                color,
                ...(focused ? Shadow.glow(Colors.gold || '#F59E0B') : {}),
              }}>
                {tab.emoji}
              </Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
