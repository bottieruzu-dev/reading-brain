// File: src/lib/aiTagging.ts

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// 1日1,500回・1分15回無料の正式標準モデル
const TARGET_MODEL = 'gemini-1.5-flash';

async function fetchGeminiWithFallback(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key (.env) が設定されていません');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${TARGET_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const fullText = parts
        .map((p: any) => p.text || '')
        .filter(Boolean)
        .join('\n');

      if (fullText) return fullText;
    } else {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(`API Error ${res.status}`);
    }
  } catch (e: any) {
    throw e;
  }

  throw new Error('Gemini APIからの返答が空でした');
}

function extractJsonArray(rawText: string): any[] {
  try {
    const clean = rawText.replace(/```json|```/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return JSON.parse(clean);
  } catch (e) {
    return [];
  }
}

export async function suggestTagsForMemo(
  content: string,
  existingTags: string[]
): Promise<string[]> {
  if (!content.trim()) return [];

  const prompt = `
あなたは書籍メモの整理アシスタントです。
以下のメモ内容を分析し、最も適切なタグを2〜5個提案してください。

【制約事項】
1. 可能な限り「既存タグリスト」にあるタグを優先して使用してください。
2. 既存タグで不足している場合のみ、適切で簡潔な「新規タグ」を追加してください。
3. 出力は必ずJSONの文字列配列形式のみで返してください。余計な解説やMarkdown記飾は一切含めないでください。

【既存タグリスト】
${existingTags.length > 0 ? existingTags.join(', ') : '（なし）'}

【メモ内容】
${content}

【出力例】
["経済学", "マクロ経済", "市場原理"]
`;

  try {
    const rawText = await fetchGeminiWithFallback(prompt);
    const result = extractJsonArray(rawText);
    return Array.isArray(result) ? result : [];
  } catch (e) {
    throw e;
  }
}

export type DuplicateTagGroup = {
  target: string;
  duplicates: string[];
};

export async function detectDuplicateTags(allTags: string[]): Promise<DuplicateTagGroup[]> {
  if (allTags.length < 2) return [];

  const prompt = `
あなたはデータクレンジングの専門家です。
以下のタグ一覧から、実質的に同じ意味・人物・概念を表している「表記揺れ」「同義語」「カタカナ/英語表記」「略称/正式名称」のグループを検出してください。

【制約事項】
1. 本当に意味が同一または極めて類似しているものだけを選んでください。少しでも意味が異なるものは含めないでください。
2. 各グループは {"target": "代表タグ名", "duplicates": ["重複タグ1", "重複タグ2"]} のオブジェクト形式にしてください。
3. 出力は必ずJSON配列形式のみで返してください。解説やMarkdown記飾は一切含めないでください。

【全タグ一覧】
${allTags.join(', ')}

【出力例】
[
  { "target": "キュリー夫人", "duplicates": ["マリ・キュリー"] },
  { "target": "Python", "duplicates": ["パイソン"] }
]
`;

  try {
    const rawText = await fetchGeminiWithFallback(prompt);
    const result = extractJsonArray(rawText);
    return Array.isArray(result) ? result : [];
  } catch (e) {
    throw e;
  }
}

export async function generateGyaruComment(content: string): Promise<string> {
  if (!content.trim()) return '';

  const prompt = `
あなたは見た目やテンションは完全に明るいギャルですが、実はめちゃくちゃ頭が良く、本質を一瞬で見抜くIQ最高峰の「超インテリギャル」です。
ユーザーが記録した以下の読書メモを読んで、ギャルの一言コメント（40〜60文字程度）を返してください。

【キャラクター＆トーン】
1. 口調や語尾は完全にポップなギャル語（「〜じゃね？」「マジで神」「それな！」「ヤバすぎ」「ウケる」など）を使ってください。
2. 内容自体はメモの本質や核心を完璧に要約・構造化し、誰が読んでも一瞬で理解できる極めて知的でシャープな考察にしてください。
3. 表面上はアゲアゲなギャルなのに、言っている内容が本質的で天才的なギャップを生み出してください。

【制約事項】
- 挨拶や前置きは一切不要です。コメント本文のみを出力してください。
- 絵文字を2〜3個使って可愛くポップに仕上げてください。

【読書メモ内容】
${content}
`;

  try {
    const rawText = await fetchGeminiWithFallback(prompt);
    return rawText.trim().replace(/^["'「」]|["'「」]$/g, '');
  } catch (e) {
    console.error('Gyaru Comment Generation Error:', e);
    throw e;
  }
}