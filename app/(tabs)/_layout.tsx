import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1c1007', borderTopColor: '#92400e', borderTopWidth: 1 },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#78716c',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tuis', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="records" options={{ title: 'Rekords', tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} /> }} />
      <Tabs.Screen name="expenses" options={{ title: 'Uitgawes', tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} /> }} />
      <Tabs.Screen name="livestock" options={{ title: 'Vee', tabBarIcon: ({ color, size }) => <Ionicons name="paw" size={size} color={color} /> }} />
      <Tabs.Screen name="workers" options={{ title: 'Werkers', tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Verslae', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Instellings', tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} /> }} />
    </Tabs>
  );
}
