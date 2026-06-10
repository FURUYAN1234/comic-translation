/**
 * Gemini API Client for AI漫画翻訳ツール
 * 共通モジュール準拠の Zenith Protocol フォールバック
 * 
 * 2つの機能:
 * 1. extractTranslations() — テキストモデルで漫画テキスト抽出+翻訳
 * 2. generateTranslatedImage() — 画像モデルで翻訳済み画像を生成
 */

import { getLanguageInfo } from './languages';

// ── APIキー管理（メモリ限定・localStorage永続化なし） ──
let currentApiKey = "";
export const setApiKey = (key) => { currentApiKey = key; };
export const getApiKey = () => currentApiKey;

// テキストのみリクエスト用 (シナリオ生成等): Next-Gen優先・無料枠優先
const TEXT_MODEL_IDS = [
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-flash-latest",
    "gemini-pro-latest"
];

// 画像付きリクエスト用 (キャラクターシート認識等): フィルター寛容モデル優先
const IMAGE_MODEL_IDS = [
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-flash-latest",
    "gemini-pro-latest"
];

// ── 画像生成用モデル（ドロップダウン選択肢 — NBP imagen.js 準拠） ──
// responseModalities: ["IMAGE"] に対応するモデルのみ
export const IMAGE_MODEL_OPTIONS = [
  { value: "gemini-3.1-flash-image-preview",   label: "Gemini 3.1 Flash Image (次世代高精度/推奨)" },
  { value: "gemini-2.5-flash-image",           label: "Gemini 2.5 Flash Image (旧高速版)" },
];

