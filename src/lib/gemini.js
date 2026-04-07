/**
 * Gemini API Client for AI漫画翻訳ツール
 * Nano Banana Pro / キャラクターメーカー準拠の Zenith Protocol フォールバック
 * 
 * 2つの機能:
 * 1. extractTranslations() — テキストモデルで漫画テキスト抽出+翻訳
 * 2. generateTranslatedImage() — 画像モデルで英訳済み画像を生成
 */

// ── APIキー管理（メモリ限定・localStorage永続化なし） ──
let currentApiKey = "";
export const setApiKey = (key) => { currentApiKey = key; };
export const getApiKey = () => currentApiKey;

// ── テキスト抽出用モデル（NBP TEXT_MODEL_IDS 準拠） ──
const TEXT_MODEL_IDS = [
  "gemini-2.5-flash",                 // Primary: 高速・画像対応
  "gemini-2.5-pro",                   // Backup 1: 高品質・安定
  "gemini-3-flash-preview",           // Backup 2: Next-Gen
  "gemini-2.5-flash-lite",            // Fallback 1: 軽量安定
  "gemini-3.1-flash-lite-preview"     // Fallback 2: Next-Gen Lite
];

// ── 画像生成用モデル（ドロップダウン選択肢 — NBP imagen.js 準拠） ──
// responseModalities: ["IMAGE"] に対応するモデルのみ
export const IMAGE_MODEL_OPTIONS = [
  { value: "gemini-2.5-flash-preview-image",  label: "Gemini 2.5 Flash Image (推奨)" },
  { value: "gemini-3.1-flash-image-preview",   label: "Gemini 3.1 Flash Image (Next-Gen)" },
  { value: "gemini-2.5-flash-image",           label: "Gemini 2.5 Flash Image (Stable)" },
];

// ── 診断機能 ──
export const diagnoseConnection = async () => {
  if (!currentApiKey) return "API Key not set.";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${currentApiKey}`);
    const data = await response.json();
    if (data.error) return `API Error: ${data.error.message}`;
    if (!data.models) return "No models returned by API.";
    const relevant = data.models
      .map(m => m.name.replace("models/", ""))
      .filter(name => name.includes("gemini") || name.includes("imagen"));
    return `Available Models: ${relevant.join(", ")}`;
  } catch (e) {
    return `Diagnostic Failed: ${e.message}`;
  }
};

/**
 * STEP 1: テキスト抽出+翻訳
 * 画像から日本語テキスト（タイトル、吹き出し、擬音）を検出し英訳を生成
 * @param {string} base64Image base64エンコードされた画像データ
 * @param {function} onStatus ステータス更新コールバック
 * @returns {Array<{type: string, original: string, translated: string}>}
 */
export const extractTranslations = async (base64Image, onStatus) => {
  if (!currentApiKey) throw new Error("API Key が設定されていません。");

  const prompt = `あなたは日本語漫画の翻訳専門家です。
この漫画画像に含まれる全てのテキスト要素を検出し、英訳してください。

検出対象:
- タイトル (title)
- 吹き出し内のセリフ (dialogue)
- ナレーション (narration)
- 擬音・効果音 (sfx)
- その他テキスト (other)

以下のJSON配列形式で出力してください（他の説明は一切不要）:
[
  {"type": "title", "original": "日本語テキスト", "translated": "English translation"},
  {"type": "dialogue", "original": "日本語テキスト", "translated": "English translation"},
  {"type": "sfx", "original": "ドカーン", "translated": "KABOOM"}
]

ルール:
- 擬音は英語の効果音表現に変換すること (例: ドキドキ→BA-DUMP, ザァァ→WHOOOOSH, ゴゴゴ→RUMBLE)
- セリフは自然な英語に翻訳すること
- 全テキスト要素を漏れなく検出すること
- 出力はJSON配列のみ。マークダウンコードブロックは使わないこと`;

  const imagePayload = {
    inlineData: {
      mimeType: "image/png",
      data: base64Image
    }
  };

  for (const modelId of TEXT_MODEL_IDS) {
    try {
      if (onStatus) onStatus(`> [抽出] ${modelId} でテキスト解析中...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

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
              maxOutputTokens: 4096,
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
      clearTimeout(timeoutId);

      const data = await response.json();
      if (data.error) throw new Error(`${data.error.message} (Code: ${data.error.code})`);

      const candidates = data.candidates || [];
      if (!candidates.length) throw new Error("No response candidates");

      let text = candidates[0]?.content?.parts?.[0]?.text || "";
      if (!text) throw new Error("Empty response");

      // JSON抽出（コードブロックを除去）
      text = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
      
      const translations = JSON.parse(text);
      if (onStatus) onStatus(`> [抽出] 完了 ✓ ${translations.length}件検出 (${modelId})`);
      return translations;

    } catch (err) {
      let msg = err.message;
      if (err.name === "AbortError") msg = "Timeout (60s)";
      console.warn(`[Extract] ${modelId} failed:`, msg);
      if (onStatus) onStatus(`> [抽出] ${modelId} 失敗。次のモデルへ...`);
    }
  }

  // 全モデル失敗
  if (onStatus) onStatus("> [抽出] 全モデル失敗。診断中...");
  const diagnosis = await diagnoseConnection();
  throw new Error(`テキスト抽出失敗: ${diagnosis}`);
};

