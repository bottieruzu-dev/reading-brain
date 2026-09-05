// File: src/app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../lib/theme';
import { useData } from '../../lib/store';
import { dueCount } from '../../lib/srs';

export default function TabsLayout() {
  const { memos } = useData();
  const due = dueCount(memos);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.cyan,
        tabBarInactiveTintColor: C.sub,
        tabBarStyle: {
          backgroundColor: '#100E22',
          borderTopColor: C.line,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '本棚', tabBarIcon: ({ color, size }) => <Ionicons name="library" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="memos"
        options={{ title: '横断メモ', tabBarIcon: ({ color, size }) => <Ionicons name="documents" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: '復習',
          tabBarBadge: due > 0 ? (due > 99 ? '99+' : due) : undefined,
          tabBarBadgeStyle: { backgroundColor: C.pink, color: '#0B0A14', fontWeight: '900' },
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prompt"
        options={{ title: 'AI活用', tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} /> }}
      />
    </Tabs>
  );
}