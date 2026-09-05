// File: src/components/MemoCard.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { Card, Stars } from './ui';
import { C, R } from '../lib/theme';
import { retention } from '../lib/srs';
import type { Memo } from '../lib/types';

export default function MemoCard({ memo, onPress, showBook }: any) {
  const r = Math.round(retention(memo as Memo) * 100);

  // 章とページ表示の組み合わせ
  const locationText = [
    memo.chapter ? `第${memo.chapter}章` : null,
    memo.page ? `p.${memo.page}` : null,
  ].filter(Boolean).join(' ');

  return (
    <Card onPress={onPress} style={{ marginBottom: 10 }}>
      {showBook ? (
        <Text numberOfLines={1} style={{ color: C.cyan, fontSize: 11, fontWeight: '800', marginBottom: 6 }}>
          {memo.bookTitle || '（書籍不明）'}
        </Text>
      ) : null}

      {/* メモ本文 */}
      <Text style={{ color: C.text, fontSize: 14.5, lineHeight: 21 }} numberOfLines={8}>
        {memo.content}
      </Text>

      {/* 💡 気付き表示 */}
      {!!memo.insight && (
        <View style={{ backgroundColor: C.primary + '22', padding: 8, borderRadius: R.sm, marginTop: 8 }}>
          <Text style={{ color: C.text, fontSize: 12.5 }} numberOfLines={3}>
            💡 {memo.insight}
          </Text>
        </View>
      )}

      {/* 🎯 アクションプラン表示 */}
      {!!memo.actionPlan && (
        <View style={{ backgroundColor: C.gold + '22', padding: 8, borderRadius: R.sm, marginTop: 6 }}>
          <Text style={{ color: C.text, fontSize: 12.5 }} numberOfLines={3}>
            🎯 {memo.actionPlan}
          </Text>
        </View>
      )}

      {/* タグ表示 */}
      {!!(memo.tags || []).length && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {memo.tags.map((t: string) => (
            <Text key={t} style={{ color: C.sub, fontSize: 11, marginRight: 8 }}>#{t}</Text>
          ))}
        </View>
      )}

      {/* フッター（評価・記憶率・章/ページ） */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <Stars value={memo.rating} size={14} />
        <Text style={{ color: r < 40 ? C.danger : C.sub, fontSize: 10.5, fontWeight: '700' }}>
          記憶 {r}%{locationText ? ` ・ ${locationText}` : ''}
        </Text>
      </View>
    </Card>
  );
}