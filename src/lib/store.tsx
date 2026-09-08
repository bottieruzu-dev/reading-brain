// File: src/lib/store.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as qLimit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { initialSchedule, nextSchedule } from './srs';
import type { Book, Genre, Memo, Rating, ReviewLog, Status, Template } from './types';

const DEFAULT_TEMPLATES = [
  {
    name: '3行要約＋アクション',
    body:
      'あなたは優秀な編集者です。以下は書籍『{タイトル}』（著者: {著者}）から私が抜き出したメモです。\n\n{選択したメモ}\n\n上記を踏まえ、次の形式で日本語で出力してください。\n1. 3行要約\n2. 最も重要な洞察を1つ（なぜ重要かの根拠付き）\n3. 明日から実行できる具体的アクション3つ',
  },
  {
    name: '反論・穴探し（厳しめ）',
    body:
      '以下のメモの主張について、論理の飛躍・反証となるデータ・前提の弱さを厳しく指摘してください。擁護や励ましは不要です。\n\n{選択したメモ}\n\n出力形式:\n1. 主張の要約\n2. 反論3つ（それぞれ根拠を明記）\n3. それでも妥当と言える部分',
  },
  {
    name: '動画台本のネタ化',
    body:
      '以下のメモを、視聴者が最後まで見たくなる10分程度の動画構成案に変換してください。\n\n{選択したメモ}\n\n出力: フック(最初の15秒の台詞案)/本編3ブロック(各見出しと要点)/締めのメッセージ/サムネ文言案5つ',
  },
  {
    name: 'ソクラテス式チェック',
    body:
      '以下のメモの理解度を確かめるため、私に問いかける質問を10個作ってください。答えは絶対に書かないでください。\n\n{選択したメモ}',
  },
];

