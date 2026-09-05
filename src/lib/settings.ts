// File: src/lib/settings.ts
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rb.settings.v1';

export type Settings = { dailyLimit: number; recallMode: boolean };
export const DEFAULT_SETTINGS: Settings = { dailyLimit: 20, recallMode: true };

let cache: Settings = DEFAULT_SETTINGS;
const listeners = new Set<(s: Settings) => void>();

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) cache = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    // 読めない場合は既定値のまま
  }
  listeners.forEach((l) => l(cache));
  return cache;
}

export async function saveSettings(patch: Partial<Settings>) {
  cache = { ...cache, ...patch };
  await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l(cache));
}

export function useSettings(): Settings {
  const [s, setS] = useState<Settings>(cache);
  useEffect(() => {
    listeners.add(setS);
    loadSettings();
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}