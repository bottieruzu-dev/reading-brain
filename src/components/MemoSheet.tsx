// File: src/components/MemoSheet.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Sheet, Field, Btn, Stars } from './ui';
import { C, R } from '../lib/theme';
import { useData } from '../lib/store';
import { suggestTagsForMemo } from '../lib/aiTagging';

function SpinInput({ label, value, onChange, placeholder }: any) {
  const timerRef = useRef<any>(null);

  const changeVal = (delta: number) => {
    onChange((prev: string) => {
      const num = parseInt(prev || '0', 10);
      return String(Math.max(0, num + delta));
    });
  };

  const startPress = (delta: number) => {
    changeVal(delta);
    timerRef.current = setInterval(() => changeVal(delta), 100);
  };

  const stopPress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <View style={{ flex: 1, marginRight: 8 }}>
      <Field label={label} value={value} onChangeText={onChange} keyboardType="numeric" placeholder={placeholder} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: -15, marginBottom: 10 }}>
        <Pressable onPressIn={() => startPress(-1)} onPressOut={stopPress} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.line, borderRadius: R.sm, marginRight: 5 }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '900' }}>－</Text>
        </Pressable>
        <Pressable onPressIn={() => startPress(1)} onPressOut={stopPress} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.line, borderRadius: R.sm }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '900' }}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function MemoSheet({ visible, onClose, memo, bookId }: any) {
  const { memos, addMemo, updateMemo } = useData();
  const [content, setContent] = useState('');
  const [chapter, setChapter] = useState('');
  const [page, setPage] = useState('');
  const [insight, setInsight] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (memo) {
      setContent(memo.content || '');
      setChapter(memo.chapter || '');
      setPage(memo.page || '');
      setInsight(memo.insight || '');
      setActionPlan(memo.actionPlan || '');
      setTagInput(memo.tags ? memo.tags.join(' ') : '');
      setRating(memo.rating || 0);
    } else {
      setContent('');
      setInsight('');
      setActionPlan('');
      setTagInput('');
      setRating(0);
      const bookMemos = memos.filter((m) => m.bookId === bookId && !m.deletedAt);
      if (bookMemos.length > 0) {
        const lastMemo = bookMemos.sort((a, b) => b.createdAt - a.createdAt)[0];
        setChapter(lastMemo.chapter || '');
        setPage(lastMemo.page || '');
      } else {
        setChapter('');
        setPage('');
      }
    }
  }, [visible, memo, bookId, memos]);

  const allExistingTags = useMemo(() => {
    const set = new Set<string>();
    memos.forEach((m) => (m.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [memos]);

  const handleAiSuggestTags = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    const suggested = await suggestTagsForMemo(content, allExistingTags);
    if (suggested.length > 0) {
      const currentTags = tagInput.trim().split(/\s+/).filter(Boolean);
      const merged = Array.from(new Set([...currentTags, ...suggested]));
      setTagInput(merged.join(' ') + ' ');
    }
    setAiLoading(false);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    const tags = tagInput.trim().split(/\s+/).filter(Boolean);
    const chapterVal = chapter.trim() || null;
    const pageVal = page.trim() || null;
    const insightVal = insight.trim() || null;
    const actionPlanVal = actionPlan.trim() || null;

    if (memo) {
      await updateMemo(memo.id, { content, chapter: chapterVal, page: pageVal, insight: insightVal, actionPlan: actionPlanVal, tags, rating: rating as any });
    } else if (bookId) {
      await addMemo({ bookId, content, chapter: chapterVal, page: pageVal, insight: insightVal, actionPlan: actionPlanVal, tags });
    }
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={memo ? `📝 メモの編集 (${memo.bookTitle || ''})` : '新しいメモ'}>
      {/* 評価（★）の選択 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, backgroundColor: C.card, padding: 10, borderRadius: R.md }}>
        <Text style={{ color: C.sub, fontSize: 12, fontWeight: '700' }}>評価</Text>
        <Stars value={rating} onChange={setRating} size={22} />
      </View>

      {/* メモ本文入力欄（広々表示） */}
      <Field label="メモ内容" value={content} onChangeText={setContent} multiline minHeight={200} placeholder="読書メモや抜粋テキストを入力..." />

      <View style={{ flexDirection: 'row', width: '100%' }}>
        <SpinInput label="第◯章" value={chapter} onChange={setChapter} placeholder="例: 1" />
        <SpinInput label="ページ" value={page} onChange={setPage} placeholder="例: 142" />
      </View>

      <Field label="💡 気付き・学び（任意）" value={insight} onChangeText={setInsight} multiline minHeight={70} placeholder="このメモから感じたことや発見" />
      <Field label="🎯 アクションプラン（任意）" value={actionPlan} onChangeText={setActionPlan} multiline minHeight={70} placeholder="明日から実践すること・行動" />

      {/* タグ入力 ＆ ✨ AIタグ生成ボタン */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: C.sub, fontSize: 12, fontWeight: '700' }}>タグ（スペース区切り）</Text>
        <Pressable
          onPress={handleAiSuggestTags}
          disabled={aiLoading || !content.trim()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: C.primary + '33',
            borderColor: C.primary,
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: R.pill,
            opacity: !content.trim() ? 0.5 : 1,
          }}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <>
              <Text style={{ fontSize: 12 }}>✨</Text>
              <Text style={{ color: C.text, fontSize: 11, fontWeight: '800' }}>AIタグ自動生成</Text>
            </>
          )}
        </Pressable>
      </View>

      <Field label="" value={tagInput} onChangeText={setTagInput} placeholder="例: 経済学 マクロ" />

      <Btn label="保存" icon="checkmark" onPress={handleSave} style={{ marginTop: 8 }} />
      {memo && (
        <Btn label="削除" kind="danger" icon="trash-outline" style={{ marginTop: 10 }} onPress={async () => { await updateMemo(memo.id, { deletedAt: Date.now() }); onClose(); }} />
      )}
    </Sheet>
  );
}