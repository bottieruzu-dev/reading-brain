// File: src/app/(tabs)/prompt.tsx
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, Chip, Empty, Field, Screen, Sheet, Title, useToast } from '../../components/ui';
import { C, R } from '../../lib/theme';
import { useData } from '../../lib/store';
import { countToday } from '../../lib/srs';

const sectionStyle = {
  color: C.text,
  fontSize: 14,
  fontWeight: '800' as const,
  marginHorizontal: 20,
  marginTop: 18,
  marginBottom: 10,
};

export default function PromptStudio() {
  const { memos, books, templates, reviews, addTemplate, updateTemplate, deleteTemplate } = useData();
  const toast = useToast();
  const [tplId, setTplId] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [openTpl, setOpenTpl] = useState(false);
  const [editTpl, setEditTpl] = useState<any>(null);
  const [openBook, setOpenBook] = useState<Record<string, boolean>>({});

  const alive = memos.filter((m) => !m.deletedAt);
  const tpl = templates.find((t) => t.id === tplId) || templates[0];
  const chosen = alive.filter((m) => sel[m.id]);

  const todayIds = useMemo(() => {
    const t = countToday(reviews) > 0 ? reviews.filter((r) => new Date(r.reviewedAt).toDateString() === new Date().toDateString()) : [];
    return new Set(t.map((r) => r.memoId));
  }, [reviews]);

  const output = useMemo(() => {
    if (!tpl) return '';
    const bullets = chosen.map((m) => `・${m.content.replace(/\n/g, ' ')}（${m.bookTitle}${m.page ? ` p.${m.page}` : ''}）`).join('\n');
    const titles = Array.from(new Set(chosen.map((m) => m.bookTitle))).join(' / ');
    const authors = Array.from(new Set(chosen.map((m) => books.find((b) => b.id === m.bookId)?.author).filter(Boolean))).join(' / ');
    const tags = Array.from(new Set(chosen.flatMap((m) => m.tags || []))).map((t) => '#' + t).join(' ');
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return tpl.body
      .replace(/\{選択したメモ\}/g, bullets || '（メモ未選択）')
      .replace(/\{タイトル\}/g, titles || '（未選択）')
      .replace(/\{著者\}/g, authors || '不明')
      .replace(/\{タグ\}/g, tags || 'なし')
      .replace(/\{日付\}/g, date);
  }, [tpl, chosen, books]);

  const quick = (kind: string) => {
    const next: Record<string, boolean> = {};
    alive.forEach((m) => {
      if (kind === 'star3' && m.rating === 3) next[m.id] = true;
      if (kind === 'unrated' && m.rating === 0) next[m.id] = true;
      if (kind === 'today' && todayIds.has(m.id)) next[m.id] = true;
    });
    setSel(next);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <Title sub={`${chosen.length}件のメモを選択中`}>AI活用スタジオ</Title>

        <Text style={sectionStyle}>1. テンプレートを選ぶ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {templates.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTplId(t.id)}
              onLongPress={() => { setEditTpl(t); setOpenTpl(true); }}
              style={{
                marginRight: 10,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: R.md,
                borderWidth: 1,
                maxWidth: 200,
                borderColor: tpl?.id === t.id ? C.cyan : C.line,
                backgroundColor: tpl?.id === t.id ? C.cyan + '22' : C.card,
              }}
            >
              <Text numberOfLines={1} style={{ color: C.text, fontWeight: '800', fontSize: 13 }}>{t.name}</Text>
              <Text style={{ color: C.sub, fontSize: 10.5, marginTop: 3 }}>使用 {t.usageCount || 0} 回・長押しで編集</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => { setEditTpl(null); setOpenTpl(true); }}
            style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: R.md, borderWidth: 1, borderColor: C.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: C.primary, fontWeight: '900' }}>＋ 新規</Text>
          </Pressable>
        </ScrollView>

        <Text style={sectionStyle}>2. メモを選ぶ（本を跨いでOK）</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 }}>
          <Chip label="★3だけ" onPress={() => quick('star3')} />
          <Chip label="未評価だけ" onPress={() => quick('unrated')} />
          <Chip label="今日復習した分" onPress={() => quick('today')} />
          <Chip label="選択解除" color={C.danger} onPress={() => setSel({})} />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {books.filter((b) => !b.deletedAt).map((b) => {
            const list = alive.filter((m) => m.bookId === b.id);
            if (!list.length) return null;
            const open = openBook[b.id];
            return (
              <View key={b.id} style={{ marginBottom: 10 }}>
                <Pressable
                  onPress={() => setOpenBook({ ...openBook, [b.id]: !open })}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
                >
                  <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={16} color={C.sub} />
                  <Text numberOfLines={1} style={{ color: C.text, fontWeight: '800', flex: 1, marginLeft: 6 }}>{b.title}</Text>
                  <Text style={{ color: C.sub, fontSize: 11 }}>{list.filter((m) => sel[m.id]).length}/{list.length}</Text>
                </Pressable>
                {open && list.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setSel({ ...sel, [m.id]: !sel[m.id] })}
                    style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, paddingLeft: 22 }}
                  >
                    <Ionicons name={sel[m.id] ? 'checkbox' : 'square-outline'} size={18} color={sel[m.id] ? C.cyan : C.sub} />
                    <Text numberOfLines={2} style={{ flex: 1, color: sel[m.id] ? C.text : C.sub, fontSize: 13, lineHeight: 19 }}>{m.content}</Text>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </View>

        <Text style={sectionStyle}>3. プレビューしてコピー</Text>
        <View style={{ paddingHorizontal: 20 }}>
          <Card>
            <Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>{output || '（テンプレートがありません）'}</Text>
          </Card>
          <Btn
            label="クリップボードにコピー"
            style={{ marginTop: 12 }}
            onPress={async () => {
              if (!output) return;
              await Clipboard.setStringAsync(output);
              if (tpl) {
                await updateTemplate(tpl.id, { usageCount: (tpl.usageCount || 0) + 1 });
              }
              toast.show('コピーしました！AIに貼り付けてください');
            }}
          />
        </View>

        <TemplateSheet visible={openTpl} onClose={() => setOpenTpl(false)} tpl={editTpl} />
        {toast.node}
      </ScrollView>
    </Screen>
  );
}

function TemplateSheet({ visible, onClose, tpl }: any) {
  const { addTemplate, updateTemplate, deleteTemplate } = useData();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');

  React.useEffect(() => {
    if (!visible) return;
    setName(tpl?.name || '');
    setBody(tpl?.body || '');
  }, [visible, tpl]);

  return (
    <Sheet visible={visible} onClose={onClose} title={tpl ? 'テンプレートを編集' : '新しいテンプレート'}>
      <Field label="名前" value={name} onChangeText={setName} placeholder="例: 3行要約" />
      <Field label="プロンプト本文" value={body} onChangeText={setBody} multiline minHeight={200} placeholder="変数として {選択したメモ} {タイトル} {著者} {タグ} {日付} が使えます。" />
      <Btn
        label="保存"
        icon="checkmark"
        onPress={async () => {
          if (!name.trim() || !body.trim()) return;
          if (tpl) await updateTemplate(tpl.id, { name: name.trim(), body: body.trim() });
          else await addTemplate(name.trim(), body.trim());
          onClose();
        }}
      />
      {tpl && (
        <Btn
          label="削除"
          kind="danger"
          icon="trash-outline"
          style={{ marginTop: 10 }}
          onPress={async () => {
            await deleteTemplate(tpl.id);
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}