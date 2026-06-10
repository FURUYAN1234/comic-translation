/**
 * OpenAI API Client for AI漫画翻訳ツール
 * Dual Engine: ChatGPT テキスト処理 + gpt-image-2 画像編集
 *
 * 3つの機能:
 * 1. extractTranslationsOAI() — GPT-4.1 Vision でテキスト抽出+翻訳
 * 2. translateSingleTextOAI() — GPT-4.1-mini で個別再翻訳
 * 3. generateTranslatedImageOAI() — gpt-image-2 で翻訳済み画像を生成
 */

import { getLanguageInfo } from './languages';

// ── APIキー管理（メモリ限定・localStorage永続化なし） ──
let currentOpenAIApiKey = "";
export const setOpenAIApiKey = (key) => { currentOpenAIApiKey = key; };
export const getOpenAIApiKey = () => currentOpenAIApiKey;

// 画像付きリクエスト用モデルリスト（Vision対応モデル優先）
const VISION_MODEL_IDS = [
    "gpt-4.1",          // Primary: Vision対応・高品質
    "gpt-4o",           // Backup 1: Vision安定実績
    "gpt-4.1-mini",     // Backup 2: コスト効率
];

// テキストのみリクエスト用モデルリスト（Zenith Protocol相当のフォールバック）
const TEXT_MODEL_IDS = [
    "gpt-4.1",          // Primary: 高品質・1Mコンテキスト
    "gpt-4.1-mini",     // Backup 1: コスト効率・高速
    "gpt-4.1-nano",     // Backup 2: 最軽量・最速
    "gpt-4o",           // Fallback: 安定実績
];

// ── ユーティリティ ──

/** base64文字列をBlobに変換（Images Edit API用） */
const base64ToBlob = (base64, mimeType = 'image/png') => {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
};

/** base64画像の縦横サイズを取得 */
const getImageDimensions = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 1024, height: 1536 }); // フォールバック: 縦長想定
    img.src = `data:image/png;base64,${base64}`;
  });
};

/** アスペクト比からOpenAI APIのサイズパラメータを決定 */
const detectOutputSize = async (base64) => {
  const { width, height } = await getImageDimensions(base64);
  const ratio = width / height;
  if (ratio > 1.2) return '1536x1024';   // 横長
  if (ratio < 0.8) return '1024x1536';   // 縦長
  return '1024x1024';                     // 正方形
};

/** OpenAI Chat Completions API 共通呼び出し */
const callChatCompletion = async (modelId, messages, apiKey, timeout = 60000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        temperature: 0.3,
        max_tokens: 8192,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Empty response");
    return { text, model: modelId };

  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error(`Timeout (${timeout / 1000}s)`);
    throw e;
  }
};

// ══════════════════════════════════════════════
// STEP 1: テキスト抽出+翻訳（GPT-4.1 Vision）
// ══════════════════════════════════════════════

/**
 * 画像からテキストを抽出し翻訳する
 * gemini.js の extractTranslations と同一シグネチャ
 */
