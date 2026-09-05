// File: src/app/(tabs)/index.tsx
import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Btn, Chip, Field, Press, Screen, SearchBar, Sheet, Title, Empty, useToast } from '../../components/ui';
import { C, GRAD_MAIN, R, STATUS_COLOR, STATUS_LABEL } from '../../lib/theme';
import { parseTags, uniqueTags, useData } from '../../lib/store';
import { dueCount } from '../../lib/srs';
import { fetchByIsbn, searchByTitle } from '../../lib/booksApi';
import { cloudinaryReady, uploadImage } from '../../lib/cloudinary';

export default function BookShelf() {
  const { books, memos, addBook } = useData();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [tag, setTag] = useState('');
  const [open, setOpen] = useState(false);

  const alive = books.filter((b) => !b.deletedAt);
  const tags = uniqueTags(alive);

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return alive
      .filter((b) => (status === 'all' ? true : b.status === status))
      .filter((b) => (tag ? (b.tags || []).includes(tag) : true))
      .filter((b) => (kw ? (b.title + b.author).toLowerCase().includes(kw) : true))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [alive, q, status, tag]);

  const countOf = (id: string) => memos.filter((m) => m.bookId === id && !m.deletedAt).length;
  const due = dueCount(memos);

  return (
    <Screen>
      <FlatList
        data={list}
        keyExtractor={(b) => b.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 14, gap: 12 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <Title sub={`${alive.length}冊 / メモ${memos.filter((m) => !m.deletedAt).length}件`}
              right={
                <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
                  <Ionicons name="settings-outline" size={22} color={C.sub} />
                </Pressable>
              }>
              My Library
            </Title>

            {due > 0 && (
              <Press onPress={() => router.push('/review')} style={{ marginHorizontal: 20, marginBottom: 14 }}>
                <LinearGradient colors={GRAD_MAIN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: R.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 24 }}>⚡</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#0B0A14', fontWeight: '900', fontSize: 15 }}>今日の復習が {due} 件</Text>
                    <Text style={{ color: '#0B0A1499', fontSize: 11.5, fontWeight: '700' }}>忘れかけの今がいちばん効く</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#0B0A14" />
                </LinearGradient>
              </Press>
            )}

            <SearchBar value={q} onChangeText={setQ} placeholder="タイトル・著者で検索" />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 }}>
              {['all', 'unread', 'reading', 'done'].map((s) => (
                <Chip key={s} label={s === 'all' ? 'すべて' : STATUS_LABEL[s]} active={status === s}
                  color={s === 'all' ? C.primary : STATUS_COLOR[s]} onPress={() => setStatus(s)} />
              ))}
            </View>

            {!!tags.length && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 2 }}>
                {tags.map((t) => (
                  <Chip key={t} label={'#' + t} active={tag === t} color={C.cyan}
                    onPress={() => setTag(tag === t ? '' : t)} />
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={<Empty emoji="📖" title="まだ1冊もありません" sub="右下の＋から本を追加。ISBNか書名を入れれば表紙は自動で取ってきます。" />}
        renderItem={({ item }) => (
          <Press onPress={() => router.push(`/book/${item.id}`)} style={{ flex: 1, marginBottom: 12 }}>
            <View style={{ borderRadius: R.lg, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
              {item.coverUrl ? (
                <Image source={{ uri: item.coverUrl }} style={{ width: '100%', height: 190 }} resizeMode="cover" />
              ) : (
                <LinearGradient colors={['#3A2E7A', '#16143A']} style={{ height: 190, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                  <Text style={{ fontSize: 30 }}>📗</Text>
                  <Text numberOfLines={3} style={{ color: C.text, fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 8 }}>{item.title}</Text>
                </LinearGradient>
              )}
              <View style={{ padding: 12 }}>
                <Text numberOfLines={2} style={{ color: C.text, fontWeight: '800', fontSize: 13.5, lineHeight: 19 }}>{item.title}</Text>
                <Text numberOfLines={1} style={{ color: C.sub, fontSize: 11, marginTop: 3 }}>{item.author || '著者未設定'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 }}>
                  <Text style={{ color: STATUS_COLOR[item.status], fontSize: 10.5, fontWeight: '900' }}>{STATUS_LABEL[item.status]}</Text>
                  <Text style={{ color: C.sub, fontSize: 10.5, fontWeight: '700' }}>📝 {countOf(item.id)}</Text>
                </View>
              </View>
            </View>
          </Press>
        )}
      />

      <Press onPress={() => setOpen(true)} style={{ position: 'absolute', right: 20, bottom: 20 }}>
        <LinearGradient colors={GRAD_MAIN} style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="add" size={30} color="#0B0A14" />
        </LinearGradient>
      </Press>

      <AddBookSheet visible={open} onClose={() => setOpen(false)} onDone={(msg: string) => toast.show(msg)} addBook={addBook} />
      {toast.node}
    </Screen>
  );
}

function AddBookSheet({ visible, onClose, onDone, addBook }: any) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('reading');
  const [cands, setCands] = useState<any[]>([]);
  const [busy, setBusy] = useState('');

  const reset = () => { setTitle(''); setAuthor(''); setIsbn(''); setCoverUrl(null); setTags(''); setStatus('reading'); setCands([]); };

  const auto = async () => {
    setBusy('検索中…');
    if (isbn.trim()) {
      const r = await fetchByIsbn(isbn);
      if (r) { setTitle(r.title); setAuthor(r.author); setCoverUrl(r.coverUrl); setBusy(''); return; }
    }
    const list = await searchByTitle(title || isbn);
    setCands(list);
    setBusy(list.length ? '' : '見つかりませんでした（手入力してください）');
  };

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled) return;
    setBusy('アップロード中…');
    try { setCoverUrl(await uploadImage(res.assets[0].uri)); setBusy(''); }
    catch (e: any) { setBusy('失敗：' + e.message); }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="本を追加">
      <Field label="ISBN（13桁・任意）" value={isbn} onChangeText={setIsbn} placeholder="9784…" />
      <Field label="タイトル" value={title} onChangeText={setTitle} placeholder="サピエンス全史" />
      <Field label="著者" value={author} onChangeText={setAuthor} placeholder="ユヴァル・ノア・ハラリ" />
      <Btn label="ISBN/書名から自動取得" kind="ghost" icon="cloud-download-outline" onPress={auto} />
      {!!busy && <Text style={{ color: C.sub, fontSize: 12, marginTop: 8 }}>{busy}</Text>}

      {!!cands.length && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: C.sub, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>候補をタップして反映</Text>
          {cands.map((c, i) => (
            <Pressable key={i} onPress={() => { setTitle(c.title); setAuthor(c.author); setCoverUrl(c.coverUrl); setCands([]); }}
              style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 }}>
              {c.coverUrl ? <Image source={{ uri: c.coverUrl }} style={{ width: 34, height: 48, borderRadius: 4 }} /> : <Text>📕</Text>}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: C.text, fontSize: 13, fontWeight: '700' }}>{c.title}</Text>
                <Text numberOfLines={1} style={{ color: C.sub, fontSize: 11 }}>{c.author}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {!!coverUrl && (
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <Image source={{ uri: coverUrl }} style={{ width: 88, height: 124, borderRadius: 8 }} />
        </View>
      )}

      {cloudinaryReady && (
        <Btn label="端末から表紙をアップロード" kind="ghost" icon="image-outline" style={{ marginTop: 10 }} onPress={pick} />
      )}

      <View style={{ height: 14 }} />
      <Text style={{ color: C.sub, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>ステータス</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['unread', 'reading', 'done'].map((s) => (
          <Chip key={s} label={STATUS_LABEL[s]} active={status === s} color={STATUS_COLOR[s]} onPress={() => setStatus(s)} />
        ))}
      </View>
      <Field label="タグ（スペース区切り）" value={tags} onChangeText={setTags} placeholder="投資 心理学" />
      <Btn
        label="本棚に追加"
        icon="add"
        onPress={async () => {
          if (!title.trim()) return;
          await addBook({ title: title.trim(), author: author.trim(), coverUrl, status, tags: parseTags(tags) });
          reset(); onClose(); onDone('本棚に追加しました');
        }}
      />
    </Sheet>
  );
}