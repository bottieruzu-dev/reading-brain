// File: src/lib/srs.ts
import type { Memo, ReviewLog } from './types';

export const DAY = 86400000;
export const MAX_INTERVAL_DAYS = 180;
export const EXTRA_BATCH = 5;

export function initialSchedule(now: number = Date.now()) {
  return {
    rating: 0 as const,
    dueAt: now + DAY, // 作成翌日に初回復習
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    lastReviewedAt: null,
    suspended: false,
  };
}

export function nextSchedule(memo: Memo, rating: 1 | 2 | 3, now: number = Date.now()) {
  const prev = memo.intervalDays || 0;
  let interval: number;
  if (rating === 1) interval = 1;
  else if (rating === 2) interval = prev <= 0 ? 3 : Math.max(1, Math.round(prev * 1.6));
  else interval = prev <= 0 ? 5 : Math.max(2, Math.round(prev * 2.5));
  interval = Math.min(interval, MAX_INTERVAL_DAYS);
  return {
    rating,
    intervalDays: interval,
    dueAt: now + interval * DAY,
    reps: (memo.reps || 0) + 1,
    lapses: (memo.lapses || 0) + (rating === 1 ? 1 : 0),
    lastReviewedAt: now,
    updatedAt: now,
  };
}

// エビングハウスの保持関数 R = exp(-t/S) による推定残存率（0〜1）
export function retention(memo: Memo, now: number = Date.now()): number {
  const base = memo.lastReviewedAt ?? memo.createdAt;
  const t = (now - base) / DAY;
  const S = Math.max(0.6, (memo.intervalDays || 0) * 0.9 + 0.6 + (memo.reps || 0) * 0.3);
  const r = Math.exp(-t / S);
  return Math.max(0, Math.min(1, r));
}

function ratingWeight(rating: number): number {
  if (rating === 1) return 3.0;
  if (rating === 2) return 1.6;
  if (rating === 3) return 0.7;
  return 2.2; // 未評価
}

export function priority(memo: Memo, now: number): number {
  const overdue = (now - (memo.dueAt || now)) / DAY;
  const jitter = 0.85 + Math.random() * 0.3;
  return (overdue + 1) * ratingWeight(memo.rating) * jitter;
}

export function buildQueue(memos: Memo[], now: number, limit: number): Memo[] {
  if (limit <= 0) return [];
  return memos
    .filter((m) => !m.deletedAt && !m.suspended && (m.dueAt || 0) <= now)
    .map((m) => ({ m, p: priority(m, now) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, limit)
    .map((x) => x.m);
}

export function dueCount(memos: Memo[], now: number = Date.now()): number {
  return memos.filter((m) => !m.deletedAt && !m.suspended && (m.dueAt || 0) <= now).length;
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function countToday(reviews: ReviewLog[], now: number = Date.now()): number {
  const key = dayKey(now);
  return reviews.filter((r) => dayKey(r.reviewedAt) === key).length;
}

export function computeStreak(reviews: ReviewLog[], now: number = Date.now()): number {
  const set = new Set(reviews.map((r) => dayKey(r.reviewedAt)));
  let streak = 0;
  let cursor = now;
  // 今日まだ0件なら「昨日まで」の連続を数える
  if (!set.has(dayKey(cursor))) cursor -= DAY;
  while (set.has(dayKey(cursor))) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}