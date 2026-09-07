// File: src/lib/theme.ts

export const C = {
  bg: '#0B0A14',
  card: '#1A182D',
  line: '#322E50',
  text: '#FFFFFF',
  sub: '#A1A1AA',
  primary: '#8B5CF6',
  cyan: '#06B6D4',
  danger: '#EF4444',
  gold: '#F59E0B',
};

export const R = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 9999,
};

export const GRAD_BG = ['#0B0A14', '#181528', '#0B0A14'] as const;
export const GRAD_MAIN: [string, string] = ['#8B5CF6', '#06B6D4'];
export const GRAD_HOT: [string, string] = ['#EF4444', '#F59E0B'];
export const GRAD_CARD: [string, string] = ['#1A182D', '#151326'];

export const STATUS_COLOR: Record<string, string> = {
  wish: C.gold,
  unread: C.sub,
  reading: C.primary,
  done: C.cyan,
};

export const STATUS_LABEL: Record<string, string> = {
  wish: '読みたい',
  unread: '未読',
  reading: '読書中',
  done: '読了',
};