// ── 診断機能 ──
export const diagnoseConnection = async () => {
  if (!currentApiKey) return "API Key not set.";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${currentApiKey}`,
      { signal: controller.signal }
    );
    const data = await response.json();
    if (data.error) return `API Error: ${data.error.message}`;
    if (!data.models) return "No models returned by API.";
    const relevant = data.models
      .map(m => m.name.replace("models/", ""))
      .filter(name => name.includes("gemini") || name.includes("imagen"));
    return `Available Models: ${relevant.join(", ")}`;
  } catch (e) {
    let msg = e.message;
    if (e.name === 'AbortError') msg = "Timeout (10s)";
    return `Diagnostic Failed: ${msg}`;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * STEP 1: テキスト抽出+翻訳
 * 画像から日本語テキスト（タイトル、吹き出し、擬音）を検出し翻訳を生成
 * @param {string} base64Image base64エンコードされた画像データ
 * @param {function} onStatus ステータス更新コールバック
 * @param {string} targetLang 翻訳先言語コード（デフォルト: 'en'）
 * @param {string} sourceLang ソース言語コード（デフォルト: 'auto' = 自動検出）
 * @returns {Object} {layout, texts}
 */
export const extractTranslations = async (base64Image, onStatus, targetLang = 'en', sourceLang = 'auto') => {
  if (!currentApiKey) throw new Error("API Key が設定されていません。");

  const langInfo = getLanguageInfo(targetLang);
  const langName = langInfo.name; // 例: "English", "Korean"
  const srcInfo = getLanguageInfo(sourceLang);
  const srcName = sourceLang === 'auto' ? null : srcInfo.name;

  // ソース言語に応じた擬音翻訳ガイド
  const sfxGuide = targetLang === 'en'
    ? '擬音は英語の効果音表現に変換すること (例: ドキドキ→BA-DUMP, ザァァ→WHOOOOSH, ゴゴゴ→RUMBLE)'
    : `擬音は${langName}の自然な効果音表現に変換すること`;

  const translationGuide = `セリフは自然な${langName}に翻訳すること`;

  // ソース言語に応じた読み順の説明
  const srcDirection = srcInfo.readingDirection;
  const readingOrderGuide = srcDirection === 'rtl'
    ? '読み順（右上→左下）で列挙してください。\n  - 1段に1コマなら "1段目" のように\n  - 1段に左右2コマなら "1段目右", "1段目左" のように（漫画の読み順：右→左）\n  - 1段に3コマ以上なら "2段目右", "2段目中", "2段目左" のように'
    : '読み順（左上→右下）で列挙してください。\n  - 1段に1コマなら "1段目" のように\n  - 1段に左右2コマなら "1段目左", "1段目右" のように（漫画の読み順：左→右）\n  - 1段に3コマ以上なら "2段目左", "2段目中", "2段目右" のように';

  // ソース言語指定の有無でプロンプト冒頭を変更
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
  "detectedLanguage": "ja", // 検出したソース言語の言語コード（ja, en, ko, zh-CN, zh-TW, es, fr, de, id, th のいずれか）
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

  const imagePayload = {
    inlineData: {
      mimeType: "image/png",
      data: base64Image
    }
  };

  for (const modelId of TEXT_MODEL_IDS) {
    let timeoutId;
    try {
      if (onStatus) onStatus(`> [抽出/Extract] ${modelId} でテキスト解析中... / Analyzing...`);

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${currentApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [imagePayload, { text: prompt }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ]
          }),
          signal: controller.signal,
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(`${data.error.message} (Code: ${data.error.code})`);

      const candidates = data.candidates || [];
      if (!candidates.length) throw new Error("No response candidates");

      let text = candidates[0]?.content?.parts?.[0]?.text || "";
      if (!text) throw new Error("Empty response");

      // JSON抽出（コードブロックを除去）
      text = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
      
      const parsed = JSON.parse(text);

      // 新形式 {detectedLanguage, layout, texts} か旧形式 [配列] かを判定して正規化
      let layout, texts, detectedSourceLang;
      if (Array.isArray(parsed)) {
        // 旧形式フォールバック: 配列のみ返った場合は4コマデフォルト
        layout = { type: "4koma", panels: ["1コマ目", "2コマ目", "3コマ目", "4コマ目"] };
        texts = parsed.map(t => ({ ...t, panel: t.panel || "不明" }));
        detectedSourceLang = sourceLang;
      } else if (parsed.texts && parsed.layout) {
        // 新形式
        layout = parsed.layout;
        texts = parsed.texts;
        detectedSourceLang = parsed.detectedLanguage || sourceLang;
      } else {
        throw new Error("予期しないレスポンス形式");
      }

      if (onStatus) onStatus(`> [抽出/Extract] 完了 / Complete ✓ ${texts.length}件検出 / ${layout.type === "4koma" ? "四コマ(4-koma)" : "一般漫画(Comic)"}(${layout.panels.length}コマ) (${modelId})`);
      return { layout, texts, detectedSourceLang };

    } catch (err) {
      let msg = err.message;
      if (err.name === "AbortError") msg = "Timeout (25s)";
      console.warn(`[Extract] ${modelId} failed:`, msg);
      if (onStatus) onStatus(`> [抽出] ${modelId} 失敗。次のモデルへ...`);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  // 全モデル失敗
  if (onStatus) onStatus("> [抽出] 全モデル失敗。診断中...");
  const diagnosis = await diagnoseConnection();
  throw new Error(`テキスト抽出失敗: ${diagnosis}`);
};

/**
 * STEP 1.5: 単一テキストの再翻訳
 * ユーザーが日本語を修正した際に個別に翻訳を取得する
 * @param {string} originalText 原文テキスト
 * @param {string} targetLang 翻訳先言語コード（デフォルト: 'en'）
 * @param {string} sourceLang ソース言語コード（デフォルト: 'auto'）
 */
export const translateSingleText = async (originalText, targetLang = 'en', sourceLang = 'auto') => {
  if (!currentApiKey) throw new Error("API Key が設定されていません。");
  const langInfo = getLanguageInfo(targetLang);
  const langName = langInfo.name;
  const srcInfo = getLanguageInfo(sourceLang);
  const srcName = sourceLang === 'auto' ? null : srcInfo.name;

  // 言語別のスタイル指示
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
  
  for (const modelId of TEXT_MODEL_IDS) {
    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 25000);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${currentApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal,
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) return text.trim();
    } catch (e) {
      console.warn(`[SingleTranslate] ${modelId} failed:`, e.message);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
  return originalText; // 失敗時は原文をそのまま返す
};

/**
 * STEP 2: 翻訳済み画像生成
 * 入力画像 + 翻訳テキスト → 翻訳済み漫画画像
 * @param {string} base64Image 画像 (base64)
 * @param {Array} translations 翻訳テキストリスト
 * @param {string} selectedModel 使用するモデルID
 * @param {function} onStatus ステータス更新コールバック
 * @param {Array} instructionRules 再生成ルール
 * @param {string} customPrompt カスタムプロンプト
 * @param {string} targetLang 翻訳先言語コード（デフォルト: 'en'）
 * @param {string} sourceLang ソース言語コード（デフォルト: 'auto'）
 * @returns {{ base64Img: string, usedModel: string }}
 */
export const generateTranslatedImage = async (base64Image, translations, selectedModel, onStatus, instructionRules = [], customPrompt = "", targetLang = 'en', sourceLang = 'auto', isRefinement = false) => {
  if (!currentApiKey) throw new Error("API Key が設定されていません。");

  const langInfo = getLanguageInfo(targetLang);
  const langName = langInfo.name;
  const srcInfo = getLanguageInfo(sourceLang);
  const srcName = sourceLang === 'auto' ? 'source language' : srcInfo.name;

  // 翻訳テキストをプロンプトに組み込む
  // comicスタイル（英語等）: dialogue/title/sfx は事前ALL CAPS化、other（URL等）は原文ケーシング維持
  const isComicStyle = langInfo.style === 'comic';
  const translationList = translations
    .map((t, i) => {
      let displayTranslated = t.translated;
      if (isComicStyle && t.type !== 'other' && t.type !== 'narration') {
        // アメコミ風: セリフ・タイトル・擬音はALL CAPSに事前変換
        displayTranslated = t.translated.toUpperCase();
      }
      // otherタイプにはケーシング保護注記を付加
      const caseNote = (isComicStyle && t.type === 'other') ? ' ⚠EXACT CASE' : '';
      return `${i + 1}. [${t.type}${caseNote}] "${t.original}" → "${displayTranslated}"`;
    })
    .join("\n");

  // 言語別のスタイル指示を構築
  const styleInstructions = buildStyleInstructions(langInfo, srcInfo);

  let basePrompt;

  if (isRefinement) {
    // ── 修正モード: 翻訳済み画像をベースに部分修正 ──
    basePrompt = `You are a professional manga lettering and localization specialist.
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
      basePrompt += "\n" + instructionRules.map(r => `- ${r}`).join('\n');
    }
    if (customPrompt.trim()) {
      basePrompt += `\n- Additional: ${customPrompt.trim()}`;
    }
  } else {
    // ── 初回生成モード: 原画から翻訳画像を新規生成 ──
    basePrompt = `You are a professional manga/comic localization specialist performing an IMAGE EDITING task.

TASK: Edit this ${srcName} comic/manga page to produce a fully translated ${langName} version.
Preserve the original artwork with pixel-level fidelity — ONLY the text content changes.

ART PRESERVATION (NON-NEGOTIABLE):
- The output image must be IDENTICAL to the input except for text content.
- Do NOT modify, redraw, or reinterpret any artwork, faces, bodies, hair, clothing, poses.
- Do NOT change backgrounds, screen tones, shading, lighting, or colors.
- Do NOT alter panel layouts, borders, or speech bubble shapes/positions.
- Do NOT add any border or frame around the output image.
- Maintain the EXACT original image resolution and visual sharpness.

## MIRRORED IMAGE ALERT
The input image might be horizontally flipped (mirrored). If you see ANY text, copyright notices, or watermarks written backwards or mirrored, DO NOT BE CONFUSED. You MUST completely erase ALL backwards text from the image.
1. For text in the TRANSLATION LIST, erase the backwards text and write the translation normally (reading left-to-right).
2. For ANY OTHER backwards text (like watermarks) not in the list, simply ERASE it completely (fill with background color). NEVER leave mirrored text in the final output.

TRANSLATION LIST — Replace each original text with its translation:
${translationList}

${styleInstructions}

COMPLETENESS:
- Translate 100% of visible text — missing even one speech bubble is unacceptable.
- Include margin annotations, small print, and any text outside panels.

FINAL CHECK: Ensure NO original ${srcName} text remains and NO artwork was altered.`;

    // ユーザーからの追加指示（初回生成時のカスタムプロンプト）
    if (instructionRules.length > 0 || customPrompt.trim()) {
      basePrompt += `\n\nADDITIONAL USER INSTRUCTIONS:\n`;
      if (instructionRules.length > 0) {
        basePrompt += instructionRules.map(r => `- ${r}`).join('\n') + `\n`;
      }
      if (customPrompt.trim()) {
        basePrompt += `- Additional: ${customPrompt.trim()}\n`;
      }
    }
  }

  const prompt = basePrompt;

  const imagePayload = {
    inlineData: {
      mimeType: "image/png",
      data: base64Image
    }
  };

  // 選択モデル → フォールバックリスト構築
  const modelsToTry = [selectedModel, ...IMAGE_MODEL_OPTIONS.map(m => m.value).filter(m => m !== selectedModel)];
  const tgtLangName = langInfo.name;

  for (const modelId of modelsToTry) {
    let timeoutId;
    try {
      if (onStatus) onStatus(`> [生成/Generate] ${modelId} で${tgtLangName}画像を生成中... / Generating image...`);

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 180000); // 3分タイムアウト

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${currentApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [imagePayload, { text: prompt }]
            }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
              temperature: 0.4,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ]
          }),
          signal: controller.signal,
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(`${data.error.message} (Code: ${data.error.code})`);

      const candidates = data.candidates || [];
      if (!candidates.length) {
        if (data.promptFeedback?.blockReason) {
          throw new Error(`Safety Filter: ${data.promptFeedback.blockReason}`);
        }
        throw new Error("No response candidates");
      }

      const parts = candidates[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inlineData);
      if (imagePart?.inlineData?.data) {
        if (onStatus) onStatus(`> [生成/Generate] 完了 / Complete ✓ (${modelId})`);
        return { base64Img: imagePart.inlineData.data, usedModel: modelId };
      }

      throw new Error(`画像データなし (${modelId})`);

    } catch (err) {
      let msg = err.message;
      if (err.name === "AbortError") msg = "Timeout (180s)";
      console.warn(`[ImageGen] ${modelId} failed:`, msg);
      if (onStatus) onStatus(`> [生成] ${modelId} 失敗: ${msg.substring(0, 80)}...`);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  // 全モデル失敗
  if (onStatus) onStatus("> [生成] 全モデル失敗。診断中...");
  const diagnosis = await diagnoseConnection();
  let errorMsg = `画像生成全モデルエラー。\n${diagnosis}`;
  if (diagnosis.includes("Quota") || diagnosis.includes("429")) {
    errorMsg = "【API制限】使用回数の上限に達しました。しばらく待ってから再試行してください。";
  } else if (diagnosis.includes("SAFETY") || diagnosis.includes("PROHIBITED")) {
    errorMsg = "【コンテンツ制限】安全フィルターにより画像生成がブロックされました。";
  }
  throw new Error(errorMsg);
};

