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
    { name: 'journal', emoji: '📖' },
    { name: 'rainfall', emoji: '🌧️' },
    { name: 'livestock', emoji: '🐄' },
    { name: 'expenses', emoji: '💰' },
    { name: 'workers', emoji: '👷' },
    { name: 'emergencies', emoji: '🆘' },
  ];

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: Colors.tabBar, borderTopColor: Colors.surfaceBorder, height: 60 },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
    }}>
      {tabs.map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name}
          options={{
            title: t(`nav.${tab.name}`),
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{tab.emoji}</Text>,
          }}
        />
      ))}
    </Tabs>
  );
}
