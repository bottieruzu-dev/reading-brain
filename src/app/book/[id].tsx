// File: src/app/book/[id].tsx
import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Btn, Card, Chip, Empty, Field, Press, Screen, SearchBar, Sheet, Stars, useToast } from '../../components/ui';
import MemoCard from '../../components/MemoCard';
import MemoSheet from '../../components/MemoSheet';
import { C, R, STATUS_COLOR, STATUS_LABEL } from '../../lib/theme';
import { parseTags, useData } from '../../lib/store';
import { orderBetween } from '../../lib/order';

const SORTS = [
  { k: 'chapter', label: '章・ページ順' },
  { k: 'created', label: '作成日' },
  { k: 'updated', label: '更新日' },
  { k: 'rating', label: '評価' },
  { k: 'manual', label: '手動' },
];

const parseNum = (val: string | null | undefined) => {
  if (!val) return 999999;
  const n = parseInt(val.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 999999 : n;
};

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { books, memos, updateBook, trashBook, moveMemo } = useData();
  const toast = useToast();
  const book = books.find((b) => b.id === id);

  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [star, setStar] = useState(0);
  const [sort, setSort] = useState('chapter');
  const [arrange, setArrange] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [memoOpen, setMemoOpen] = useState(false);
  const [bookEdit, setBookEdit] = useState(false);
  
  // 気付き一覧・アクションプラン一覧シートの表示管理
  const [insightOpen, setInsightOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);

  const mine = memos.filter((m) => m.bookId === id && !m.deletedAt);

  const insightMemos = useMemo(() => mine.filter((m) => !!m.insight), [mine]);
  const actionMemos = useMemo(() => mine.filter((m) => !!m.actionPlan), [mine]);

  const tagsWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    mine.forEach((m) => {
      (m.tags || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .map((t) => ({ name: t, count: counts[t] }));
  }, [mine]);

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const arr = mine
      .filter((m) => (kw ? m.content.toLowerCase().includes(kw) : true))
      .filter((m) => (tag ? (m.tags || []).includes(tag) : true))
      .filter((m) => (star ? m.rating === star : true));

    if (sort === 'chapter') {
      return arr.sort((a, b) => {
        const chapA = parseNum(a.chapter);
        const chapB = parseNum(b.chapter);
        if (chapA !== chapB) return chapA - chapB;
        const pageA = parseNum(a.page);
        const pageB = parseNum(b.page);
        if (pageA !== pageB) return pageA - pageB;
        return b.createdAt - a.createdAt;
      });
    }
    if (sort === 'created') return arr.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === 'updated') return arr.sort((a, b) => b.updatedAt - a.updatedAt);
    if (sort === 'rating') return arr.sort((a, b) => b.rating - a.rating || b.updatedAt - a.updatedAt);
    return arr.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [mine, q, tag, star, sort]);

  const move = async (index: number, dir: -1 | 1) => {
    const target = list[index];
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[swapIdx];
    const b = list[swapIdx + dir];
    await moveMemo(target.id, orderBetween(dir === -1 ? b?.order ?? null : a.order, dir === -1 ? a.order : b?.order ?? null));
  };

  if (!book) return <Screen><Empty emoji="🔍" title="本が見つかりません" /></Screen>;

  return (
    <Screen>
      <FlatList
        data={list}
        keyExtractor={(m) => m.id}
        numColumns={arrange ? 1 : 2}
        key={arrange ? 'one' : 'two'}
        columnWrapperStyle={arrange ? undefined : { paddingHorizontal: 14, gap: 10 }}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: arrange ? 14 : 0 }}
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
              <Pressable onPress={() => router.back()} hitSlop={10}>
                <Ionicons name="chevron-back" size={26} color={C.text} />
              </Pressable>
              {book.coverUrl ? <Image source={{ uri: book.coverUrl }} style={{ width: 44, height: 62, borderRadius: 6 }} /> : <Text style={{ fontSize: 30 }}>📗</Text>}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ color: C.text, fontSize: 17, fontWeight: '900', lineHeight: 23 }}>{book.title}</Text>
                <Text style={{ color: C.sub, fontSize: 11.5 }}>{book.author || '著者未設定'}・メモ{mine.length}件</Text>
              </View>
              <Pressable onPress={() => setBookEdit(true)} hitSlop={10}>
                <Ionicons name="ellipsis-horizontal" size={22} color={C.sub} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 }}>
              {['unread', 'reading', 'done'].map((s) => (
                <Chip key={s} label={STATUS_LABEL[s]} active={book.status === s} color={STATUS_COLOR[s]}
                  onPress={() => updateBook(book.id, { status: s as any })} />
              ))}
            </View>

            {/* 新規メモ / 💡気付き / 🎯アクション ボタン群 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <Press onPress={() => { setEditing(null); setMemoOpen(true); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingHorizontal: 12, height: 36, borderRadius: R.pill }}>
                  <Ionicons name="add" size={16} color="#0B0A14" />
                  <Text style={{ color: '#0B0A14', fontWeight: '900', fontSize: 12.5 }}>新規メモ</Text>
                </View>
              </Press>

              <Press onPress={() => setInsightOpen(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, borderColor: C.line, borderWidth: 1, paddingHorizontal: 12, height: 36, borderRadius: R.pill }}>
                  <Text style={{ fontSize: 12 }}>💡</Text>
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 12.5 }}>気付き({insightMemos.length})</Text>
                </View>
              </Press>

              <Press onPress={() => setActionOpen(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, borderColor: C.line, borderWidth: 1, paddingHorizontal: 12, height: 36, borderRadius: R.pill }}>
                  <Text style={{ fontSize: 12 }}>🎯</Text>
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 12.5 }}>アクション({actionMemos.length})</Text>
                </View>
              </Press>

              <Pressable onPress={() => { setArrange(!arrange); if (!arrange) setSort('manual'); }} style={{ marginLeft: 'auto' }}>
                <Text style={{ color: arrange ? C.cyan : C.sub, fontWeight: '800', fontSize: 12 }}>
                  {arrange ? '並び替え終了' : '並び替え'}
                </Text>
              </Pressable>
            </View>

            <SearchBar value={q} onChangeText={setQ} placeholder="このメモ内をキーワード検索" />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 }}>
              {SORTS.map((s) => (
                <Chip key={s.k} label={s.label} active={sort === s.k} onPress={() => setSort(s.k)} />
              ))}
              {[1, 2, 3].map((n) => (
                <Chip key={n} label={'★' + n} active={star === n} color={C.gold} onPress={() => setStar(star === n ? 0 : n)} />
              ))}
            </View>

            {!!tagsWithCount.length && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 }}>
                {tagsWithCount.map((t) => (
                  <Chip key={t.name} label={`#${t.name} (${t.count})`} active={tag === t.name} color={C.cyan} onPress={() => setTag(tag === t.name ? '' : t.name)} />
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={<Empty emoji="✍️" title="メモがありません" sub="読みながら一言でもいいので残すと、あとでAIが勝手に価値に変えてくれます。" />}
        renderItem={({ item, index }) =>
          arrange ? (
            <Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text numberOfLines={2} style={{ flex: 1, color: C.text, fontSize: 13.5 }}>{item.content}</Text>
              <Pressable onPress={() => move(index, -1)} hitSlop={8}><Ionicons name="arrow-up" size={20} color={C.cyan} /></Pressable>
              <Pressable onPress={() => move(index, 1)} hitSlop={8}><Ionicons name="arrow-down" size={20} color={C.cyan} /></Pressable>
            </Card>
          ) : (
            <View style={{ flex: 1 }}>
              <MemoCard memo={item} onPress={() => { setEditing(item); setMemoOpen(true); }} />
            </View>
          )
        }
      />

      {/* 気付き一覧シート */}
      <Sheet visible={insightOpen} onClose={() => setInsightOpen(false)} title="💡 この本の気付き・学び一覧">
        <ScrollView style={{ maxHeight: 400 }}>
          {insightMemos.length === 0 ? (
            <Text style={{ color: C.sub, textAlign: 'center', marginVertical: 20 }}>気付きが登録されたメモはまだありません</Text>
          ) : (
            insightMemos.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => { setInsightOpen(false); setEditing(m); setMemoOpen(true); }}
                style={{ backgroundColor: C.card, padding: 12, borderRadius: R.md, marginBottom: 10, borderWidth: 1, borderColor: C.line }}
              >
                <Text style={{ color: C.cyan, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                  {m.chapter ? `第${m.chapter}章 ` : ''}{m.page ? `${m.page}P` : ''}
                </Text>
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 6 }} numberOfLines={2}>メモ: {m.content}</Text>
                <View style={{ backgroundColor: C.primary + '22', padding: 8, borderRadius: R.sm }}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>💡 {m.insight}</Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </Sheet>

      {/* アクションプラン一覧シート */}
      <Sheet visible={actionOpen} onClose={() => setActionOpen(false)} title="🎯 この本のアクションプラン一覧">
        <ScrollView style={{ maxHeight: 400 }}>
          {actionMemos.length === 0 ? (
            <Text style={{ color: C.sub, textAlign: 'center', marginVertical: 20 }}>アクションプランが登録されたメモはまだありません</Text>
          ) : (
            actionMemos.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => { setActionOpen(false); setEditing(m); setMemoOpen(true); }}
                style={{ backgroundColor: C.card, padding: 12, borderRadius: R.md, marginBottom: 10, borderWidth: 1, borderColor: C.line }}
              >
                <Text style={{ color: C.cyan, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                  {m.chapter ? `第${m.chapter}章 ` : ''}{m.page ? `${m.page}P` : ''}
                </Text>
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 6 }} numberOfLines={2}>メモ: {m.content}</Text>
                <View style={{ backgroundColor: C.gold + '22', padding: 8, borderRadius: R.sm }}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>🎯 {m.actionPlan}</Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </Sheet>

      <MemoSheet visible={memoOpen} onClose={() => setMemoOpen(false)} memo={editing} bookId={book.id} />
      <BookEditSheet visible={bookEdit} onClose={() => setBookEdit(false)} book={book}
        onSave={updateBook} onTrash={async () => { await trashBook(book.id); router.back(); }} />
      {toast.node}
    </Screen>
  );
}

function BookEditSheet({ visible, onClose, book, onSave, onTrash }: any) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [cover, setCover] = useState(book.coverUrl || '');
  const [tags, setTags] = useState((book.tags || []).join(' '));
  return (
    <Sheet visible={visible} onClose={onClose} title="本の情報を編集">
      <Field label="タイトル" value={title} onChangeText={setTitle} />
      <Field label="著者" value={author} onChangeText={setAuthor} />
      <Field label="表紙画像URL" value={cover} onChangeText={setCover} placeholder="https://..." />
      <Field label="タグ" value={tags} onChangeText={setTags} />
      <Btn label="保存" icon="checkmark" onPress={async () => {
        await onSave(book.id, { title: title.trim(), author: author.trim(), coverUrl: cover.trim() || null, tags: parseTags(tags) });
        onClose();
      }} />
      <Btn label="この本とメモをゴミ箱へ" kind="danger" icon="trash-outline" style={{ marginTop: 10 }} onPress={onTrash} />
    </Sheet>
  );
}