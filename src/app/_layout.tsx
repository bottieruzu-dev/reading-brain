// File: src/app/_layout.tsx
import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DataProvider, useData } from '../lib/store';
import Login from '../components/Login';
import { C } from '../lib/theme';

// Web環境（Netlifyなど）でCDNからアイコンフォントを確実に直接読み込む
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'expo-ionicons-cdn';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.type = 'text/css';
    style.appendChild(
      document.createTextNode(`
        @font-face {
          font-family: 'Ionicons';
          src: url('https://unpkg.com/@expo/vector-icons@latest/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
        }
      `)
    );
    document.head.appendChild(style);
  }
}

function Gate() {
  const { authReady, user } = useData();
  if (!authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 40 }}>📚</Text>
      </View>
    );
  }
  if (!user) return <Login />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="book/[id]" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DataProvider>
          <StatusBar style="light" />
          <Gate />
        </DataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}