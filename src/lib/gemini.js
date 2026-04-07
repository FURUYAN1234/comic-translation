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
 * STEP 2: 翻訳済み画像生成
 * 反転済み画像 + 翻訳テキスト → 英訳済み漫画画像
 * @param {string} base64FlippedImage 左右反転済みの画像 (base64)
 * @param {Array} translations 翻訳テキストリスト
 * @param {string} selectedModel 使用するモデルID
 * @param {function} onStatus ステータス更新コールバック
 * @returns {{ base64Img: string, usedModel: string }}
 */
export const generateTranslatedImage = async (base64FlippedImage, translations, selectedModel, onStatus) => {
  if (!currentApiKey) throw new Error("API Key が設定されていません。");

  // 翻訳テキストをプロンプトに組み込む
  const translationList = translations
    .map((t, i) => `${i + 1}. [${t.type}] "${t.original}" → "${t.translated}"`)
    .join("\n");

  const prompt = `あなたは漫画の英語ローカライズ専門家です。
この日本語漫画画像を英語版に変換してください。

以下の翻訳テキストを使用して、画像内の全ての日本語テキストを英語に置き換えた画像を生成してください:

${translationList}

【絶対に守るべきルール】
1. 【厳守】英語テキストは全て完全に「横書き」(strict horizontal left-to-right) で記載すること。絶対に文字を縦に並べたり、文字を90度回転させて寝かせた状態で配置しないでください。
2. テキストのフォントは、可能な限りアメコミ風（American comic-book style lettering）の大文字フォント等を使用し、読みやすくすること。
3. 吹き出しのサイズや形を横書きテキストに合わせて調整すること。英語の横書きが自然に収まるよう、必要に応じて吹き出しを横長に変形させること。
4. 擬音・効果音は元の位置に、アメコミ風のダイナミックなレタリングで配置すること。
5. 元の画像の構図、キャラクター、背景は可能な限り維持すること。
6. テキストは読みやすいフォントサイズで、吹き出し内に収まるように配置し、行送り（センタリング）を適切に行うこと。
7. タイトルは目立つ英語タイポグラフィで表現すること。`;

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