type Ctx = {
  user: User | null;
  authReady: boolean;
  loaded: boolean;
  books: Book[];
  memos: Memo[];
  templates: Template[];
  reviews: ReviewLog[];
  genres: Genre[];
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  addBook: (v: Partial<Book>) => Promise<string>;
  updateBook: (id: string, v: Partial<Book>) => Promise<void>;
  trashBook: (id: string) => Promise<void>;
  restoreBook: (id: string) => Promise<void>;
  addMemo: (v: Partial<Memo> & { bookId: string }) => Promise<void>;
  updateMemo: (id: string, v: Partial<Memo>) => Promise<void>;
  trashMemo: (id: string) => Promise<void>;
  restoreMemo: (id: string) => Promise<void>;
  hardDelete: (kind: 'books' | 'memos', id: string) => Promise<void>;
  moveMemo: (id: string, newOrder: number) => Promise<void>;
  reviewMemo: (memo: Memo, rating: 1 | 2 | 3) => Promise<void>;
  addTemplate: (name: string, body: string) => Promise<void>;
  updateTemplate: (id: string, v: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  addGenre: (name: string, tagNames?: string[]) => Promise<string>;
  updateGenre: (id: string, v: Partial<Genre>) => Promise<void>;
  deleteGenre: (id: string) => Promise<void>;
  addTagsToGenre: (genreId: string, tagsToAdd: string[]) => Promise<void>;
  mergeTags: (targetTag: string, duplicateTags: string[]) => Promise<void>;
  exportJson: () => string;
  importJson: (raw: string) => Promise<number>;
};

const DataCtx = createContext<Ctx>({} as Ctx);
export const useData = () => useContext(DataCtx);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [reviews, setReviews] = useState<ReviewLog[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [seedChecked, setSeedChecked] = useState(false);

  // 認証状態の監視のみ（自動匿名ログイン処理を撤去）
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const uid = user?.uid;
  const col = (sub: string) => collection(db, 'users', uid as string, sub);

  useEffect(() => {
    if (!uid) {
      setBooks([]); setMemos([]); setTemplates([]); setReviews([]); setGenres([]);
      setLoaded(false); setSeedChecked(false);
      return;
    }
    const unsubs = [
      onSnapshot(collection(db, 'users', uid, 'books'), (s) =>
        setBooks(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      ),
      onSnapshot(collection(db, 'users', uid, 'memos'), (s) => {
        setMemos(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoaded(true);
      }),
      onSnapshot(collection(db, 'users', uid, 'templates'), (s) =>
        setTemplates(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      ),
      onSnapshot(collection(db, 'users', uid, 'genres'), (s) =>
        setGenres(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      ),
      onSnapshot(
        query(collection(db, 'users', uid, 'reviews'), orderBy('reviewedAt', 'desc'), qLimit(500)),
        (s) => setReviews(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      ),
    ];
    return () => unsubs.forEach((f) => f());
  }, [uid]);

  useEffect(() => {
    if (!uid || seedChecked) return;
    (async () => {
      const snap = await getDocs(collection(db, 'users', uid, 'templates'));
      if (snap.empty) {
        const now = Date.now();
        const batch = writeBatch(db);
        DEFAULT_TEMPLATES.forEach((t) => {
          const ref = doc(collection(db, 'users', uid, 'templates'));
          batch.set(ref, { ...t, usageCount: 0, createdAt: now, updatedAt: now });
        });
        await batch.commit();
      }
      setSeedChecked(true);
    })();
  }, [uid, seedChecked]);

  const api: Ctx = useMemo(() => ({
    user, authReady, loaded, books, memos, templates, reviews, genres,

    signIn: async (email, pass) => { await signInWithEmailAndPassword(auth, email.trim(), pass); },
    signOut: async () => { await fbSignOut(auth); },

    addBook: async (v) => {
      const now = Date.now();
      const maxOrder = books.reduce((m, b) => Math.max(m, b.order || 0), 0);
      const ref = await addDoc(col('books'), {
        title: v.title || '無題',
        author: v.author || '',
        coverUrl: v.coverUrl || null,
        status: (v.status || 'unread') as Status,
        tags: v.tags || [],
        order: maxOrder + 1000,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      return ref.id;
    },

    updateBook: async (id, v) => {
      const now = Date.now();
      await updateDoc(doc(db, 'users', uid as string, 'books', id), { ...v, updatedAt: now });
      if (v.title) {
        const targets = memos.filter((m) => m.bookId === id && m.bookTitle !== v.title);
        for (let i = 0; i < targets.length; i += 400) {
          const batch = writeBatch(db);
          targets.slice(i, i + 400).forEach((m) =>
            batch.update(doc(db, 'users', uid as string, 'memos', m.id), {
              bookTitle: v.title, updatedAt: now,
            })
          );
          await batch.commit();
        }
      }
    },

    trashBook: async (id) => {
      const now = Date.now();
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', uid as string, 'books', id), { deletedAt: now, updatedAt: now });
      memos.filter((m) => m.bookId === id && !m.deletedAt).slice(0, 400).forEach((m) =>
        batch.update(doc(db, 'users', uid as string, 'memos', m.id), { deletedAt: now, updatedAt: now })
      );
      await batch.commit();
    },

    restoreBook: async (id) => {
      await updateDoc(doc(db, 'users', uid as string, 'books', id), { deletedAt: null, updatedAt: Date.now() });
    },

    addMemo: async (v) => {
      const now = Date.now();
      const book = books.find((b) => b.id === v.bookId);
      const minOrder = memos
        .filter((m) => m.bookId === v.bookId)
        .reduce((m, x) => Math.min(m, x.order || 0), 1000);
      await addDoc(col('memos'), {
        bookId: v.bookId,
        bookTitle: book?.title || '',
        content: v.content || '',
        page: v.page || null,
        chapter: v.chapter || null,
        insight: v.insight || null,
        actionPlan: v.actionPlan || null,
        tags: v.tags || [],
        order: minOrder - 1000,
        ...initialSchedule(now),
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    },

    updateMemo: async (id, v) => {
      await updateDoc(doc(db, 'users', uid as string, 'memos', id), { ...v, updatedAt: Date.now() });
    },

    trashMemo: async (id) => {
      const now = Date.now();
      await updateDoc(doc(db, 'users', uid as string, 'memos', id), { deletedAt: now, updatedAt: now });
    },

    restoreMemo: async (id) => {
      await updateDoc(doc(db, 'users', uid as string, 'memos', id), { deletedAt: null, updatedAt: Date.now() });
    },

    hardDelete: async (kind, id) => {
      await deleteDoc(doc(db, 'users', uid as string, kind, id));
    },

    moveMemo: async (id, newOrder) => {
      await updateDoc(doc(db, 'users', uid as string, 'memos', id), { order: newOrder, updatedAt: Date.now() });
    },

    reviewMemo: async (memo, rating) => {
      const now = Date.now();
      const sched = nextSchedule(memo, rating, now);
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', uid as string, 'memos', memo.id), sched as any);
      batch.set(doc(collection(db, 'users', uid as string, 'reviews')), {
        memoId: memo.id,
        rating,
        reviewedAt: now,
        intervalBefore: memo.intervalDays || 0,
        intervalAfter: sched.intervalDays,
      });
      await batch.commit();
    },

    addTemplate: async (name, body) => {
      const now = Date.now();
      await addDoc(col('templates'), { name, body, usageCount: 0, createdAt: now, updatedAt: now });
    },

    updateTemplate: async (id, v) => {
      await updateDoc(doc(db, 'users', uid as string, 'templates', id), { ...v, updatedAt: Date.now() });
    },

    deleteTemplate: async (id) => {
      await deleteDoc(doc(db, 'users', uid as string, 'templates', id));
    },

    addGenre: async (name, tagNames = []) => {
      const now = Date.now();
      const ref = await addDoc(col('genres'), { name: name.trim(), tagNames, createdAt: now, updatedAt: now });
      return ref.id;
    },

    updateGenre: async (id, v) => {
      await updateDoc(doc(db, 'users', uid as string, 'genres', id), { ...v, updatedAt: Date.now() });
    },

    deleteGenre: async (id) => {
      await deleteDoc(doc(db, 'users', uid as string, 'genres', id));
    },

    addTagsToGenre: async (genreId, tagsToAdd) => {
      const target = genres.find((g) => g.id === genreId);
      if (!target) return;
      const set = new Set(target.tagNames || []);
      tagsToAdd.forEach((t) => set.add(t));
      await updateDoc(doc(db, 'users', uid as string, 'genres', genreId), {
        tagNames: Array.from(set),
        updatedAt: Date.now(),
      });
    },

    mergeTags: async (targetTag, duplicateTags) => {
      if (!duplicateTags.length || !uid) return;
      const now = Date.now();
      const dupSet = new Set(duplicateTags);

      const targetMemos = memos.filter((m) =>
        (m.tags || []).some((t) => dupSet.has(t))
      );
      for (let i = 0; i < targetMemos.length; i += 400) {
        const batch = writeBatch(db);
        targetMemos.slice(i, i + 400).forEach((m) => {
          const newTags = Array.from(
            new Set((m.tags || []).map((t) => (dupSet.has(t) ? targetTag : t)))
          );
          batch.update(doc(db, 'users', uid, 'memos', m.id), {
            tags: newTags,
            updatedAt: now,
          });
        });
        await batch.commit();
      }

      const targetBooks = books.filter((b) =>
        (b.tags || []).some((t) => dupSet.has(t))
      );
      for (let i = 0; i < targetBooks.length; i += 400) {
        const batch = writeBatch(db);
        targetBooks.slice(i, i + 400).forEach((b) => {
          const newTags = Array.from(
            new Set((b.tags || []).map((t) => (dupSet.has(t) ? targetTag : t)))
          );
          batch.update(doc(db, 'users', uid, 'books', b.id), {
            tags: newTags,
            updatedAt: now,
          });
        });
        await batch.commit();
      }

      const targetGenres = genres.filter((g) =>
        (g.tagNames || []).some((t) => dupSet.has(t))
      );
      for (let i = 0; i < targetGenres.length; i += 400) {
        const batch = writeBatch(db);
        targetGenres.slice(i, i + 400).forEach((g) => {
          const newTags = Array.from(
            new Set((g.tagNames || []).map((t) => (dupSet.has(t) ? targetTag : t)))
          );
          batch.update(doc(db, 'users', uid, 'genres', g.id), {
            tagNames: newTags,
            updatedAt: now,
          });
        });
        await batch.commit();
      }
    },

    exportJson: () =>
      JSON.stringify({ version: 1, exportedAt: Date.now(), books, memos, templates, genres }, null, 2),

    importJson: async (raw) => {
      const data = JSON.parse(raw);
      const rows: Array<[string, any]> = [];
      (data.books || []).forEach((b: Book) => rows.push(['books', b]));
      (data.memos || []).forEach((m: Memo) => rows.push(['memos', m]));
      (data.templates || []).forEach((t: Template) => rows.push(['templates', t]));
      (data.genres || []).forEach((g: Genre) => rows.push(['genres', g]));
      for (let i = 0; i < rows.length; i += 400) {
        const batch = writeBatch(db);
        rows.slice(i, i + 400).forEach(([kind, row]) => {
          const { id, ...rest } = row;
          batch.set(doc(db, 'users', uid as string, kind, id), rest, { merge: true });
        });
        await batch.commit();
      }
      return rows.length;
    },
  }), [user, authReady, loaded, books, memos, templates, reviews, genres, uid]);

  return <DataCtx.Provider value={api}>{children}</DataCtx.Provider>;
}

export function uniqueTags(list: Array<{ tags?: string[] }>): string[] {
  const set = new Set<string>();
  list.forEach((x) => (x.tags || []).forEach((t) => t && set.add(t)));
  return Array.from(set).sort();
}

export function parseTags(input: string): string[] {
  return input
    .split(/[,、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export type { Rating };