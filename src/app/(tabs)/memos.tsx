// File: src/app/(tabs)/memos.tsx
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, Chip, Empty, Field, Press, Screen, SearchBar, Sheet, Title, useToast } from '../../components/ui';
import MemoCard from '../../components/MemoCard';
import MemoSheet from '../../components/MemoSheet';
import { C, R } from '../../lib/theme';
import { useData } from '../../lib/store';
import {
  detectDuplicateTags,
  DuplicateTagGroup,
  generateGyaruComment,
  generateInvestorComment,
  generateResearcherComment,
} from '../../lib/aiTagging';

export default function CrossMemos() {
  const { memos, updateMemo, genres } = useData();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
  const [star, setStar] = useState(0);
  const [editingMemo, setEditingMemo] = useState<any>(null);
  const [memoOpen, setMemoOpen] = useState(false);
  const [genreManageOpen, setGenreManageOpen] = useState(false);

  // 一括生成用の状態管理
  const [bulkLoadingType, setBulkLoadingType] = useState<'gyaru' | 'researcher' | 'investor' | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    label: string;
  } | null>(null);

  const alive = memos.filter((m) => !m.deletedAt);
  const unGyaruMemos = alive.filter((m) => !m.gyaruComment && !!m.content.trim());
  const unResearcherMemos = alive.filter((m) => !m.researcherComment && !!m.content.trim());
  const unInvestorMemos = alive.filter((m) => !m.investorComment && !!m.content.trim());

  const tagsWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    alive.forEach((m) => {
      (m.tags || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .map((t) => ({ name: t, count: counts[t] }));
  }, [alive]);

  const currentGenre = genres.find((g) => g.id === selectedGenreId);
  const genreTagNames = currentGenre?.tagNames || [];

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return alive
      .filter((m) => (kw ? (m.content + ' ' + m.bookTitle).toLowerCase().includes(kw) : true))
      .filter((m) => (tag ? (m.tags || []).includes(tag) : true))
      .filter((m) => {
        if (!selectedGenreId || !currentGenre) return true;
        return (m.tags || []).some((t) => genreTagNames.includes(t));
      })
      .filter((m) => (star ? m.rating === star : true))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [alive, q, tag, selectedGenreId, genreTagNames, star]);

  const handleBulkGenerate = async (type: 'gyaru' | 'researcher' | 'investor') => {
    let targets: typeof alive = [];
    if (type === 'gyaru') targets = unGyaruMemos;
    else if (type === 'researcher') targets = unResearcherMemos;
    else if (type === 'investor') targets = unInvestorMemos;

    const total = targets.length;
    if (total === 0 || bulkLoadingType) return;

    setBulkLoadingType(type);
    let successCount = 0;
    let lastErrorMsg = '';

    const typeName = type === 'gyaru' ? 'ギャル' : type === 'researcher' ? '研究者' : '投資家';

    for (let idx = 0; idx < total; idx++) {
      const m = targets[idx];
      const percent = Math.round(((idx + 1) / total) * 100);

      setBulkProgress({
        current: idx + 1,
        total,
        percent,
        label: `${typeName}コメント生成中…`,
      });

      let comment = '';
      let success = false;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (type === 'gyaru') comment = await generateGyaruComment(m.content);
          else if (type === 'researcher') comment = await generateResearcherComment(m.content);
          else if (type === 'investor') comment = await generateInvestorComment(m.content);

          if (comment) {
            success = true;
            break;
          }
        } catch (e: any) {
          lastErrorMsg = e?.message || String(e);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (success && comment) {
        if (type === 'gyaru') await updateMemo(m.id, { gyaruComment: comment });
        else if (type === 'researcher') await updateMemo(m.id, { researcherComment: comment });
        else if (type === 'investor') await updateMemo(m.id, { investorComment: comment });
        successCount++;
      } else {
        setBulkLoadingType(null);
        setBulkProgress(null);
        alert(
          `【一括生成が一時停止しました】\n${successCount}件の${typeName}コメントを追加しました。\n\nエラー内容: ${lastErrorMsg}\n\n時間をおいてから再度押すと続きから再開できます。`
        );
        return;
      }
    }

    setBulkLoadingType(null);
    setBulkProgress(null);
    toast.show(`🎉 全${successCount}件に${typeName}コメントを追加しました！`);
  };

  return (
    <Screen>
      <FlatList
        data={list}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ marginHorizontal: -20 }}>
            <Title sub={`${list.length}件 / 全${alive.length}件`}>横断メモ</Title>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 12 }}
            >
              {unGyaruMemos.length > 0 && (
                <Press onPress={() => handleBulkGenerate('gyaru')} disabled={!!bulkLoadingType}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#FF69B422',
                      borderColor: '#FF69B4',
                      borderWidth: 1,
                      paddingHorizontal: 12,
                      height: 36,
                      borderRadius: R.pill,
                    }}
                  >
                    {bulkLoadingType === 'gyaru' ? (
                      <ActivityIndicator size="small" color="#FF69B4" />
                    ) : (
                      <Text style={{ fontSize: 12 }}>💖</Text>
                    )}
                    <Text style={{ color: '#FF69B4', fontWeight: '800', fontSize: 11.5 }}>
                      ギャル一括({unGyaruMemos.length})
                    </Text>
                  </View>
                </Press>
              )}

              {unResearcherMemos.length > 0 && (
                <Press onPress={() => handleBulkGenerate('researcher')} disabled={!!bulkLoadingType}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#00BFFF22',
                      borderColor: '#00BFFF',
                      borderWidth: 1,
                      paddingHorizontal: 12,
                      height: 36,
                      borderRadius: R.pill,
                    }}
                  >
                    {bulkLoadingType === 'researcher' ? (
                      <ActivityIndicator size="small" color="#00BFFF" />
                    ) : (
                      <Text style={{ fontSize: 12 }}>🔬</Text>
                    )}
                    <Text style={{ color: '#00BFFF', fontWeight: '800', fontSize: 11.5 }}>
                      研究者一括({unResearcherMemos.length})
                    </Text>
                  </View>
                </Press>
              )}

              {unInvestorMemos.length > 0 && (
                <Press onPress={() => handleBulkGenerate('investor')} disabled={!!bulkLoadingType}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#32CD3222',
                      borderColor: '#32CD32',
                      borderWidth: 1,
                      paddingHorizontal: 12,
                      height: 36,
                      borderRadius: R.pill,
                    }}
                  >
                    {bulkLoadingType === 'investor' ? (
                      <ActivityIndicator size="small" color="#32CD32" />
                    ) : (
                      <Text style={{ fontSize: 12 }}>📈</Text>
                    )}
                    <Text style={{ color: '#32CD32', fontWeight: '800', fontSize: 11.5 }}>
                      投資家一括({unInvestorMemos.length})
                    </Text>
                  </View>
                </Press>
              )}

              <Press onPress={() => setGenreManageOpen(true)}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: C.card,
                    borderColor: C.line,
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    height: 36,
                    borderRadius: R.pill,
                  }}
                >
                  <Text style={{ fontSize: 13 }}>🏷️</Text>
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 12.5 }}>ジャンル管理</Text>
                </View>
              </Press>
            </ScrollView>

            {bulkProgress && (
              <View
                style={{
                  backgroundColor: C.card,
                  padding: 12,
                  borderRadius: R.md,
                  marginHorizontal: 20,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: C.cyan,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: C.text, fontWeight: '800', fontSize: 12.5 }}>
                    {bulkProgress.label}
                  </Text>
                  <Text style={{ color: C.cyan, fontWeight: '900', fontSize: 12.5 }}>
                    {bulkProgress.percent}% ({bulkProgress.current}/{bulkProgress.total}件)
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${bulkProgress.percent}%`,
                      backgroundColor: C.cyan,
                    }}
                  />
                </View>
              </View>
            )}

            <SearchBar value={q} onChangeText={setQ} placeholder="全部の本のメモを全文検索" />

            {genres.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 10 }}>
                <Chip label="全ジャンル" active={!selectedGenreId} onPress={() => setSelectedGenreId(null)} />
                {genres.map((g) => (
                  <Chip
                    key={g.id}
                    label={`📁 ${g.name}`}
                    active={selectedGenreId === g.id}
                    color={C.primary}
                    onPress={() => setSelectedGenreId(selectedGenreId === g.id ? null : g.id)}
                  />
                ))}
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 }}>
              {[1, 2, 3].map((n) => (
                <Chip key={n} label={'★' + n} active={star === n} color={C.gold} onPress={() => setStar(star === n ? 0 : n)} />
              ))}
              {tagsWithCount.map((t) => {
                if (selectedGenreId && !genreTagNames.includes(t.name)) return null;
                return (
                  <Chip
                    key={t.name}
                    label={`#${t.name} (${t.count})`}
                    active={tag === t.name}
                    color={C.cyan}
                    onPress={() => setTag(tag === t.name ? '' : t.name)}
                  />
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={<Empty emoji="🔎" title="該当するメモがありません" sub="条件を外すか、本棚からメモを追加してください。" />}
        renderItem={({ item }) => (
          <MemoCard
            memo={item}
            showBook
            onPress={() => {
              setEditingMemo(item);
              setMemoOpen(true);
            }}
          />
        )}
      />

      <MemoSheet
        visible={memoOpen}
        onClose={() => setMemoOpen(false)}
        memo={editingMemo}
        bookId={editingMemo?.bookId}
      />

      <GenreManageSheet visible={genreManageOpen} onClose={() => setGenreManageOpen(false)} tagsWithCount={tagsWithCount} />
      {toast.node}
    </Screen>
  );
}

