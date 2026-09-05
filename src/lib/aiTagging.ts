// File: src/lib/aiTagging.ts

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const MODEL_CANDIDATES = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

async function fetchGeminiWithFallback(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key (.env) が設定されていません');
  }

  let lastError: Error | null = null;

  for (const model of MODEL_CANDIDATES) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      console.log(`🔍 [Gemini API] モデル呼び出し試行: ${model}`);
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

        console.log(`✅ [Gemini API] 通信成功 (${model})。生レスポンス:`, fullText);
        if (fullText) return fullText;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`⚠️ [Gemini API] ${model} 失敗 ${res.status}:`, errJson);
        lastError = new Error(`API Error ${res.status}`);
      }
    } catch (e: any) {
      console.error(`❌ [Gemini API] 通信エラー (${model}):`, e);
      lastError = e;
    }
  }

  throw lastError || new Error('すべてのGeminiモデル呼び出しに失敗しました');
}

function extractJsonArray(rawText: string): any[] {
  try {
    const clean = rawText.replace(/```json|```/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error('❌ [JSON Parse Error] パース失敗:', e, 'Raw Text:', rawText);
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
    console.error('AI Tag Suggestion Error:', e);
    throw e;
  }
}

export type DuplicateTagGroup = {
  target: string;
  duplicates: string[];
};

export async function detectDuplicateTags(allTags: string[]): Promise<DuplicateTagGroup[]> {
  if (allTags.length < 2) return [];

  console.log('📤 [AI整理] 送信するタグ一覧:', allTags);

  const prompt = `
あなたはデータクレンジングの専門家です。
以下のタグ一覧から、実質的に同じ意味・人物・概念を表している「表記揺れ」「同義語」「カタカナ/英語表記」「略称/正式名称」のグループを検出してください。

【例】
- 「オレンジ」と「みかん」 ➔ 代表: "オレンジ", 重複: ["みかん"]
- 「マリ・キュリー」と「キュリー夫人」 ➔ 代表: "キュリー夫人", 重複: ["マリ・キュリー"]
- 「Python」と「パイソン」 ➔ 代表: "Python", 重複: ["パイソン"]

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
    console.log('📥 [AI整理] 抽出されたグループ構造:', result);
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.error('AI Duplicate Tag Detection Error:', e);
    throw e;
  }
}