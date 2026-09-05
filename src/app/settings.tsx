// File: src/app/settings.tsx
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Btn, Field, Screen, Title, useToast } from '../components/ui';
import { C } from '../lib/theme';
import { useData } from '../lib/store';
import { saveSettings, useSettings } from '../lib/settings';

export default function SettingsScreen() {
  const { user, signOut, exportJson, importJson } = useData();
  const settings = useSettings();
  const toast = useToast();
  const [limitStr, setLimitStr] = useState(String(settings.dailyLimit));
  const [importText, setImportText] = useState('');

  const handleSave = async () => {
    const n = parseInt(limitStr, 10);
    if (!isNaN(n) && n > 0) {
      await saveSettings({ dailyLimit: n });
      toast.show('保存しました');
    }
  };

  const handleExport = async () => {
    const json = exportJson();
    await Clipboard.setStringAsync(json);
    toast.show('クリップボードにコピーしました');
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    try {
      const count = await importJson(importText);
      setImportText('');
      toast.show(`${count}件のデータを復元しました`);
    } catch (e) {
      toast.show('データの読み込みに失敗しました');
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, padding: 20 }}>
        <Title sub={user?.email || ''}>設定</Title>
        <View style={{ height: 20 }} />

        <Text style={{ color: C.text, fontWeight: '800', marginBottom: 8 }}>復習の設定</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Field label="1日の出題上限（枚）" value={limitStr} onChangeText={setLimitStr} />
          </View>
          <View style={{ width: 80, marginBottom: 12 }}>
            <Btn label="変更" onPress={handleSave} />
          </View>
        </View>

        <Text style={{ color: C.text, fontWeight: '800', marginBottom: 8 }}>データバックアップ</Text>
        <Btn label="全データをJSONでエクスポート (コピー)" kind="ghost" icon="download-outline" onPress={handleExport} />
        <View style={{ height: 16 }} />

        <Field label="JSONからインポート (復元)" value={importText} onChangeText={setImportText} multiline minHeight={80} placeholder='{"version": 1, ...}' />
        <Btn label="復元を実行" kind="danger" icon="push-outline" onPress={handleImport} />

        <View style={{ flex: 1 }} />
        <Btn
          label="ログアウト"
          kind="ghost"
          icon="log-out-outline"
          onPress={async () => {
            await signOut();
            router.replace('/');
          }}
        />
      </View>
      {toast.node}
    </Screen>
  );
}