function GenreManageSheet({ visible, onClose, tagsWithCount }: any) {
  const { genres, addGenre, updateGenre, deleteGenre, addTagsToGenre, mergeTags } = useData();
  const sheetToast = useToast();
  const [newGenreName, setNewGenreName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');

  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);

  const [detecting, setDetecting] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateTagGroup[]>([]);
  const [approvedGroups, setApprovedGroups] = useState<Record<number, boolean>>({});

  const filteredTags = useMemo(() => {
    const kw = tagSearch.trim().toLowerCase();
    if (!kw) return tagsWithCount;
    return tagsWithCount.filter((t: any) => t.name.toLowerCase().includes(kw));
  }, [tagsWithCount, tagSearch]);

  const handleDetectDuplicates = async () => {
    const allTagNames = tagsWithCount.map((t: any) => t.name);

    if (allTagNames.length < 2) {
      const msg = `分析には異なるタグが2つ以上必要です（現在: ${allTagNames.length}個）`;
      sheetToast.show(msg);
      alert(msg);
      return;
    }

    setDetecting(true);
    try {
      const results = await detectDuplicateTags(allTagNames);

      if (!results || results.length === 0) {
        const msg = '整理が必要な重複・表記揺れタグは見つかりませんでした';
        sheetToast.show(msg);
        alert(`【AI判定結果】\n${msg}\n\n対象タグ: ${allTagNames.join(', ')}`);
      } else {
        setDuplicateCandidates(results);
        const initialApproved: Record<number, boolean> = {};
        results.forEach((_, idx) => { initialApproved[idx] = true; });
        setApprovedGroups(initialApproved);
        sheetToast.show(`${results.length}件の整理候補を検出しました`);
      }
    } catch (e: any) {
      const msg = `AI通信エラーが発生しました: ${e?.message || e}`;
      sheetToast.show(msg);
      alert(msg);
    } finally {
      setDetecting(false);
    }
  };

  const handleExecuteMerge = async () => {
    for (let idx = 0; idx < duplicateCandidates.length; idx++) {
      if (approvedGroups[idx]) {
        const group = duplicateCandidates[idx];
        await mergeTags(group.target, group.duplicates);
      }
    }
    setDuplicateCandidates([]);
    setApprovedGroups({});
    sheetToast.show('タグを統合しました');
    alert('タグの統合処理が完了しました！');
  };

  const startEdit = (g: any) => {
    setEditingGenreId(g.id);
    setEditName(g.name);
    setEditTags(g.tagNames || []);
  };

  const saveEdit = async () => {
    if (!editingGenreId || !editName.trim()) return;
    await updateGenre(editingGenreId, { name: editName.trim(), tagNames: editTags });
    setEditingGenreId(null);
  };

  const toggleEditTag = (tagName: string) => {
    setEditTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const toggleTagSelect = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleCreateGenre = async () => {
    if (!newGenreName.trim()) return;
    await addGenre(newGenreName.trim(), selectedTags);
    setNewGenreName('');
    setSelectedTags([]);
  };

  const handleAssignToGenre = async (genreId: string) => {
    if (selectedTags.length === 0) return;
    await addTagsToGenre(genreId, selectedTags);
    setSelectedTags([]);
  };

  return (
    <Sheet visible={visible} onClose={() => { setEditingGenreId(null); setDuplicateCandidates([]); onClose(); }} title="🏷️ タグ・ジャンル管理">
      <ScrollView style={{ maxHeight: 500 }}>
        <View style={{ backgroundColor: C.card, padding: 12, borderRadius: R.md, marginBottom: 16, borderWidth: 1, borderColor: C.primary }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>✨ AIタグ自動整理・クレンジング</Text>
              <Text style={{ color: C.sub, fontSize: 10.5, marginTop: 2 }}>「オレンジ/みかん」など同義タグを検出してまとめます</Text>
            </View>
            <Pressable
              onPress={handleDetectDuplicates}
              disabled={detecting}
              style={{ backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.pill }}
            >
              {detecting ? (
                <ActivityIndicator size="small" color="#0B0A14" />
              ) : (
                <Text style={{ color: '#0B0A14', fontWeight: '900', fontSize: 11.5 }}>検出実行</Text>
              )}
            </Pressable>
          </View>

          {duplicateCandidates.length > 0 && (
            <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line }}>
              <Text style={{ color: C.gold, fontSize: 12, fontWeight: '800', marginBottom: 8 }}>
                以下のタググループを統合しますか？（チェックで許可）
              </Text>

              {duplicateCandidates.map((group, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setApprovedGroups((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: approvedGroups[idx] ? C.primary + '22' : C.line + '44',
                    padding: 8,
                    borderRadius: R.sm,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: approvedGroups[idx] ? C.primary : C.line,
                  }}
                >
                  <Ionicons name={approvedGroups[idx] ? 'checkbox' : 'square-outline'} size={18} color={approvedGroups[idx] ? C.cyan : C.sub} />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>
                      代表: <Text style={{ color: C.cyan }}>#{group.target}</Text>
                    </Text>
                    <Text style={{ color: C.sub, fontSize: 11 }}>
                      統合対象: {group.duplicates.map((d) => `#${d}`).join(', ')}
                    </Text>
                  </View>
                </Pressable>
              ))}

              <Btn label="選択したタグを統合実行" icon="checkmark" onPress={handleExecuteMerge} style={{ marginTop: 8 }} />
            </View>
          )}
        </View>

        {editingGenreId ? (
          <View style={{ backgroundColor: C.card, padding: 14, borderRadius: R.md, marginBottom: 16, borderWidth: 1, borderColor: C.primary }}>
            <Text style={{ color: C.primary, fontWeight: '900', fontSize: 14, marginBottom: 8 }}>✏️ ジャンルを編集</Text>
            <Field label="ジャンル名" value={editName} onChangeText={setEditName} />

            <Text style={{ color: C.sub, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6 }}>
              このジャンルのタグ（タップして除外）:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {editTags.map((t) => (
                <Pressable key={t} onPress={() => toggleEditTag(t)} style={{ backgroundColor: C.line, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.sm, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: C.cyan, fontSize: 12, fontWeight: '700' }}>#{t}</Text>
                  <Ionicons name="close-circle" size={14} color={C.danger} />
                </Pressable>
              ))}
              {editTags.length === 0 && <Text style={{ color: C.sub, fontSize: 12 }}>タグがありません</Text>}
            </View>

            <Text style={{ color: C.sub, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>タグの追加・削除（タップで切り替え）:</Text>
            <SearchBar value={tagSearch} onChangeText={setTagSearch} placeholder="タグを絞り込み" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 16 }}>
              {filteredTags.map((t: any) => {
                const isIncluded = editTags.includes(t.name);
                return (
                  <Pressable
                    key={t.name}
                    onPress={() => toggleEditTag(t.name)}
                    style={{
                      backgroundColor: isIncluded ? C.primary : C.card,
                      borderColor: isIncluded ? C.primary : C.line,
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: R.pill,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Ionicons name={isIncluded ? 'checkbox' : 'square-outline'} size={14} color={isIncluded ? '#0B0A14' : C.sub} />
                    <Text style={{ color: isIncluded ? '#0B0A14' : C.text, fontSize: 12, fontWeight: isIncluded ? '900' : '600' }}>#{t.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn label="保存" icon="checkmark" onPress={saveEdit} style={{ flex: 1 }} />
              <Btn label="キャンセル" kind="danger" onPress={() => setEditingGenreId(null)} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <>
            <View style={{ backgroundColor: C.card, padding: 12, borderRadius: R.md, marginBottom: 16, borderWidth: 1, borderColor: C.line }}>
              <Text style={{ color: C.text, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>新ジャンルを作成</Text>
              <Field label="" value={newGenreName} onChangeText={setNewGenreName} placeholder="ジャンル名（例: 経済学, 自己啓発）" />
              <Btn label="作成（選択中のタグを含める）" icon="add" onPress={handleCreateGenre} style={{ marginTop: 8 }} />
            </View>

            {genres.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: C.sub, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>登録済みジャンル（タップして編集）</Text>
                {genres.map((g) => (
                  <View key={g.id} style={{ backgroundColor: C.card, padding: 12, borderRadius: R.md, marginBottom: 8, borderWidth: 1, borderColor: C.line }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Pressable onPress={() => startEdit(g)} style={{ flex: 1 }}>
                        <Text style={{ color: C.text, fontWeight: '900', fontSize: 14 }}>📁 {g.name}</Text>
                      </Pressable>
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        {selectedTags.length > 0 && (
                          <Pressable onPress={() => handleAssignToGenre(g.id)} style={{ backgroundColor: C.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.sm }}>
                            <Text style={{ color: '#0B0A14', fontSize: 11, fontWeight: '900' }}>+選択中の{selectedTags.length}件を追加</Text>
                          </Pressable>
                        )}
                        <Pressable onPress={() => startEdit(g)} style={{ padding: 6, backgroundColor: C.line, borderRadius: R.sm }}>
                          <Ionicons name="create-outline" size={16} color={C.text} />
                        </Pressable>
                        <Pressable onPress={() => deleteGenre(g.id)} style={{ padding: 6 }}>
                          <Ionicons name="trash-outline" size={16} color={C.danger} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {(g.tagNames || []).map((t) => (
                        <Pressable key={t} onPress={() => startEdit(g)} style={{ backgroundColor: C.line, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.sm }}>
                          <Text style={{ color: C.cyan, fontSize: 11 }}>#{t}</Text>
                        </Pressable>
                      ))}
                      {(g.tagNames || []).length === 0 && (
                        <Pressable onPress={() => startEdit(g)}>
                          <Text style={{ color: C.sub, fontSize: 11, fontStyle: 'italic' }}>タグ未登録（タップして追加）</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={{ color: C.sub, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>全タグ一覧（タップで一括追加の対象を選択）</Text>
            <SearchBar value={tagSearch} onChangeText={setTagSearch} placeholder="タグを絞り込み検索" />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 20 }}>
              {filteredTags.map((t: any) => {
                const isSelected = selectedTags.includes(t.name);
                return (
                  <Pressable
                    key={t.name}
                    onPress={() => toggleTagSelect(t.name)}
                    style={{
                      backgroundColor: isSelected ? C.primary : C.card,
                      borderColor: isSelected ? C.primary : C.line,
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: R.pill,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={14} color={isSelected ? '#0B0A14' : C.sub} />
                    <Text style={{ color: isSelected ? '#0B0A14' : C.text, fontSize: 12, fontWeight: isSelected ? '900' : '600' }}>
                      #{t.name} ({t.count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      {sheetToast.node}
    </Sheet>
  );
}