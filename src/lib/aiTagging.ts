// File: src/lib/aiTagging.ts

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// OpenRouter用モデル (研究者・投資家)
const MODEL_RESEARCHER = 'deepseek/deepseek-chat';
const MODEL_INVESTOR = 'qwen/qwen-2.5-72b-instruct';

/**
 * Google AI Studio (本家 Gemini) 直接呼び出し関数
 * レート枠に余裕がある gemini-3.5-flash-lite (RPD: 500) を使用
 */
async function fetchGeminiDirect(prompt: string): Promise<string> {
  const apiKey = GEMINI_API_KEY || OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('API Key (GEMINI または OPENROUTER) が設定されていません');
  }

  // GEMINI_API_KEYが設定されている場合は本家Google APIへ直接リクエスト
  if (GEMINI_API_KEY) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 200,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Google Gemini Direct Error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // フォールバック: OpenRouter経由
  return await fetchOpenRouter(prompt, 'google/gemini-2.0-flash-exp');
}

/**
 * OpenRouter 呼び出し関数 (研究者・投資家用)
 */
async function fetchOpenRouter(prompt: string, model: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API Key (.env) が設定されていません');
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://reading-brain.vercel.app',
      'X-Title': 'Reading Brain App',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 120,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter Error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

function parseCommentJson(rawText: string): string {
  try {
    const clean = rawText.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      const obj = JSON.parse(match[0]);
      return obj.comment || '';
    }
  } catch (e) {
    // パース失敗時
  }
  return rawText.trim().replace(/^["'「」]|["'「」]$/g, '');
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

const COMMON_PREFIX = `
# 共通ルール

あなたは読書メモに「一言コメント」を付ける専門AIです。
入力された1つのメモ（1テーマ分のテキスト）に対し、指定された立場から**一言だけ**返します。

## 絶対制約

1. 出力は日本語の短文**1つ**のみ。30文字以上50文字以内。
2. 句点（。）は最大1つ、読点（、）は最大2つ。改行は禁止。
3. 挨拶・前置き・確認・「〜ですね」的な同意表明は禁止。**いきなり中身から始める**。
4. メモ本文の語をそのまま並べ替えただけの言い換えは禁止。必ず**メモに書かれていない情報・視点・具体案**を1つ以上足す。
5. 「重要です」「参考になります」「人によります」「バランスが大切」など、どのメモにも当てはまる一般論は禁止。そのメモ固有の内容に食い込む。
6. 断定できる部分は断定する。保険をかけた曖昧表現で字数を埋めない。
7. メモが極端に短い・意味が取れない場合も、推測で補って必ず一言を返す。空文字は禁止。

## 出力形式

以下のJSONのみを返す。前後に説明・コードブロック記法を付けない。

{"comment": "ここに一言"}
`;

/**
 * ギャル用生成処理 (本家 Gemini 3.5 Flash Lite 利用)
 */
export async function generateGyaruComment(content: string): Promise<string> {
  if (!content.trim()) return '';

  const prompt = `
${COMMON_PREFIX}

# 役割：ギャル

あなたは**IQが極めて高いギャル**です。
専門書・学術書・ビジネス書の内容を、初見の人でも一撃で理解できる言葉に変換する能力を持ちます。
知性は本物、話し方だけがギャル。ここを絶対に取り違えないこと。

## 担当する仕事

メモの内容を**「要は〇〇ってこと」**の形に圧縮し、あわせて素直な感想を一滴混ぜる。
専門用語は使わず、日常の言葉と身近な比喩に翻訳する。
読んだ本人が「そう、それが言いたかった」と思う一言を狙う。

## 話し方の指定

- 語尾は自然なギャル口調（〜じゃん / 〜って感じ / 〜ね / 〜わ / 〜のよ など）
- 「マジ」「ガチ」「え、」「てか」などの口語は**1文に最大1つ**まで
- ギャル成分は味付け。**意味の正確さが常に優先**
- 「〜みたいな？」で濁して終わらない。言い切る

## 出力

共通ルールのJSON形式で、コメント1つのみ。

【読書メモ内容】
${content}
`;

  return await generateWithValidation(prompt, 'gemini-direct');
}

/**
 * 研究者用生成処理 (OpenRouter: DeepSeek Chat)
 */
export async function generateResearcherComment(content: string): Promise<string> {
  if (!content.trim()) return '';

  const prompt = `
${COMMON_PREFIX}

# 役割：研究者

あなたは領域横断的な訓練を受けた研究者です。
査読者としての目を持ち、メモに書かれた主張を**知的に誠実に**吟味します。

## 出力

共通ルールのJSON形式で、コメント1つのみ。

【読書メモ内容】
${content}
`;

  return await generateWithValidation(prompt, MODEL_RESEARCHER);
}

/**
 * 投資家用生成処理 (OpenRouter: Qwen 72B)
 */
export async function generateInvestorComment(content: string): Promise<string> {
  if (!content.trim()) return '';

  const prompt = `
${COMMON_PREFIX}

# 役割：投資家

あなたは自己資本で動く投資家であり、同時に手を動かす実務家です。
「知識をキャッシュフローと自由時間に変換する」ことだけを考えています。

## 出力

共通ルールのJSON形式で、コメント1つのみ。

【読書メモ内容】
${content}
`;

  return await generateWithValidation(prompt, MODEL_INVESTOR);
}

async function generateWithValidation(prompt: string, modelOrDirect: string): Promise<string> {
  let currentPrompt = prompt;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const rawRes =
        modelOrDirect === 'gemini-direct'
          ? await fetchGeminiDirect(currentPrompt)
          : await fetchOpenRouter(currentPrompt, modelOrDirect);

      const comment = parseCommentJson(rawRes);
      const len = comment.length;

      if (len >= 30 && len <= 50) {
        return comment;
      }

      if (len > 50) {
        currentPrompt += `\n\n【文字数エラー】前回の回答は${len}文字で50文字を超えていました。30〜50文字以内の日本語1文のJSON形式でやり直してください。`;
      } else {
        currentPrompt += `\n\n【文字数エラー】前回の回答は${len}文字で30文字未満でした。30〜50文字以内の日本語1文のJSON形式でやり直してください。`;
      }
    } catch (e) {
      console.warn(`Attempt ${attempt + 1} failed`, e);
      if (attempt === 2) throw e;
    }
  }

  const fallback =
    modelOrDirect === 'gemini-direct'
      ? await fetchGeminiDirect(prompt)
      : await fetchOpenRouter(prompt, modelOrDirect);

  return parseCommentJson(fallback).slice(0, 50);
}

// タグ提案機能 (本家 Gemini 3.5 Flash Lite 利用)
export async function suggestTagsForMemo(
  content: string = '',
  existingTags: string[] = []
): Promise<string[]> {
  if (!content.trim()) return [];
  const prompt = `
以下の読書メモに適切なタグを2〜5個提案し、JSON文字列配列でのみ返してください。
既存タグ: ${existingTags.join(', ')}
メモ: ${content}
`;
  try {
    const raw = await fetchGeminiDirect(prompt);
    return extractJsonArray(raw);
  } catch (e) {
    return [];
  }
}

// タグ重複検出機能 (本家 Gemini 3.5 Flash Lite 利用)
export type DuplicateTagGroup = {
  target: string;
  duplicates: string[];
};

export async function detectDuplicateTags(
  allTags: string[] = []
): Promise<DuplicateTagGroup[]> {
  if (allTags.length < 2) return [];
  const prompt = `
以下のタグ一覧から表記揺れ・同義タグを検出し、[{"target":"代表","duplicates":["重複1"]}] のJSON配列のみで返してください。
タグ: ${allTags.join(', ')}
`;
  try {
    const raw = await fetchGeminiDirect(prompt);
    return extractJsonArray(raw);
  } catch (e) {
    return [];
  }
}