/**
 * 言語別のスタイル指示を構築
 * 画像生成プロンプトに埋め込むレタリング・テキスト描画ルール
 * @param {Object} langInfo languages.js のターゲット言語情報
 * @param {Object} srcInfo languages.js のソース言語情報
 * @returns {string} プロンプトに挿入するスタイル指示テキスト
 */
const buildStyleInstructions = (langInfo, srcInfo = {}) => {
  const langName = langInfo.name;
  const srcName = srcInfo.name || 'source language';
  const isRtlSource = srcInfo.readingDirection === 'rtl';

  const commonRules = `- Completely erase all original ${srcName} text and render the translated ${langName} text in the exact same position.
- Preserve all speech bubble shapes, positions, and outlines exactly.`;

  const verticalBubbleHint = isRtlSource
    ? `To fit horizontal ${langName} text into tall/narrow vertical speech bubbles, shrink the font size and insert line breaks.`
    : `Adjust font size and insert line breaks so the text fits naturally.`;

  switch (langInfo.style) {
    case 'manga':
      return `## STEP 2: TEXT RENDERING STYLE (CRITICAL)
1. Direction: Render ${langName} text vertically (top-to-bottom) or horizontally, matching the original bubble shape.
2. Fitting & Line Breaks: Adjust font size and character spacing to fit naturally inside bubbles.
3. Font Style: Use natural Japanese manga fonts (Gothic for standard, Mincho for monologue).
4. SFX: Render sound effects with dynamic Japanese manga lettering.
${commonRules}`;

    case 'comic':
      return `## STEP 2: TEXT RENDERING STYLE (CRITICAL)
1. Strict Direction: All ${langName} text MUST be rendered strictly horizontal (0 degrees, left-to-right). Rotating the text 90 degrees to fit tall bubbles, or stacking letters vertically (e.g., T, h, e) is STRICTLY PROHIBITED.
2. Fitting & Line Breaks: ${verticalBubbleHint}
3. Overflow Allowance: If the text still does not fit, you are allowed to completely ignore the original speech bubble borders and let the text overflow outside the bubble, or overwrite a massive horizontal bubble over the existing one.
4. Casing Protection: The text in the translation list already has the correct uppercase/lowercase casing. Render each text EXACTLY as listed. Do NOT arbitrarily change case. Items marked with "⚠EXACT CASE" (like URLs or ISBNs) must be rendered exactly as original.
5. SFX: Render sound effects with dynamic American comic book style lettering.
${commonRules}`;

    case 'webtoon':
      return `## STEP 2: TEXT RENDERING STYLE (CRITICAL)
1. Strict Direction: All ${langName} text MUST be rendered horizontal (left-to-right).
2. Fitting & Line Breaks: ${verticalBubbleHint}
3. Font Style: Use natural Webtoon/Manhwa fonts that are easy to read on mobile devices.
4. SFX: Render sound effects with bold, dynamic lettering in ${langName}.
${commonRules}`;

    case 'manhua':
      return `## STEP 2: TEXT RENDERING STYLE (CRITICAL)
1. Strict Direction: All ${langName} text MUST be rendered horizontal (left-to-right).
2. Fitting & Line Breaks: ${verticalBubbleHint} Note that Chinese characters are wider than English.
3. Font Style: Use clear and readable fonts typical for Chinese Manhua.
4. SFX: Render sound effects naturally in ${langName}.
${commonRules}`;

    case 'european':
      return `## STEP 2: TEXT RENDERING STYLE (CRITICAL)
1. Strict Direction: All ${langName} text MUST be rendered strictly horizontal (0 degrees, left-to-right). Vertical stacking is STRICTLY PROHIBITED.
2. Fitting & Line Breaks: ${verticalBubbleHint}
3. Overflow Allowance: If the text does not fit, you are allowed to let the text overflow outside the bubble.
4. Font Style: Use readable fonts typical for European Bande Dessinée.
5. SFX: Render sound effects naturally in ${langName}.
${commonRules}`;

    default:
      return `## STEP 2: TEXT RENDERING STYLE (CRITICAL)
1. Strict Direction: All ${langName} text MUST be rendered strictly horizontal (left-to-right). Vertical stacking is prohibited.
2. Fitting & Line Breaks: ${verticalBubbleHint}
3. Overflow Allowance: If the text does not fit, you are allowed to let the text overflow outside the bubble.
4. Font Style: Use clear and readable fonts.
5. SFX: Render sound effects naturally in ${langName}.
${commonRules}`;
  }
};
