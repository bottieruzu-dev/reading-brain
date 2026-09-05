// File: src/components/Login.tsx
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Btn, Field, Screen } from './ui';
import { C, GRAD_MAIN } from '../lib/theme';
import { useData } from '../lib/store';

export default function Login() {
  const { signIn } = useData();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true); setErr('');
    try { await signIn(email, pass); }
    catch (e: any) { setErr('ログインに失敗しました：' + (e?.code || e?.message || '')); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
        <LinearGradient colors={GRAD_MAIN} style={{ width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Text style={{ fontSize: 30 }}>📚</Text>
        </LinearGradient>
        <Text style={{ color: C.text, fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>Reading Brain</Text>
        <Text style={{ color: C.sub, marginTop: 6, marginBottom: 26 }}>読む → 残す → 思い出す → 使う</Text>
        <Field label="メールアドレス" value={email} onChangeText={setEmail} placeholder="you@example.com" />
        <Field label="パスワード" value={pass} onChangeText={setPass} placeholder="********" />
        {!!err && <Text style={{ color: C.danger, marginBottom: 12, fontSize: 12 }}>{err}</Text>}
        <Btn label={busy ? '接続中…' : 'ログイン'} icon="log-in-outline" onPress={go} />
      </View>
    </Screen>
  );
}