export const extractTranslationsOAI = async (base64Image, onStatus, targetLang = 'en', sourceLang = 'auto') => {
  if (!currentOpenAIApiKey) throw new Error("OpenAI API Key が設定されていません。");

  const langInfo = getLanguageInfo(targetLang);
  const langName = langInfo.name;
  const srcInfo = getLanguageInfo(sourceLang);
  const srcName = sourceLang === 'auto' ? null : srcInfo.name;

  // 擬音翻訳ガイド
  const sfxGuide = targetLang === 'en'
    ? '擬音は英語の効果音表現に変換すること (例: ドキドキ→BA-DUMP, ザァァ→WHOOOOSH, ゴゴゴ→RUMBLE)'
    : `擬音は${langName}の自然な効果音表現に変換すること`;

  const translationGuide = `セリフは自然な${langName}に翻訳すること`;

  // 読み順の説明
  const srcDirection = srcInfo.readingDirection;
  const readingOrderGuide = srcDirection === 'rtl'
    ? '読み順（右上→左下）で列挙してください。\n  - 1段に1コマなら "1段目" のように\n  - 1段に左右2コマなら "1段目右", "1段目左" のように（漫画の読み順：右→左）\n  - 1段に3コマ以上なら "2段目右", "2段目中", "2段目左" のように'
    : '読み順（左上→右下）で列挙してください。\n  - 1段に1コマなら "1段目" のように\n  - 1段に左右2コマなら "1段目左", "1段目右" のように（漫画の読み順：左→右）\n  - 1段に3コマ以上なら "2段目左", "2段目中", "2段目右" のように';

  const expertIntro = srcName
    ? `あなたは${srcName}の漫画・コミックの翻訳専門家です。\nこの漫画画像に含まれる全てのテキスト要素を検出し、${langName}に翻訳してください。`
    : `あなたは漫画・コミックの翻訳専門家です。\nこの漫画画像に含まれる全てのテキスト要素を自動検出し、${langName}に翻訳してください。テキストのソース言語は自動判定してください。`;

  // ターゲット言語のサンプル翻訳（プロンプトのJSONサンプルに使用）
  // AIのfew-shot exampleを正しい言語で誘導する
  const samples = langInfo.sampleTranslations || { title: 'Title', dialogue: 'Line', sfx: 'KABOOM' };

  const prompt = `${expertIntro}
同時に、画像のコマ構造（パネルレイアウト）も解析してください。

【STEP 1: コマ構造の解析】
画像を見て、コマ（パネル）の構造を判定してください。
- 縦に4コマが並ぶ「四コマ漫画」の場合: type="4koma", panels=["1コマ目","2コマ目","3コマ目","4コマ目"]
- それ以外の一般漫画の場合: type="general" とし、panels にはコマのラベルを${readingOrderGuide}
  - タイトルのみの段があれば "タイトル段" とする

【STEP 2: テキスト検出+翻訳】
検出対象:
- タイトル (title)
- 吹き出し内のセリフ (dialogue)
- ナレーション (narration)
- 擬音・効果音 (sfx)
- その他テキスト (other)

各テキストがどのコマに属するかも "panel" フィールドで指定してください。
タイトルや欄外テキストは panel を "欄外" としてください。

以下のJSONオブジェクト形式で出力してください（他の説明は一切不要）:
{
  "detectedLanguage": "ja",
  "layout": {
    "type": "4koma",
    "panels": ["1コマ目", "2コマ目", "3コマ目", "4コマ目"]
  },
  "texts": [
    {"type": "title", "original": "タイトル", "translated": "${samples.title}", "panel": "欄外"},
    {"type": "dialogue", "original": "セリフ", "translated": "${samples.dialogue}", "panel": "1コマ目"},
    {"type": "sfx", "original": "ドカーン", "translated": "${samples.sfx}", "panel": "3コマ目"}
  ]
}

ルール:
- ${sfxGuide}
- ${translationGuide}
- 全テキスト要素を漏れなく検出すること
- URL、ISBN、メールアドレスなどの技術的文字列が含まれる場合、そのURL等の文字列部分だけは翻訳・変更せず原文のまま維持し、それに付随する文章（例：「公式サイト：」など）は翻訳すること。また技術的文字列は大文字化してはならない
- 出力はJSONオブジェクトのみ。マークダウンコードブロックは使わないこと`;

  // Vision用メッセージ構築
  const userContent = [
    {
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${base64Image}`,
        detail: "high"
      }
    },
    { type: "text", text: prompt }
  ];

  const messages = [{ role: "user", content: userContent }];

  for (const modelId of VISION_MODEL_IDS) {
    try {
      if (onStatus) onStatus(`> [抽出/Extract] OpenAI ${modelId} でテキスト解析中... / Analyzing...`);

      const result = await callChatCompletion(modelId, messages, currentOpenAIApiKey, 25000);
      let text = result.text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(text);

      // 新形式 / 旧形式の正規化（gemini.jsと同一ロジック）
      let layout, texts, detectedSourceLang;
      if (Array.isArray(parsed)) {
        layout = { type: "4koma", panels: ["1コマ目", "2コマ目", "3コマ目", "4コマ目"] };
        texts = parsed.map(t => ({ ...t, panel: t.panel || "不明" }));
        detectedSourceLang = sourceLang;
      } else if (parsed.texts && parsed.layout) {
        layout = parsed.layout;
        texts = parsed.texts;
        detectedSourceLang = parsed.detectedLanguage || sourceLang;
      } else {
        throw new Error("予期しないレスポンス形式");
      }

      const layoutLabel = layout.type === '4koma' ? '四コマ / 4-koma' : `一般漫画 / Comic (${layout.panels.length}コマ/panels)`;
      if (onStatus) onStatus(`> [抽出/Extract] 完了 / Complete ✓ ${texts.length}件検出 / ${layoutLabel} (${modelId})`);
      return { layout, texts, detectedSourceLang };

    } catch (err) {
      console.warn(`[OpenAI Extract] ${modelId} failed:`, err.message);
      if (onStatus) onStatus(`> [抽出] OpenAI ${modelId} 失敗。次のモデルへ...`);
    }
  }

  throw new Error("OpenAI テキスト抽出: 全モデル失敗。APIキーの有効性・残高を確認してください。");
};

// ══════════════════════════════════════════════
// STEP 1.5: 個別再翻訳（GPT-4.1-mini）
// ══════════════════════════════════════════════

/**
 * 単一テキストの再翻訳
 * gemini.js の translateSingleText と同一シグネチャ
 */
export const translateSingleTextOAI = async (originalText, targetLang = 'en', sourceLang = 'auto') => {
  if (!currentOpenAIApiKey) throw new Error("OpenAI API Key が設定されていません。");

  const langInfo = getLanguageInfo(targetLang);
  const langName = langInfo.name;
  const srcInfo = getLanguageInfo(sourceLang);
  const srcName = sourceLang === 'auto' ? null : srcInfo.name;

  const styleHint = {
    comic: 'アメコミ風の自然でダイナミックな短い',
    manga: '漫画風の自然な',
    webtoon: '韓国ウェブトゥーン風の自然な',
    manhua: '中国漫画風の自然な',
    european: 'バンドデシネ風の自然な',
    general: '自然で読みやすい',
  }[langInfo.style] || '自然な';

  const srcDesc = srcName ? `${srcName}の` : '';
  const prompt = `あなたは漫画の翻訳家です。以下の${srcDesc}セリフまたは擬音を、${styleHint}${langName}に翻訳してください。出力は翻訳された${langName}の文字列のみとしてください。

テキスト: ${originalText}`;

  const messages = [{ role: "user", content: prompt }];

  for (const modelId of TEXT_MODEL_IDS) {
    try {
      const result = await callChatCompletion(modelId, messages, currentOpenAIApiKey, 25000);
      if (result.text) return result.text.trim();
    } catch (e) {
      console.warn(`[OpenAI SingleTranslate] ${modelId} failed:`, e.message);
    }
  }
  return originalText; // 失敗時は原文をそのまま返す
};

// ══════════════════════════════════════════════
// STEP 2: 翻訳済み画像生成（gpt-image-2 Edit API）
// ══════════════════════════════════════════════

/**
 * 言語別のスタイル指示を構築（英語版 — gpt-image-2 最適化）
 */
const buildOpenAIStyleInstructions = (langInfo, srcInfo = {}) => {
  const langName = langInfo.name;
  const srcName = srcInfo.name || 'source language';

  const commonRules = `- Completely erase all original ${srcName} text and render the translated ${langName} text in the exact same position.
- Preserve all speech bubble shapes, positions, and outlines exactly.
- Do NOT modify any artwork, character faces, bodies, backgrounds, or panel layouts.`;

  switch (langInfo.style) {
    case 'manga':
      return `TEXT RENDERING RULES:
1. Use vertical writing (top-to-bottom) inside tall/narrow bubbles, horizontal where appropriate.
2. Use natural Japanese manga fonts (Gothic or Mincho typeface).
3. Sound effects should use bold Japanese onomatopoeia.
${commonRules}`;

    case 'comic':
      return `TEXT RENDERING RULES:
1. ALL text must be strictly horizontal (left-to-right). NEVER rotate text vertically or stack characters.
2. Use American comic lettering: ALL CAPS bold for dialogue and SFX.
3. For tall/narrow bubbles, shrink font size and add line breaks. Text may overflow bubbles if necessary.
4. Items marked "EXACT CASE" (URLs, ISBNs) must preserve original casing exactly.
5. Sound effects should be dramatic English SFX (e.g., BA-DUMP, WHOOOOSH, RUMBLE).
${commonRules}`;

    case 'webtoon':
      return `TEXT RENDERING RULES:
1. ALL text must be horizontal (left-to-right).
2. Use clean Korean webtoon typography.
3. Sound effects should use natural Korean expressions.
${commonRules}`;

    case 'manhua':
      return `TEXT RENDERING RULES:
1. ALL text must be horizontal (left-to-right).
2. Use clear Chinese manhua typography. CJK characters are wider than Latin — adjust font size.
3. Sound effects should use natural Chinese expressions.
${commonRules}`;

    default:
      return `TEXT RENDERING RULES:
1. ALL text must be horizontal (left-to-right). NEVER rotate or stack text vertically.
2. Use clean, readable fonts appropriate for ${langName}.
3. For tall/narrow bubbles, shrink font size and add line breaks.
${commonRules}`;
  }
};

/**
 * 翻訳済み画像を生成する
 * gemini.js の generateTranslatedImage と同一シグネチャ
 */
export const generateTranslatedImageOAI = async (
  base64Image, translations, selectedModel, onStatus,
  instructionRules = [], customPrompt = "",
  targetLang = 'en', sourceLang = 'auto', isRefinement = false
) => {
  if (!currentOpenAIApiKey) throw new Error("OpenAI API Key が設定されていません。");

  const langInfo = getLanguageInfo(targetLang);
  const langName = langInfo.name;
  const srcInfo = getLanguageInfo(sourceLang);
  const srcName = sourceLang === 'auto' ? 'source language' : srcInfo.name;

  // 翻訳テキストリスト構築
  const isComicStyle = langInfo.style === 'comic';
  const translationList = translations
    .map((t, i) => {
      let displayTranslated = t.translated;
      if (isComicStyle && t.type !== 'other' && t.type !== 'narration') {
        displayTranslated = t.translated.toUpperCase();
      }
      const caseNote = (isComicStyle && t.type === 'other') ? ' ⚠EXACT CASE' : '';
      return `${i + 1}. [${t.type}${caseNote}] "${t.original}" → "${displayTranslated}"`;
    })
    .join("\n");

  const styleInstructions = buildOpenAIStyleInstructions(langInfo, srcInfo);

  // プロンプト構築
  let prompt;
  if (isRefinement) {
    prompt = `You are a professional manga lettering and localization specialist.
This image is an ALREADY TRANSLATED ${langName} manga page. Apply ONLY the following user corrections:

PRESERVATION RULES (NON-NEGOTIABLE):
- Do NOT modify any artwork, character faces, bodies, poses, or expressions.
- Do NOT change backgrounds, screen tones, shading, or colors.
- Do NOT alter panel layouts or speech bubble shapes.
- Maintain the EXACT same image resolution and quality.

CURRENT TRANSLATION REFERENCE:
${translationList}

USER CORRECTIONS (apply ONLY these):`;
    if (instructionRules.length > 0) {
      prompt += "\n" + instructionRules.map(r => `- ${r}`).join('\n');
    }
    if (customPrompt.trim()) {
      prompt += `\n- Additional: ${customPrompt.trim()}`;
    }
  } else {
    prompt = `You are a professional manga/comic localization specialist performing an IMAGE EDITING task.

TASK: Edit this ${srcName} comic/manga page to produce a fully translated ${langName} version.
Preserve the original artwork with pixel-level fidelity — ONLY the text content changes.

ART PRESERVATION (NON-NEGOTIABLE):
- The output image must be IDENTICAL to the input except for text content.
- Do NOT modify, redraw, or reinterpret any artwork, faces, bodies, hair, clothing, poses.
- Do NOT change backgrounds, screen tones, shading, lighting, or colors.
- Do NOT alter panel layouts, borders, or speech bubble shapes/positions.
- Do NOT add any border or frame around the output image.
- Maintain the EXACT original image resolution and visual sharpness.

TRANSLATION LIST — Replace each original text with its translation:
${translationList}

${styleInstructions}

COMPLETENESS:
- Translate 100% of visible text — missing even one speech bubble is unacceptable.
- Include margin annotations, small print, and any text outside panels.

VERIFICATION BEFORE OUTPUT:
☑ Every text element translated — none missing.
☑ Character artwork IDENTICAL to original.
☑ No original ${srcName} text remains visible.`;

    // ユーザー追加指示
    if (instructionRules.length > 0 || customPrompt.trim()) {
      prompt += `\n\nADDITIONAL USER INSTRUCTIONS (highest priority):`;
      if (instructionRules.length > 0) {
        prompt += "\n" + instructionRules.map(r => `- ${r}`).join('\n');
      }
      if (customPrompt.trim()) {
        prompt += `\n- ${customPrompt.trim()}`;
      }
    }
  }

  // 画像をBlobに変換
  const imageBlob = base64ToBlob(base64Image);

  // アスペクト比からサイズ決定
  const outputSize = await detectOutputSize(base64Image);

  if (onStatus) onStatus(`> [生成/Generate] gpt-image-2 で${langName}画像を${isRefinement ? '修正' : '生成'}中... (${outputSize}) / Generating...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分タイムアウト

  let seconds = 0;
  const timerId = setInterval(() => {
    seconds++;
    if (onStatus) {
      onStatus(`> [生成/Generate] gpt-image-2 で${langName}画像を${isRefinement ? '修正' : '生成'}中... (${outputSize}, ${seconds}秒経過) / Generating...`);
    }
  }, 1000);

  try {
    const formData = new FormData();
    formData.append('model', 'gpt-image-2');
    formData.append('image', imageBlob, 'manga.png');
    formData.append('prompt', prompt);
    formData.append('size', outputSize);
    formData.append('quality', 'high');
    formData.append('n', '1');

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentOpenAIApiKey}`
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (data.data && data.data.length > 0 && data.data[0].b64_json) {
      if (onStatus) onStatus(`> [生成/Generate] 完了 / Complete ✓ (gpt-image-2, ${seconds}秒)`);
      return { base64Img: data.data[0].b64_json, usedModel: "gpt-image-2" };
    }

    throw new Error("APIレスポンスに画像データが含まれていませんでした。");

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error("画像生成タイムアウト (300秒)。サーバーが混雑している可能性があります。");
    }
    // 安全フィルターの検出
    if (err.message.includes("safety") || err.message.includes("SAFETY") || err.message.includes("content_policy")) {
      throw new Error("【コンテンツ制限】安全フィルターにより画像生成がブロックされました。");
    }
    throw err;
  } finally {
    clearInterval(timerId);
  }
};
