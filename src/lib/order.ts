// File: src/lib/order.ts
// 小数による並び順管理（1件の移動で1回の書き込みしか発生しない）
export function orderBetween(prev?: number | null, next?: number | null): number {
  if (prev == null && next == null) return 1000;
  if (prev == null) return (next as number) - 1000;
  if (next == null) return (prev as number) + 1000;
  return (prev + next) / 2;
}