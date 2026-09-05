// File: src/lib/types.ts
export type Status = 'unread' | 'reading' | 'done';
export type Rating = 0 | 1 | 2 | 3;

export type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  status: Status;
  tags: string[];
  order: number;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

// File: src/lib/types.ts

export type Memo = {
  id: string;
  bookId: string;
  bookTitle: string;
  content: string;
  page: string | null;
  chapter: string | null;
  insight: string | null;      // ← これを追加（気付き）
  actionPlan: string | null;   // ← これを追加（アクションプラン）
  tags: string[];
  rating: Rating;
  order: number;
  dueAt: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  lastReviewedAt: number | null;
  suspended: boolean;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type Template = {
  id: string;
  name: string;
  body: string;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
};

export type ReviewLog = {
  id: string;
  memoId: string;
  rating: 1 | 2 | 3;
  reviewedAt: number;
  intervalBefore: number;
  intervalAfter: number;
};

// File: src/lib/types.ts 内の一番下に追加

export type Genre = {
  id: string;
  name: string;
  tagNames: string[];  // このジャンルに含まれるタグ名の配列
  createdAt: number;
  updatedAt: number;
};