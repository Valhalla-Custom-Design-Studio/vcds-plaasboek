import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors } from '../../src/theme';

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
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
        tabBarActiveTintColor: Colors.primary || '#D97706',
        tabBarInactiveTintColor: '#555555',
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
      }}
    >
      {tabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{tab.emoji}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
