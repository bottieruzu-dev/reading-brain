// File: src/lib/theme.ts

export const C = {
  bg: '#0B0A14',
  card: '#1A182D',      // カード背景
  line: '#322E50',      // 枠線
  text: '#FFFFFF',      // メイン文字
  sub: '#A1A1AA',       // サブ文字
  primary: '#8B5CF6',
  cyan: '#06B6D4',
  danger: '#EF4444',
  gold: '#F59E0B',      // 星評価用ゴールド
};

export const R = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 9999,           // 丸枠用
};

// グラデーション設定群（型を確定）
export const GRAD_BG = ['#0B0A14', '#181528', '#0B0A14'] as const;
export const GRAD_MAIN: [string, string] = ['#8B5CF6', '#06B6D4'];
export const GRAD_HOT: [string, string] = ['#EF4444', '#F59E0B']; // ← 追加
export const GRAD_CARD: [string, string] = ['#1A182D', '#151326'];

// 読書ステータスの色とラベル
export const STATUS_COLOR: Record<string, string> = {
  unread: C.sub,
  reading: C.primary,
  done: C.cyan,
};

export const STATUS_LABEL: Record<string, string> = {
  unread: '未読',
  reading: '読書中',
  done: '読了',
};