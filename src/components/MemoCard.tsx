// File: src/components/MemoCard.tsx
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Card, Stars } from './ui';
import { C, R } from '../lib/theme';
import { retention } from '../lib/srs';
import { useData } from '../lib/store';
import { generateGyaruComment, generateInvestorComment, generateResearcherComment } from '../lib/aiTagging';
import type { Memo } from '../lib/types';

export default function MemoCard({ memo, onPress, showBook }: any) {
  const { updateMemo } = useData();
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const r = Math.round(retention(memo as Memo) * 100);

  const locationText = [
    memo.chapter ? `第${memo.chapter}章` : null,
    memo.page ? `p.${memo.page}` : null,
  ].filter(Boolean).join(' ');

  const handleGenerate = async (type: 'gyaru' | 'researcher' | 'investor') => {
    if (!memo.content || loadingType) return;
    setLoadingType(type);
    try {
      if (type === 'gyaru') {
        const comment = await generateGyaruComment(memo.content);
        if (comment) await updateMemo(memo.id, { gyaruComment: comment });
      } else if (type === 'researcher') {
        const comment = await generateResearcherComment(memo.content);
        if (comment) await updateMemo(memo.id, { researcherComment: comment });
      } else if (type === 'investor') {
        const comment = await generateInvestorComment(memo.content);
        if (comment) await updateMemo(memo.id, { investorComment: comment });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <Card onPress={onPress} style={{ marginBottom: 10 }}>
      {showBook ? (
        <Text numberOfLines={1} style={{ color: C.cyan, fontSize: 11, fontWeight: '800', marginBottom: 6 }}>
          {memo.bookTitle || '（書籍不明）'}
        </Text>
      ) : null}

      <Text style={{ color: C.text, fontSize: 14.5, lineHeight: 21 }} numberOfLines={8}>
        {memo.content}
      </Text>

      {!!memo.insight && (
        <View style={{ backgroundColor: C.primary + '22', padding: 8, borderRadius: R.sm, marginTop: 8 }}>
          <Text style={{ color: C.text, fontSize: 12.5 }} numberOfLines={3}>
            💡 {memo.insight}
          </Text>
        </View>
      )}

      {!!memo.actionPlan && (
        <View style={{ backgroundColor: C.gold + '22', padding: 8, borderRadius: R.sm, marginTop: 6 }}>
          <Text style={{ color: C.text, fontSize: 12.5 }} numberOfLines={3}>
            🎯 {memo.actionPlan}
          </Text>
        </View>
      )}

      {/* 🌸 1. ギャルの一言 */}
      {memo.gyaruComment ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF149318', padding: 8, borderRadius: R.md, marginTop: 8, borderWidth: 1, borderColor: '#FF69B466' }}>
          <Image source={require('../../assets/gyaru.png')} style={{ width: 34, height: 34, borderRadius: 17, marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FF69B4', fontSize: 10, fontWeight: '900' }}>ギャル</Text>
            <Text style={{ color: C.text, fontSize: 11.5, fontWeight: '700', marginTop: 1 }}>{memo.gyaruComment}</Text>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => handleGenerate('gyaru')} disabled={!!loadingType} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, backgroundColor: '#FF69B422', borderColor: '#FF69B4', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill, marginTop: 8 }}>
          {loadingType === 'gyaru' ? <ActivityIndicator size="small" color="#FF69B4" /> : <Text style={{ color: '#FF69B4', fontSize: 10.5, fontWeight: '800' }}>💖 ギャルコメント追加</Text>}
        </Pressable>
      )}

      {/* 🔬 2. 研究者の一言 */}
      {memo.researcherComment ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#00BFFF18', padding: 8, borderRadius: R.md, marginTop: 6, borderWidth: 1, borderColor: '#00BFFF66' }}>
          <Image source={require('../../assets/researcher.png')} style={{ width: 34, height: 34, borderRadius: 17, marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#00BFFF', fontSize: 10, fontWeight: '900' }}>研究者</Text>
            <Text style={{ color: C.text, fontSize: 11.5, fontWeight: '700', marginTop: 1 }}>{memo.researcherComment}</Text>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => handleGenerate('researcher')} disabled={!!loadingType} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, backgroundColor: '#00BFFF22', borderColor: '#00BFFF', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill, marginTop: 6 }}>
          {loadingType === 'researcher' ? <ActivityIndicator size="small" color="#00BFFF" /> : <Text style={{ color: '#00BFFF', fontSize: 10.5, fontWeight: '800' }}>🔬 研究者コメント追加</Text>}
        </Pressable>
      )}

      {/* 📈 3. 投資家の一言 */}
      {memo.investorComment ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#32CD3218', padding: 8, borderRadius: R.md, marginTop: 6, borderWidth: 1, borderColor: '#32CD3266' }}>
          <Image source={require('../../assets/investor.png')} style={{ width: 34, height: 34, borderRadius: 17, marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#32CD32', fontSize: 10, fontWeight: '900' }}>投資家</Text>
            <Text style={{ color: C.text, fontSize: 11.5, fontWeight: '700', marginTop: 1 }}>{memo.investorComment}</Text>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => handleGenerate('investor')} disabled={!!loadingType} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, backgroundColor: '#32CD3222', borderColor: '#32CD32', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill, marginTop: 6 }}>
          {loadingType === 'investor' ? <ActivityIndicator size="small" color="#32CD32" /> : <Text style={{ color: '#32CD32', fontSize: 10.5, fontWeight: '800' }}>📈 投資家コメント追加</Text>}
        </Pressable>
      )}

      {!!(memo.tags || []).length && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {memo.tags.map((t: string) => (
            <Text key={t} style={{ color: C.sub, fontSize: 11, marginRight: 8 }}>#{t}</Text>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <Stars value={memo.rating} size={14} />
        <Text style={{ color: r < 40 ? C.danger : C.sub, fontSize: 10.5, fontWeight: '700' }}>
          記憶 {r}%{locationText ? ` ・ ${locationText}` : ''}
        </Text>
      </View>
    </Card>
  );
}