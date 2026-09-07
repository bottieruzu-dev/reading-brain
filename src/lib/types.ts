// File: src/lib/types.ts
export type Status = 'wish' | 'unread' | 'reading' | 'done';
export type Rating = 0 | 1 | 2 | 3;

export type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  status: Status;
  tags: string[];
  wishReason?: string | null; // 読む目的・きっかけ
  priority?: number;          // 優先度（1: 低, 2: 中, 3: 高/TOP3）
  order: number;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type Memo = {
  id: string;
  bookId: string;
  bookTitle: string;
  content: string;
  page: string | null;
  chapter: string | null;
  insight: string | null;
  actionPlan: string | null;
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

export type Genre = {
  id: string;
  name: string;
  tagNames: string[];
  createdAt: number;
  updatedAt: number;
};