// File: src/app/(tabs)/review.tsx
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, Empty, Press, Screen, Title } from '../../components/ui';
import MemoSheet from '../../components/MemoSheet';
import { C, GRAD_HOT, GRAD_MAIN, R } from '../../lib/theme';
import { useData } from '../../lib/store';
import { EXTRA_BATCH, buildQueue, computeStreak, countToday, dueCount, retention } from '../../lib/srs';
import { saveSettings, useSettings } from '../../lib/settings';

const LABEL: any = { 1: '微妙', 2: '普通', 3: '最高' };

export default function Review() {
  const { memos, reviews, reviewMemo, updateMemo, loaded } = useData();
  const settings = useSettings();
  const [queue, setQueue] = useState<any[]>([]);
  const [i, setI] = useState(0);
  const [built, setBuilt] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState(0);
  const [memoOpen, setMemoOpen] = useState(false);

  const done = countToday(reviews);
  const streak = computeStreak(reviews);
  const due = dueCount(memos);

  useEffect(() => {
    if (!loaded || built) return;
    const remain = Math.max(0, settings.dailyLimit - done);
    setQueue(buildQueue(memos, Date.now(), remain));
    setBuilt(true);
  }, [loaded, built, memos, settings.dailyLimit, done]);

  const current = queue[i];

  const rate = async (r: 1 | 2 | 3) => {
    if (!current) return;
    await reviewMemo(current, r);
    setSession((n) => n + 1);
    setRevealed(false);
    setI((n) => n + 1);
  };

  const more = () => {
    setQueue(buildQueue(memos, Date.now(), EXTRA_BATCH));
    setI(0); setRevealed(false);
  };

  const header = (
    <View>
      <Title sub={`今日 ${done} 件 / 上限 ${settings.dailyLimit} 件・未処理 ${due} 件`}>復習</Title>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 }}>
        <LinearGradient colors={GRAD_HOT} style={{ flex: 1, borderRadius: R.lg, padding: 14 }}>
          <Text style={{ color: '#0B0A14', fontWeight: '900', fontSize: 22 }}>🔥 {streak}</Text>
          <Text style={{ color: '#0B0A1499', fontWeight: '800', fontSize: 11 }}>連続日数</Text>
        </LinearGradient>
        <View style={{ flex: 1, borderRadius: R.lg, padding: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
          <Text style={{ color: C.cyan, fontWeight: '900', fontSize: 22 }}>{session}</Text>
          <Text style={{ color: C.sub, fontWeight: '800', fontSize: 11 }}>このセッション</Text>
        </View>
        <Pressable onPress={() => saveSettings({ recallMode: !settings.recallMode })}
          style={{ width: 54, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
          <Ionicons name={settings.recallMode ? 'eye-off' : 'eye'} size={20} color={settings.recallMode ? C.danger : C.sub} />
          <Text style={{ color: C.sub, fontSize: 9, marginTop: 3, fontWeight: '800' }}>想起</Text>
        </Pressable>
      </View>
    </View>
  );

  if (!current) {
    return (
      <Screen>
        <ScrollView>
          {header}
          <Empty
            emoji={done > 0 ? '🎉' : '🌱'}
            title={done > 0 ? `今日はここまで！ ${done}件クリア` : '今日の復習対象はありません'}
            sub={due > 0 ? `未処理があと${due}件あります。無理に全部やらないのが継続のコツですが、いけるなら+${EXTRA_BATCH}枚。` : '新しいメモを追加すると、翌日から出題されます。'}
          />
          {due > 0 && <Btn label={`もう${EXTRA_BATCH}枚やる`} icon="flash" style={{ marginHorizontal: 40 }} onPress={more} />}
        </ScrollView>
      </Screen>
    );
  }

  const r = Math.round(retention(current) * 100);
  const show = revealed || !settings.recallMode;

  const locationText = [
    current.chapter ? `第${current.chapter}章` : null,
    current.page ? `p.${current.page}` : null,
  ].filter(Boolean).join(' ');

  const progressPercent = Math.min(100, Math.max(0, Math.round((i / Math.max(1, queue.length)) * 100)));

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {header}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 16 }}>
            <View style={{ height: 6, width: `${progressPercent}%` as any, backgroundColor: C.cyan, borderRadius: 3 }} />
          </View>

          <Card style={{ padding: 20, minHeight: 260, position: 'relative' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: C.cyan, fontSize: 12, fontWeight: '900' }}>{current.bookTitle}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                  {(current.tags || []).map((t: string) => (
                    <Text key={t} style={{ color: C.sub, fontSize: 11.5, marginRight: 8 }}>#{t}</Text>
                  ))}
                </View>
              </View>

              <Pressable onPress={() => setMemoOpen(true)} hitSlop={10} style={{ padding: 6, backgroundColor: C.line, borderRadius: R.sm }}>
                <Ionicons name="create-outline" size={18} color={C.text} />
              </Pressable>
            </View>

            <View style={{ height: 14 }} />

            {show ? (
              <View>
                <Text style={{ color: C.text, fontSize: 17, lineHeight: 27, fontWeight: '600' }}>{current.content}</Text>

                {!!current.insight && (
                  <View style={{ backgroundColor: C.primary + '22', padding: 10, borderRadius: R.sm, marginTop: 12 }}>
                    <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>💡 {current.insight}</Text>
                  </View>
                )}

                {!!current.actionPlan && (
                  <View style={{ backgroundColor: C.gold + '22', padding: 10, borderRadius: R.sm, marginTop: 8 }}>
                    <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>🎯 {current.actionPlan}</Text>
                  </View>
                )}

                {/* 🌸 ギャルの一言コメント表示（復習カード内） */}
                {!!current.gyaruComment && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FF149318',
                      padding: 10,
                      borderRadius: R.md,
                      marginTop: 10,
                      borderWidth: 1,
                      borderColor: '#FF69B466',
                    }}
                  >
                    <Image
                      source={require('../../../assets/gyaru.png')}
                      style={{ width: 42, height: 42, borderRadius: 21, marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FF69B4', fontSize: 10.5, fontWeight: '900' }}>ギャルの本質一言</Text>
                      <Text style={{ color: C.text, fontSize: 12.5, fontWeight: '700', marginTop: 2, lineHeight: 18 }}>
                        {current.gyaruComment}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Text style={{ fontSize: 40 }}>🤔</Text>
                <Text style={{ color: C.sub, marginTop: 12, textAlign: 'center', lineHeight: 20 }}>
                  この本のこのタグで、{'\n'}何を書いたか思い出せますか？
                </Text>
              </View>
            )}

            <View style={{ flex: 1, minHeight: 20 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: r < 40 ? C.danger : C.sub, fontSize: 11, fontWeight: '800' }}>
                推定記憶残存率 {r}%・{current.reps}回目
              </Text>
              {!!locationText && <Text style={{ color: C.sub, fontSize: 11 }}>{locationText}</Text>}
            </View>
          </Card>

          {!show ? (
            <Btn label="思い出した → 答えを見る" icon="eye" style={{ marginTop: 18 }} onPress={() => setRevealed(true)} />
          ) : (
            <View style={{ marginTop: 18 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[1, 2, 3].map((n) => (
                  <Press key={n} onPress={() => rate(n as 1 | 2 | 3)} style={{ flex: 1 }}>
                    <LinearGradient
                      colors={n === 3 ? GRAD_MAIN : n === 2 ? ['#4A4370', '#302B52'] : ['#5A2E48', '#3A1F33']}
                      style={{ borderRadius: R.md, paddingVertical: 16, alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 18 }}>{'★'.repeat(n)}</Text>
                      <Text style={{ color: n === 3 ? '#0B0A14' : C.text, fontWeight: '900', marginTop: 4, fontSize: 12.5 }}>{LABEL[n]}</Text>
                    </LinearGradient>
                  </Press>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
                <Pressable onPress={() => { setRevealed(false); setI(i + 1); }}>
                  <Text style={{ color: C.sub, fontWeight: '800', padding: 6 }}>あとで（スキップ）</Text>
                </Pressable>
                <Pressable onPress={async () => { await updateMemo(current.id, { suspended: true }); setRevealed(false); setI(i + 1); }}>
                  <Text style={{ color: C.sub, fontWeight: '800', padding: 6 }}>もう出さない</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <MemoSheet visible={memoOpen} onClose={() => setMemoOpen(false)} memo={current} bookId={current?.bookId} />
    </Screen>
  );
}