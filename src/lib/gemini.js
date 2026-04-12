/**
 * Gemini API Client for AI漫画翻訳ツール
 * Nano Banana Pro / キャラクターメーカー準拠の Zenith Protocol フォールバック
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
 * 画像から日本語テキスト（タイトル、吹き出し、擬音）を検出し翻訳を生成
 * @param {string} base64Image base64エンコードされた画像データ
 * @param {function} onStatus ステータス更新コールバック
 * @param {string} targetLang 翻訳先言語コード（デフォルト: 'en'）
 * @returns {Object} {layout, texts}
 */
export const extractTranslations = async (base64Image, onStatus, targetLang = 'en') => {
  if (!currentApiKey) throw new Error("API Key が設定されていません。");

  const langInfo = getLanguageInfo(targetLang);
  const langName = langInfo.name; // 例: "English", "Korean"

  // 言語別の擬音翻訳ガイド
  const sfxGuide = targetLang === 'en'
    ? '擬音は英語の効果音表現に変換すること (例: ドキドキ→BA-DUMP, ザァァ→WHOOOOSH, ゴゴゴ→RUMBLE)'
    : `擬音は${langName}の自然な効果音表現に変換すること`;

  const translationGuide = targetLang === 'en'
    ? 'セリフは自然な英語に翻訳すること'
    : `セリフは自然な${langName}に翻訳すること`;

  const prompt = `あなたは日本語漫画の翻訳専門家です。
この漫画画像に含まれる全てのテキスト要素を検出し、${langName}に翻訳してください。
同時に、画像のコマ構造（パネルレイアウト）も解析してください。

【STEP 1: コマ構造の解析】
画像を見て、コマ（パネル）の構造を判定してください。
- 縦に4コマが並ぶ「四コマ漫画」の場合: type="4koma", panels=["1コマ目","2コマ目","3コマ目","4コマ目"]
- それ以外の一般漫画の場合: type="general" とし、panels にはコマのラベルを読み順（右上→左下）で列挙してください。
  - 1段に1コマなら "1段目" のように
  - 1段に左右2コマなら "1段目右", "1段目左" のように（漫画の読み順：右→左）
  - 1段に3コマ以上なら "2段目右", "2段目中", "2段目左" のように
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
  "layout": {
    "type": "4koma",
    "panels": ["1コマ目", "2コマ目", "3コマ目", "4コマ目"]
  },
  "texts": [
    {"type": "title", "original": "タイトル", "translated": "Title", "panel": "欄外"},
    {"type": "dialogue", "original": "セリフ", "translated": "Line", "panel": "1コマ目"},
    {"type": "sfx", "original": "ドカーン", "translated": "KABOOM", "panel": "3コマ目"}
  ]
}

ルール:
- ${sfxGuide}
- ${translationGuide}
- 全テキスト要素を漏れなく検出すること
- 出力はJSONオブジェクトのみ。マークダウンコードブロックは使わないこと`;

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
      clearTimeout(timeoutId);

      const data = await response.json();
      if (data.error) throw new Error(`${data.error.message} (Code: ${data.error.code})`);

      const candidates = data.candidates || [];
      if (!candidates.length) throw new Error("No response candidates");

      let text = candidates[0]?.content?.parts?.[0]?.text || "";
      if (!text) throw new Error("Empty response");

      // JSON抽出（コードブロックを除去）
      text = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
      
      const parsed = JSON.parse(text);

      // 新形式 {layout, texts} か旧形式 [配列] かを判定して正規化
      let layout, texts;
      if (Array.isArray(parsed)) {
        // 旧形式フォールバック: 配列のみ返った場合は4コマデフォルト
        layout = { type: "4koma", panels: ["1コマ目", "2コマ目", "3コマ目", "4コマ目"] };
        texts = parsed.map(t => ({ ...t, panel: t.panel || "不明" }));
      } else if (parsed.texts && parsed.layout) {
        // 新形式: そのまま使用
        layout = parsed.layout;
        texts = parsed.texts;
      } else {
        throw new Error("予期しないレスポンス形式");
      }

      if (onStatus) onStatus(`> [抽出] 完了 ✓ ${texts.length}件検出 / ${layout.type === "4koma" ? "四コマ" : "一般漫画"}(${layout.panels.length}コマ) (${modelId})`);
      return { layout, texts };

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
 * ユーザーが日本語を修正した際に個別に翻訳を取得する
 * @param {string} originalText 原文テキスト
 * @param {string} targetLang 翻訳先言語コード（デフォルト: 'en'）
 */
export const translateSingleText = async (originalText, targetLang = 'en') => {
  if (!currentApiKey) throw new Error("API Key が設定されていません。");
  const langInfo = getLanguageInfo(targetLang);
  const langName = langInfo.name;

  // 言語別のスタイル指示
  const styleHint = {
    comic: 'アメコミ風の自然でダイナミックな短い',
    webtoon: '韓国ウェブトゥーン風の自然な',
    manhua: '中国漫画風の自然な',
    european: 'バンドデシネ風の自然な',
    general: '自然で読みやすい',
  }[langInfo.style] || '自然な';

  const prompt = `あなたは漫画の翻訳家です。以下の日本語のセリフまたは擬音を、${styleHint}${langName}に翻訳してください。出力は翻訳された${langName}の文字列のみとしてください。

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
 * 入力画像 + 翻訳テキスト → 翻訳済み漫画画像
 * @param {string} base64Image 画像 (base64)
 * @param {Array} translations 翻訳テキストリスト
 * @param {string} selectedModel 使用するモデルID
 * @param {function} onStatus ステータス更新コールバック
 * @param {Array} instructionRules 再生成ルール
 * @param {string} customPrompt カスタムプロンプト
 * @param {string} targetLang 翻訳先言語コード（デフォルト: 'en'）
 * @returns {{ base64Img: string, usedModel: string }}
 */
export const generateTranslatedImage = async (base64Image, translations, selectedModel, onStatus, instructionRules = [], customPrompt = "", targetLang = 'en') => {
  if (!currentApiKey) throw new Error("API Key が設定されていません。");

  const langInfo = getLanguageInfo(targetLang);
  const langName = langInfo.name;

  // 翻訳テキストをプロンプトに組み込む
  const translationList = translations
    .map((t, i) => `${i + 1}. [${t.type}] "${t.original}" → "${t.translated}"`)
    .join("\n");

  // 言語別のスタイル指示を構築
  const styleInstructions = buildStyleInstructions(langInfo);

  let basePrompt = `あなたは漫画の${langName}ローカライズ専門家です。
この日本語漫画画像を${langName}版に変換してください。

以下の翻訳テキストを使用して、画像内の全ての日本語テキストを${langName}に置き換えた画像を生成してください:

${translationList}

${styleInstructions}`;

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
      data: base64Image
    }
  };

  // 選択モデル → フォールバックリスト構築
  const modelsToTry = [selectedModel, ...IMAGE_MODEL_OPTIONS.map(m => m.value).filter(m => m !== selectedModel)];

  for (const modelId of modelsToTry) {
    try {
      if (onStatus) onStatus(`> [生成] ${modelId} で${langName}画像を生成中...`);

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
      if (onStatus) onStatus(`> [生成] ${modelId} 失敗: ${msg.substring(0, 80)}...`);
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
 * @param {Object} langInfo languages.js の言語情報オブジェクト
 * @returns {string} プロンプトに挿入するスタイル指示テキスト
 */
const buildStyleInstructions = (langInfo) => {
  const langName = langInfo.name;

  // 共通: 全テキストを置換する基本ルール
  const commonRules = `- 元の日本語テキスト箇所を完全に消去し、翻訳テキストを同じ位置に描画すること
- フキダシの形状・位置・デザインは元画像を忠実に維持すること
- 背景やキャラクターのアートワークは一切変更しないこと`;

  switch (langInfo.style) {
    case 'comic':
      // 英語: アメコミ風 ALL CAPS + 縦書き禁止
      return `【絶対に守るべき物理的制約・ルール】
1. 【角度・方向の絶対指定】${langName}テキストは全て完全に「水平（0度）」かつ「横書き」(strict horizontal left-to-right) で描画すること。縦長の吹き出しの形に合わせて文字全体を90度回転させたり、T,h,eのように縦に1文字ずつ積むスタッキングは《絶対禁止》です。
2. 【サイズと改行】日本の縦長吹き出しに水平の${langName}を収めるため、**フォントサイズを大幅に小さくし**、単語ごとに**大量の改行（折り返し）**を入れて横幅を圧縮すること。
3. 【吹き出しの変形】上記でも収まらない場合は、元の縦長吹き出しの枠線を完全に無視して、テキストが枠外にはみ出すことを許可します。あるいは既存の吹き出しの上に巨大な横長の吹き出しを上書きしてください。
4. 【フォントスタイル】アメコミ風の大文字（ALL CAPS）フォントを使用すること。
5. 擬音・効果音も同様に、元の位置にアメコミ風の水平レタリングで配置すること。
${commonRules}`;

    case 'webtoon':
      // 韓国語: ウェブトゥーン風横書き
      return `【絶対に守るべき物理的制約・ルール】
1. 【テキスト方向】${langName}テキストは全て「水平横書き」(horizontal left-to-right) で描画すること。
2. 【サイズと改行】吹き出し内に収まるよう、適切なフォントサイズと改行で調整すること。吹き出しの形状に合わせて自然にレイアウトすること。
3. 【フォントスタイル】韓国のウェブトゥーン・漫画で使われる自然で読みやすいフォントスタイルを使用すること。
4. 擬音・効果音は${langName}の自然な表現で、元の位置に力強いレタリングスタイルで配置すること。
${commonRules}`;

    case 'manhua':
      // 中国語: 簡潔で明確なスタイル
      return `【絶対に守るべき物理的制約・ルール】
1. 【テキスト方向】${langName}テキストは「水平横書き」(horizontal left-to-right) で描画すること。
2. 【サイズと改行】吹き出し内に収まるよう、適切なフォントサイズと改行で調整すること。漢字は英語より横幅が広いため、フォントサイズの調整に注意すること。
3. 【フォントスタイル】中国の漫画（漫画/マンファ）で使われる明確で読みやすいフォントスタイルを使用すること。
4. 擬音・効果音は${langName}の自然な表現で、元の位置に配置すること。
${commonRules}`;

    case 'european':
      // 欧州系: バンドデシネ風
      return `【絶対に守るべき物理的制約・ルール】
1. 【角度・方向の絶対指定】${langName}テキストは全て完全に「水平（0度）」かつ「横書き」(strict horizontal left-to-right) で描画すること。縦書き・スタッキングは《絶対禁止》です。
2. 【サイズと改行】日本の縦長吹き出しに水平の${langName}を収めるため、**フォントサイズを小さくし**、**改行（折り返し）**を入れて横幅を圧縮すること。
3. 【吹き出しの変形】収まらない場合は、テキストが枠外にはみ出すことを許可します。
4. 【フォントスタイル】ヨーロッパのコミック・バンドデシネで使われる読みやすいフォントスタイルを使用すること。
5. 擬音・効果音は${langName}の自然な表現で、元の位置にレタリングスタイルで配置すること。
${commonRules}`;

    default:
      // 汎用（インドネシア語、タイ語など）
      return `【絶対に守るべき物理的制約・ルール】
1. 【テキスト方向】${langName}テキストは全て「水平横書き」(horizontal left-to-right) で描画すること。縦書き・スタッキングは禁止。
2. 【サイズと改行】吹き出し内に収まるよう、適切なフォントサイズと改行で調整すること。
3. 【吹き出しの変形】収まらない場合は、テキストが枠外にはみ出すことを許可します。
4. 【フォントスタイル】読みやすく明確なフォントスタイルを使用すること。
5. 擬音・効果音は${langName}の自然な表現で、元の位置に配置すること。
${commonRules}`;
  }
};