/**
 * STEP 1.5: 単一テキストの再翻訳
 * ユーザーが日本語を修正した際に個別に英訳を取得する
 */
export const translateSingleText = async (originalText) => {
  if (!currentApiKey) throw new Error("API Key が設定されていません。");
  const prompt = `あなたは漫画の翻訳家です。以下の日本語のセリフまたは擬音を、アメコミ風の自然でダイナミックな短い英語に翻訳してください。出力は翻訳された英語の文字列のみとしてください。

テキスト: ${originalText}`;
  
  for (const modelId of TEXT_MODEL_IDS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${currentApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) return text.trim();
    } catch (e) {
      console.warn(`[SingleTranslate] ${modelId} failed:`, e.message);
    }
  }
  return originalText; // 失敗時は原文をそのまま返す
};

/**
 * STEP 2: 翻訳済み画像生成
 * 反転済み画像 + 翻訳テキスト → 英訳済み漫画画像
 * @param {string} base64FlippedImage 左右反転済みの画像 (base64)
 * @param {Array} translations 翻訳テキストリスト
 * @param {string} selectedModel 使用するモデルID
 * @param {function} onStatus ステータス更新コールバック
 * @returns {{ base64Img: string, usedModel: string }}
 */
export const generateTranslatedImage = async (base64FlippedImage, translations, selectedModel, onStatus, instructionRules = [], customPrompt = "") => {
  if (!currentApiKey) throw new Error("API Key が設定されていません。");

  // 翻訳テキストをプロンプトに組み込む
  const translationList = translations
    .map((t, i) => `${i + 1}. [${t.type}] "${t.original}" → "${t.translated}"`)
    .join("\n");

  let basePrompt = `あなたは漫画の英語ローカライズ専門家です。
この日本語漫画画像を英語版に変換してください。

以下の翻訳テキストを使用して、画像内の全ての日本語テキストを英語に置き換えた画像を生成してください:

${translationList}

【絶対に守るべき物理的制約・ルール】
1. 【角度・方向の絶対指定】英語テキストは全て完全に「水平（0度）」かつ「横書き」(strict horizontal left-to-right) で描画すること。縦長の吹き出しの形に合わせて文字全体を90度回転させたり、T,h,eのように縦に1文字ずつ積むスタッキングは《絶対禁止》です。
2. 【サイズと改行】日本の縦長吹き出しに水平の英語を収めるため、**フォントサイズを大幅に小さくし**、単語ごとに**大量の改行（折り返し）**を入れて横幅を圧縮すること。
3. 【吹き出しの変形】上記でも収まらない場合は、元の縦長吹き出しの枠線を完全に無視して、テキストが枠外にはみ出すことを許可します。あるいは既存の吹き出しの上に巨大な横長の吹き出しを上書きしてください。
4. 【フォントスタイル】アメコミ風の大文字（ALL CAPS）フォントを使用すること。
5. 擬音・効果音も同様に、元の位置にアメコミ風の水平レタリングで配置すること。`;

  // ユーザーからの追加指示（再生成時など）
  if (instructionRules.length > 0 || customPrompt.trim()) {
    basePrompt += `\n\n【重要なユーザー追加修正指示】\n以下はユーザーから指定された修正依頼です。全体のルールよりもこの指示を最優先に適用して描画してください。\n`;
    if (instructionRules.length > 0) {
      basePrompt += instructionRules.map(r => `- ${r}`).join('\n') + `\n`;
    }
    if (customPrompt.trim()) {
      basePrompt += `- 詳細指示: ${customPrompt.trim()}\n`;
    }
  }

  const prompt = basePrompt;

  const imagePayload = {
    inlineData: {
      mimeType: "image/png",
      data: base64FlippedImage
    }
  };

  // 選択モデル → フォールバックリスト構築
  const modelsToTry = [selectedModel, ...IMAGE_MODEL_OPTIONS.map(m => m.value).filter(m => m !== selectedModel)];

  for (const modelId of modelsToTry) {
    try {
      if (onStatus) onStatus(`> [生成] ${modelId} で英訳画像を生成中...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3分タイムアウト

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
      clearTimeout(timeoutId);

      const data = await response.json();
      if (data.error) throw new Error(`${data.error.message} (Code: ${data.error.code})`);

      const candidates = data.candidates || [];
      if (!candidates.length) {
        if (data.promptFeedback?.blockReason) {
          throw new Error(`Safety Filter: ${data.promptFeedback.blockReason}`);
        }
        throw new Error("No response candidates");
      }

      // 画像パーツを検索
      const parts = candidates[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inlineData);
      if (imagePart?.inlineData?.data) {
        if (onStatus) onStatus(`> [生成] 完了 ✓ (${modelId})`);
        return { base64Img: imagePart.inlineData.data, usedModel: modelId };
      }

      throw new Error(`画像データなし (${modelId})`);

    } catch (err) {
      let msg = err.message;
      if (err.name === "AbortError") msg = "Timeout (180s)";
      console.warn(`[ImageGen] ${modelId} failed:`, msg);
      if (onStatus) onStatus(`> [生成] ${modelId} 失敗: ${msg.substring(0, 80)}`);
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
