// File: src/components/ui.tsx
import React, { useRef, useState } from 'react';
import {
  Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, GRAD_BG, GRAD_MAIN, R } from '../lib/theme';

export function Screen({ children }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={GRAD_BG}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380 }}
      />
      {children}
    </View>
  );
}

export function Title({ children, sub, right }: any) {
  return (
    <View style={s.titleRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.h1}>{children}</Text>
        {!!sub && <Text style={s.sub}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

export function Press({ children, onPress, style, onLongPress }: any) {
  const a = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => Animated.spring(a, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(a, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[{ transform: [{ scale: a }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Btn({ label, onPress, icon, kind = 'primary', style }: any) {
  if (kind === 'primary') {
    return (
      <Press onPress={onPress} style={style}>
        <LinearGradient colors={GRAD_MAIN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
          {icon ? <Ionicons name={icon} size={17} color="#0B0A14" /> : null}
          <Text style={s.btnT}>{label}</Text>
        </LinearGradient>
      </Press>
    );
  }
  const border = kind === 'danger' ? C.danger : C.line;
  const color = kind === 'danger' ? C.danger : C.text;
  return (
    <Press onPress={onPress} style={style}>
      <View style={[s.btn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: border }]}>
        {icon ? <Ionicons name={icon} size={17} color={color} /> : null}
        <Text style={[s.btnT, { color }]}>{label}</Text>
      </View>
    </Press>
  );
}

export function Chip({ label, active, onPress, color = C.primary }: any) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: color + '33', borderColor: color }]}>
      <Text style={[s.chipT, active && { color: C.text, fontWeight: '800' }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, onPress, onLongPress }: any) {
  const inner = <View style={[s.card, style]}>{children}</View>;
  if (!onPress && !onLongPress) return inner;
  return <Press onPress={onPress} onLongPress={onLongPress}>{inner}</Press>;
}

export function Field({ label, value, onChangeText, placeholder, multiline, minHeight }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      {!!label && <Text style={s.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.sub}
        multiline={!!multiline}
        style={[s.input, multiline && { minHeight: minHeight || 110, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder }: any) {
  return (
    <View style={s.search}>
      <Ionicons name="search" size={16} color={C.sub} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || '検索'}
        placeholderTextColor={C.sub}
        style={{ flex: 1, color: C.text, marginLeft: 8, outlineStyle: 'none' as any }}
      />
      {!!value && (
        <Pressable onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={16} color={C.sub} />
        </Pressable>
      )}
    </View>
  );
}

export function Stars({ value, onChange, size = 18 }: any) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3].map((n) => (
        <Pressable key={n} onPress={onChange ? () => onChange(n) : undefined} hitSlop={6}>
          <Ionicons
            name={value >= n ? 'star' : 'star-outline'}
            size={size}
            color={value >= n ? C.gold : C.sub}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function Sheet({ visible, onClose, title, children }: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.mask}>
        <View style={s.sheet}>
          <View style={s.sheetHead}>
            <Text style={s.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={C.sub} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Empty({ emoji, title, sub }: any) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 54 }}>{emoji}</Text>
      <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, marginTop: 12 }}>{title}</Text>
      {!!sub && <Text style={{ color: C.sub, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>{sub}</Text>}
    </View>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 1800);
  };
  const node = msg ? (
    <View style={s.toast}>
      <Text style={{ color: '#0B0A14', fontWeight: '800' }}>{msg}</Text>
    </View>
  ) : null;
  return { show, node };
}

const s = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  h1: { color: C.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  sub: { color: C.sub, fontSize: 12.5, marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: R.pill, paddingHorizontal: 20 },
  btnT: { color: '#0B0A14', fontWeight: '900', fontSize: 14.5 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.04)', marginRight: 8, marginBottom: 8 },
  chipT: { color: C.sub, fontSize: 12.5, fontWeight: '600' },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 14 },
  label: { color: C.sub, fontSize: 12, marginBottom: 6, fontWeight: '700' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.line, borderRadius: R.md, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.line, borderRadius: R.pill, paddingHorizontal: 14, height: 42, marginHorizontal: 20, marginBottom: 12 },
  mask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  sheet: { backgroundColor: '#15132B', borderRadius: 20, padding: 20, width: '100%', maxWidth: 680, maxHeight: '85%', borderWidth: 1, borderColor: C.line },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { color: C.text, fontSize: 18, fontWeight: '900' },
  toast: { position: 'absolute', bottom: 96, alignSelf: 'center', backgroundColor: C.cyan, paddingHorizontal: 18, paddingVertical: 11, borderRadius: R.pill, left: 0, right: 0, marginHorizontal: 60, alignItems: 'center' },
});