// AI Comic Translation Tool V1.6.0 — Dual Engine (Gemini + OpenAI) 対応
import React, { useState, useRef, useCallback, useMemo } from 'react';
import './App.css';
import { setApiKey, IMAGE_MODEL_OPTIONS } from './lib/gemini';
import { setOpenAIApiKey } from './lib/openai';
import {
  setActiveEngine,
  getActiveEngine,
  getEngineDisplayName,
  extractTranslationsAI,
  translateSingleTextAI,
  generateTranslatedImageAI
} from './lib/ai-provider';
import { LANGUAGES, getDefaultFlip, getLanguageInfo, getLanguageLabel, getSourceLanguageOptions, getTargetLanguageOptions } from './lib/languages';

const SYSTEM_VERSION = "1.8.4";
const APP_NAME = "AI漫画翻訳ツール";

const App = () => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODEL_OPTIONS[0].value);
  const [engineMode, setEngineMode] = useState('gemini'); // 'gemini' | 'openai' — Dual Engine

  // 多言語設定
  const [sourceLanguage, setSourceLanguage] = useState('auto');  // ソース言語（デフォルト: 自動検出）
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [flipEnabled, setFlipEnabled] = useState(false); // デフォルト: autoなのでOFF
  const flipManualOverrideRef = useRef(false);

  // ソース言語変更ハンドラ
  const handleSourceLanguageChange = useCallback((langCode) => {
    setSourceLanguage(langCode);
    let newTarget = targetLanguage;
    if (langCode === targetLanguage) {
      newTarget = getTargetLanguageOptions(langCode)[0].code;
      setTargetLanguage(newTarget);
    }
    if (!flipManualOverrideRef.current) {
      setFlipEnabled(getDefaultFlip(langCode, newTarget));
    }
  }, [targetLanguage]);

  // ターゲット言語変更ハンドラ
  const handleTargetLanguageChange = useCallback((langCode) => {
    setTargetLanguage(langCode);
    flipManualOverrideRef.current = false;
    setFlipEnabled(getDefaultFlip(sourceLanguage, langCode));
  }, [sourceLanguage]);

  // 入力
  const [originalImage, setOriginalImage] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // 翻訳テキスト
  const [translations, setTranslations] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // コマ構造（動的検出）
  const [panelLayout, setPanelLayout] = useState(null);
  // { type: "4koma"|"general", panels: ["1コマ目", ...] }

  // 出力
  const [translatedImage, setTranslatedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedModel, setUsedModel] = useState('');

  // ステータス
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const statusTimerRef = useRef(null);
  const [history, setHistory] = useState([]);

  // 汎用プロンプト表示
  const [showUniversalPrompt, setShowUniversalPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptSourceLang, setPromptSourceLang] = useState('ja');
  const [promptTargetLang, setPromptTargetLang] = useState('en');
  const [promptFlip, setPromptFlip] = useState(true);

  // 再生成指示ビルダー
  const [instructionRules, setInstructionRules] = useState([]);
  const [panelTargets, setPanelTargets] = useState([]);
  const [presetIssue, setPresetIssue] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [translatingRow, setTranslatingRow] = useState(null);

  const showStatus = (msg, autoHide = false) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusMessage(msg);
    if (autoHide) statusTimerRef.current = setTimeout(() => setStatusMessage(''), 6000);
  };

  const getBilingualPanelLabel = (p) => {
    if (p === '全体') return '全体 / All';
    if (p === 'タイトル') return 'タイトル / Title';
    if (p === '欄外') return '欄外 / Margin';
    return p.replace(/コマ目?/g, 'コマ / Panel ').replace(/段目?/g, '段 / Row ').replace(/左/g, ' (左/L)').replace(/右/g, ' (右/R)').replace(/上/g, ' (上/T)').replace(/下/g, ' (下/B)').replace(/中/g, ' (中/M)');
  };

  // ── 汎用プロンプト生成 ──
  const universalPrompt = useMemo(() => {
    const srcInfo = getLanguageInfo(promptSourceLang);
    const tgtInfo = getLanguageInfo(promptTargetLang);
    const srcName = srcInfo.name;
    const tgtName = tgtInfo.name;
    const srcNative = srcInfo.nativeName;
    const tgtNative = tgtInfo.nativeName;
    const isRtlSource = srcInfo.readingDirection === 'rtl';
    const isRtlTarget = tgtInfo.readingDirection === 'rtl';
    const needsFlip = promptFlip;

    // テキスト方向指示
    let textDirectionRule;
    if (tgtInfo.style === 'manga') {
      textDirectionRule = `- **Text Direction**: Use vertical writing (top-to-bottom) inside tall/narrow speech bubbles, and horizontal writing where appropriate, matching natural Japanese manga typography.`;
    } else {
      textDirectionRule = `- **Text Direction**: ALL ${tgtName} text must be rendered **strictly horizontal (left-to-right)**. NEVER rotate text vertically, NEVER stack characters vertically (e.g., T-h-e stacked top-to-bottom is FORBIDDEN). Even inside tall/narrow bubbles, keep text horizontal — shrink the font and add line breaks instead.`;
    }

    // レタリングスタイル
    let letteringStyle;
    switch (tgtInfo.style) {
      case 'comic':
        letteringStyle = `- **Lettering Style**: Use American comic lettering conventions. Dialogue and SFX should be rendered in **ALL CAPS** bold lettering. Sound effects should be dramatic and expressive (e.g., ドキドキ→BA-DUMP, ザァァ→WHOOOOSH, ゴゴゴ→RUMBLE).`;
        break;
      case 'manga':
        letteringStyle = `- **Lettering Style**: Use natural Japanese manga fonts. Gothic or Mincho typeface for dialogue. Sound effects should use bold Japanese onomatopoeia.`;
        break;
      case 'webtoon':
        letteringStyle = `- **Lettering Style**: Use clean, modern Korean webtoon typography. Sound effects should use natural Korean expressions.`;
        break;
      case 'manhua':
        letteringStyle = `- **Lettering Style**: Use clear Chinese manga (manhua) typography. Note that CJK characters are wider than Latin text — adjust font size accordingly.`;
        break;
      case 'european':
        letteringStyle = `- **Lettering Style**: Use European bande dessinée (BD) comic typography with clean, readable fonts.`;
        break;
      default:
        letteringStyle = `- **Lettering Style**: Use clean, readable fonts appropriate for ${tgtName} text.`;
    }

    // ケーシングルール
    const casingRule = tgtInfo.style === 'comic'
      ? `- **Casing Rules**: Dialogue, titles, and SFX should be in ALL CAPS. However, URLs, email addresses, ISBNs, and any technical strings in margins must preserve their **exact original casing** (typically lowercase). Do NOT capitalize URLs.`
      : `- **Casing Rules**: URLs, email addresses, ISBNs, and any technical strings in margins must preserve their **exact original casing**. Do NOT alter the capitalization of these elements.`;

    // 反転指示
    const flipSection = needsFlip
      ? `\n## STEP 0: Mirror/Flip the Image\nBefore translating any text, **horizontally flip (mirror) the entire image**. This converts the ${isRtlSource ? 'right-to-left' : 'left-to-right'} reading order of the original ${srcName} layout to ${isRtlTarget ? 'right-to-left' : 'left-to-right'} reading order for ${tgtName} readers. All subsequent text replacement must be done on the flipped image.\n`
      : '';

    return `You are a professional manga/comic localization and lettering specialist performing an IMAGE EDITING task. I am attaching a ${srcName} comic/manga page image.

**Your task**: Edit this EXISTING image in-place to produce a fully translated ${tgtName} version. You must preserve the original artwork with pixel-level fidelity — ONLY the text content changes. Do NOT regenerate or redraw the artwork.
${flipSection}
## PRIORITY #1: Art Preservation (NON-NEGOTIABLE)
These rules override ALL other instructions. Violation of any rule is a critical failure:
- The output image must be **IDENTICAL** to the input except for text content.
- **DO NOT** modify, redraw, or reinterpret any artwork, character faces, bodies, hair, clothing, poses, or expressions.
- **DO NOT** change backgrounds, screen tones, shading, lighting, or color palette.
- **DO NOT** alter panel layouts, borders, or compositions.
- **DO NOT** change speech bubble shapes, positions, or outlines — only replace the text inside.
- **DO NOT** add any border, frame, or edge around the output image.
- Maintain the **EXACT** original image resolution, contrast, and visual sharpness.

## STEP 1: Read and Translate ALL Text
Before modifying the image, carefully scan and identify every text element:
- **Title** text (usually at the top or in decorative frames)
- **Dialogue** in speech bubbles
- **Narration** boxes
- **Sound effects (SFX)** / onomatopoeia
- **Margin text** (author notes, URLs, page numbers, copyright, ISBN, etc.)

### Translation Accuracy Rules
- Translate all ${srcName} text into natural, contextually appropriate ${tgtName}.
- **PRESERVE literary references and wordplay**: If a title or line parodies or references a famous quote, proverb, or cultural work, the ${tgtName} translation MUST also reference that same source material (e.g., a Hamlet parody → keep it as a Hamlet reference; a proverb → use the equivalent ${tgtName} proverb).
- **DO NOT re-interpret, over-localize, or invent meaning** not present in the original. Translate what is actually written.
- **Translate faithfully**: When the meaning is clear, translate it directly. Do not loosely paraphrase or substitute entirely different concepts.
- **Proper nouns and specific terms**: Translate domain-specific terms accurately (e.g., 同人誌→doujinshi, 頒布→distribution, 印刷費→printing cost). Do not guess or approximate.
- **Sound effects**: ${tgtInfo.style === 'comic' ? `Convert to dynamic English comic SFX (e.g., ドキドキ→BA-DUMP, ザァァ→WHOOOOSH, ゴゴゴ→RUMBLE).` : tgtInfo.style === 'manga' ? `Use natural Japanese onomatopoeia.` : `Convert to natural ${tgtName} equivalents.`}
- **URLs, ISBNs, technical strings**: Preserve the EXACT original text and casing of the URL/ISBN itself — do NOT translate or modify it. However, you MUST translate any surrounding explanatory text (e.g., "Official site:").

## STEP 2: Replace Text in the Image
For each text element:
1. **Completely erase** the original ${srcName} text (fill with surrounding background color/pattern — typically white for speech bubbles).
2. **Render the ${tgtName} translation** in the exact same position.
3. Ensure **no traces** of the original text remain visible beneath the translation.

### Text Rendering Rules
${textDirectionRule}
- **Bubble Overflow**: If ${tgtName} text doesn't fit (especially in tall/narrow bubbles designed for vertical ${srcName}), reduce font size and add line breaks. Do NOT sacrifice readability.
${letteringStyle}
${casingRule}

### Completeness
- Translate **100% of visible text** — missing even one speech bubble is unacceptable.
- Include margin annotations, small print, and any text outside panels.
- Sound effects drawn as part of the artwork should be overlaid with ${tgtName} equivalents in a matching bold/dynamic style.

## Pre-Output Verification
Before outputting, you MUST verify:
☑ Every visible text element has been translated — none missing.
☑ All translations are faithful to the original meaning — no invented or reinterpreted content.
☑ Literary references/wordplay in the original are preserved in translation.
☑ Character artwork is IDENTICAL to the original — no faces, bodies, or poses changed.
☑ Image quality (resolution, sharpness, color) matches the original exactly.
☑ No original ${srcName} text remains visible beneath translations.

Output the final translated image only. No explanations needed.`;
  }, [promptSourceLang, promptTargetLang, promptFlip]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(universalPrompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    } catch (e) {
      // フォールバック: テキストエリアからコピー
      const ta = document.createElement('textarea');
      ta.value = universalPrompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    }
  };

  // ── API認証（Dual Engine: sk- → OpenAI / それ以外 → Gemini） ──
  const handleApiKeySubmit = () => {
    const cleanKey = apiKeyInput.replace(/[^\u0000-\u007F]/g, "").trim();
    if (cleanKey.length < 10) return;

    if (cleanKey.startsWith("sk-")) {
      // OpenAI Engine
      setOpenAIApiKey(cleanKey);
      setActiveEngine('openai');
      setEngineMode('openai');
      setIsUnlocked(true);
      showStatus('✅ ChatGPT Engine 接続完了！ / Connected!', true);
      console.log('[Dual Engine] Switched to OpenAI/ChatGPT mode');
    } else {
      // Gemini Engine（従来通り）
      setApiKey(cleanKey);
      setActiveEngine('gemini');
      setEngineMode('gemini');
      setIsUnlocked(true);
      showStatus('✅ Gemini Engine 接続完了！ / Connected!', true);
      console.log('[Dual Engine] Using Gemini mode (default)');
    }
  };

  // ── 画像読み込み（D&D時は自動抽出） ──
  const loadImage = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('画像ファイルを選択してください。 / Please select an image file.'); return;
    }
    setErrorMessage('');
    setTranslations([]);
    setPanelLayout(null);
    setTranslatedImage(null);
    setUsedModel('');
    setOriginalFileName(file.name);

    // ビルダー関連のリセット
    setInstructionRules([]);
    setPanelTargets([]);
    setPresetIssue('');
    setCustomPrompt('');
    setShowBuilder(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setOriginalImage(dataUrl);
      // 自動でテキスト抽出（現在の翻訳先言語を使用）
      await runExtraction(dataUrl, targetLanguage);
    };
    reader.readAsDataURL(file);
  };

  // セッション管理用（裏での処理衝突・情報の累積を防ぐ）
  const extractionSessionRef = useRef(0);

  // ── テキスト抽出 ──
  const runExtraction = async (imageDataUrl, langOverride) => {
    const dataUrl = imageDataUrl || originalImage;
    if (!dataUrl) return;
    setIsExtracting(true);
    setErrorMessage('');
    const lang = langOverride || targetLanguage;
    const langInfo = getLanguageInfo(lang);
    showStatus(`📖 テキスト抽出中... (→${langInfo.nativeName})`);

    extractionSessionRef.current += 1;
    const currentSession = extractionSessionRef.current;

    try {
      const base64 = dataUrl.split(',')[1];
      const result = await extractTranslationsAI(base64, (s) => {
        if (currentSession === extractionSessionRef.current) showStatus(s);
      }, lang, sourceLanguage);
      
      // もし抽出中に別の画像がドロップされセッションが変わっていたら、古い結果は画面に反映せず破棄する
      if (currentSession !== extractionSessionRef.current) return;

      // 新形式 {layout, texts, detectedSourceLang} を分離して保存
      if (result.layout && result.texts) {
        setPanelLayout(result.layout);
        
        let isConflict = false;
        let finalTarget = lang;
        
        // 自動検出または異なる言語が検出された場合はUIに反映
        if (result.detectedSourceLang && result.detectedSourceLang !== sourceLanguage && getLanguageInfo(result.detectedSourceLang).code !== 'auto') {
          if (result.detectedSourceLang === lang) {
            isConflict = true;
            finalTarget = getTargetLanguageOptions(result.detectedSourceLang)[0].code;
          }
          handleSourceLanguageChange(result.detectedSourceLang);
        }

        if (isConflict) {
          showStatus(`⚠️ 入力と翻訳先の重複を検知。自動的に再翻訳します... / Retranslating to avoid conflict...`);
          try {
             const retranslated = await Promise.all(result.texts.map(async t => {
                if (!t.original) return t;
                const translated = await translateSingleTextAI(t.original, finalTarget, result.detectedSourceLang);
                return { ...t, translated };
             }));
             result.texts = retranslated;
          } catch(e) {
             console.warn("Retranslation failed:", e);
          }
        }

        setTranslations(result.texts);

        const layoutLabel = result.layout.type === '4koma' ? '四コマ / 4-koma' : `一般漫画 / Comic (${result.layout.panels.length}コマ/panels)`;
        showStatus(`✅ ${result.texts.length}件検出 / ${result.texts.length} texts detected | ${layoutLabel}`, true);
      } else {
        // 万一旧形式が返った場合のフォールバック
        setTranslations(Array.isArray(result) ? result : []);
        showStatus(`✅ 検出完了 / Extraction Complete`, true);
      }
    } catch (err) {
      if (currentSession !== extractionSessionRef.current) return;
      setErrorMessage(`テキスト抽出エラー: ${err.message}`);
      showStatus('', false);
    } finally {
      // 自分が最新のセッションである場合のみ Loading を解除
      if (currentSession === extractionSessionRef.current) {
        setIsExtracting(false);
      }
    }
  };

  // ── D&D ──
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) loadImage(file);
  };

  // ── テキスト編集 ──
  const updateOriginalText = (index, value) => {
    setTranslations(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], original: value };
      return copy;
    });
  };

  const updateTranslation = (index, value) => {
    setTranslations(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], translated: value };
      return copy;
    });
  };

  const handleSingleTranslate = async (index) => {
    const item = translations[index];
    if (!item.original) return;
    setTranslatingRow(index);
    showStatus(`🔄 テキスト #${index + 1} を翻訳中... / Translating text #${index + 1}...`);
    try {
      const langInfo = getLanguageInfo(targetLanguage);
      const translated = await translateSingleTextAI(item.original, targetLanguage, sourceLanguage);
      updateTranslation(index, translated);
      showStatus(`✅ テキスト #${index + 1} → ${langInfo.nativeName} 翻訳完了 / Translation complete`, true);
    } catch (err) {
      setErrorMessage(`個別翻訳エラー / Translation Error: ${err.message}`);
      showStatus('', false);
    } finally {
      setTranslatingRow(null);
    }
  };

  // ── 再生成ビルダー機能 ──
  const handleTogglePanelTarget = (panel) => {
    if (panelTargets.includes(panel)) {
      setPanelTargets(panelTargets.filter(p => p !== panel));
    } else {
      setPanelTargets([...panelTargets, panel]);
    }
  };

  const handlePresetSelect = (val) => {
    setPresetIssue(val);
    if (val) {
      setCustomPrompt(prev => prev ? prev + '\n' + val : val);
    }
  };

  const handleAddInstructionRule = () => {
    if (!customPrompt.trim()) {
      setErrorMessage('内容を選択するか、自由入力欄に指示をご記入ください。 / Please select an issue or type an instruction.');
      return;
    }
    
    const isGlobalExcludeRule = customPrompt.includes('指定したコマ以外のコマは');
    
    let targetText = '';
    if (isGlobalExcludeRule) {
      targetText = '全体';
    } else if (panelTargets.length > 0) {
      targetText = panelTargets.includes('全体') ? '全体' : panelTargets.sort().join('と');
    }
    
    // コマ指定があれば【対象】を付加、なければそのまま（自由入力）
    const ruleText = targetText ? `【${targetText}】${customPrompt.trim()}` : customPrompt.trim();
    
    if (!instructionRules.includes(ruleText)) {
      setInstructionRules([...instructionRules, ruleText]);
    }
    // リセット
    setPanelTargets([]);
    setPresetIssue('');
    setCustomPrompt('');
    setErrorMessage('');
  };

  const handleRemoveInstructionRule = (index) => {
    setInstructionRules(instructionRules.filter((_, i) => i !== index));
  };


  // ── Canvas左右反転 ──
  const flipImageHorizontally = (dataUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas 2D context の取得に失敗しました。"));
            return;
          }
          ctx.scale(-1, 1);
          ctx.drawImage(img, -canvas.width, 0);
          resolve(canvas.toDataURL('image/png').split(',')[1]);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        reject(new Error("左右反転のための画像読み込みに失敗しました。"));
      };
      img.src = dataUrl;
    });
  };

  // ── 画像生成 ──
  const handleGenerate = async (forceOriginal = false) => {
    if (!originalImage || isGenerating) return;
    setIsGenerating(true);
    setErrorMessage('');
    
    // UIを自動で閉じる
    setShowBuilder(false);

    const langInfo = getLanguageInfo(targetLanguage);

    // 修正モード判定: ルールありかつ翻訳済み画像がある → 翻訳画像ベースで修正
    // forceOriginal=true → 常に原画ベース / forceOriginal=false かつルールあり → 翻訳画像ベース修正
    const isRefinement = !forceOriginal && instructionRules.length > 0 && translatedImage !== null;

    try {
      let inputBase64;
      if (isRefinement) {
        // 修正モード: 翻訳済み画像（右側）をベースにする（既にFlip適用済み）
        showStatus('🔧 翻訳済み画像をベースに修正中... / Refining translated image...');
        inputBase64 = translatedImage.split(',')[1];
      } else if (flipEnabled) {
        showStatus('🔄 画像を左右反転中...');
        inputBase64 = await flipImageHorizontally(originalImage);
      } else {
        showStatus('📋 画像を準備中...');
        inputBase64 = originalImage.split(',')[1];
      }
      showStatus(`🌐 ${langInfo.nativeName}画像を${isRefinement ? '修正' : '生成'}中...`);
      const result = await generateTranslatedImageAI(
        inputBase64, translations, selectedModel, (s) => showStatus(s), instructionRules, customPrompt, targetLanguage, sourceLanguage, isRefinement
      );
      const imgSrc = `data:image/png;base64,${result.base64Img}`;
      setTranslatedImage(imgSrc);
      setUsedModel(result.usedModel);
      setHistory(prev => [{ translated: imgSrc, model: result.usedModel, fileName: originalFileName, timestamp: Date.now() }, ...prev]);
      showStatus(`✅ ${langInfo.nativeName}${isRefinement ? '修正' : '翻訳'}完了 (${result.usedModel})`, true);
      // 修正モード成功後: ビルダーを自動リセット（次の修正は白紙から）
      if (isRefinement) {
        setInstructionRules([]);
        setPanelTargets([]);
        setPresetIssue('');
        setCustomPrompt('');
        setShowBuilder(false);
      }
    } catch (err) {
      setErrorMessage(err.message);
      showStatus('', false);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── ダウンロード ──
  const handleDownload = () => {
    if (!translatedImage) return;
    const langCode = targetLanguage.toUpperCase().replace('-', '_');
    const link = document.createElement('a');
    link.href = translatedImage;
    link.download = `${(originalFileName || 'manga').replace(/\.[^.]+$/, '')}_${langCode}_${Date.now()}.png`;
    link.click();
  };

  // ── 画像リセット ──
  const handleImageReset = () => {
    setOriginalImage(null);
    setOriginalFileName('');
    setTranslations([]);
    setPanelLayout(null);
    setTranslatedImage(null);
    setUsedModel('');
    setErrorMessage('');
    showStatus('🔄 リセット完了', true);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // オプション等のリセット
    setInstructionRules([]);
    setPanelTargets([]);
    setPresetIssue('');
    setCustomPrompt('');
    setShowBuilder(false);
  };

  // ── API リセット（エンジン設定もリセット） ──
  const handleFullReset = () => {
    handleImageReset();
    setApiKey('');
    setOpenAIApiKey('');
    setActiveEngine('gemini');
    setEngineMode('gemini');
    setIsUnlocked(false);
    setApiKeyInput('');
  };

  const isWorking = isExtracting || isGenerating;
  const canGenerate = originalImage && !isWorking && translations.length > 0;
  const typeIcon = (t) => ({ title: '📌', dialogue: '💬', narration: '📝', sfx: '💥' }[t] || '📎');

  // ═══════════ レンダリング ═══════════
  return (
    <div className="app-container">
      {/* APIゲート */}
      {!isUnlocked && (
        <div className="api-gate">
          <div className="api-gate-card">
            <div className="api-gate-icon">🌐</div>
            <h1 className="api-gate-title">{APP_NAME}</h1>
            <p className="api-gate-sub">V{SYSTEM_VERSION} — Multilingual Comic Translation Tool</p>
            <input type="password" className="api-gate-input" placeholder="Gemini API Key または OpenAI Key (sk-...) を入力..."
              value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()} />
            <button className={`api-gate-btn ${apiKeyInput.trim().startsWith('sk-') ? 'api-gate-btn-openai' : ''}`} onClick={handleApiKeySubmit}>🔓 起動する / Start</button>

            {/* Dual Engine 自動判定インジケーター */}
            <div className={`engine-indicator ${apiKeyInput.trim().startsWith('sk-') ? 'detecting-openai' : apiKeyInput.trim() ? 'detecting-gemini' : ''}`}>
              <span className="engine-dot" />
              {apiKeyInput.trim().startsWith('sk-')
                ? '🟢 ChatGPT Engine で起動'
                : apiKeyInput.trim()
                  ? '🔵 Gemini Engine で起動'
                  : '入力待ち... / Waiting for input...'}
              {apiKeyInput.trim().startsWith('sk-') && (
                <span className="engine-cost-warn">⚠ 従量課金（OpenAI API）</span>
              )}
            </div>

            <p className="api-gate-note">※ APIキーはセッション限定（ブラウザに保存されません） / Session-only (Not saved)</p>
            <div className="api-gate-links">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="api-link api-link-gemini">🔵 Gemini キー取得</a>
              <span className="api-link-divider">|</span>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="api-link api-link-openai">🟢 OpenAI キー取得（従量課金）</a>
            </div>
          </div>
        </div>
      )}

      {/* 汎用プロンプト モーダル */}
      {showUniversalPrompt && (
        <div className="prompt-modal-overlay" onClick={() => setShowUniversalPrompt(false)}>
          <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prompt-modal-header">
              <h2>📋 汎用翻訳プロンプト / Universal Translation Prompt</h2>
              <button className="prompt-close" onClick={() => setShowUniversalPrompt(false)}>✕</button>
            </div>
            <p className="prompt-modal-desc">
              APIによるImage-to-Image出力が直接サポートされていないモデルや、出力品質に問題がある場合、Webサービスのチャット画面から手動で利用するための汎用プロンプトです。翻訳したい漫画画像と一緒にこのプロンプトを貼り付けてください。
              <br /><span style={{opacity: 0.7}}>A universal prompt for manual use via web chat interfaces, useful when direct API Image-to-Image output is unsupported or yields poor quality. Attach your manga image with this prompt.</span>
              <br /><br /><span className="prompt-caveat-inline">⚠️ 画像生成の品質はサービスのモデル性能に依存します。本ツール（Gemini API / OpenAI API 直接連携）ほどの細密な制御は得られない場合があります。</span>
              <br /><span style={{opacity: 0.5, fontSize: '0.6rem'}}>Image quality depends on the AI service's model capabilities. Results may vary compared to this tool's direct Gemini API / OpenAI API integration.</span>
            </p>
            <div className="prompt-flip-warning">
              <p><strong>⚠️ 左右反転（読み順変換）の対応状況はサービスによって異なります / Flip support varies by service:</strong></p>
              <p>✅ ChatGPT — プロンプト指示で反転可能 / Flip via prompt supported</p>
              <p>❌ Gemini web — プロンプトでの反転は非対応。事前に画像編集ソフト等で反転してからアップロードしてください<br /><span style={{opacity: 0.7}}>Cannot flip via prompt. Please flip the image manually before uploading.</span></p>
            </div>

            <div className="prompt-options">
              <div className="prompt-opt-group">
                <label>入力言語 / Source:</label>
                <select value={promptSourceLang} onChange={(e) => { setPromptSourceLang(e.target.value); const src = getLanguageInfo(e.target.value); const tgt = getLanguageInfo(promptTargetLang); setPromptFlip(src.readingDirection && tgt.readingDirection && src.readingDirection !== tgt.readingDirection); }}>
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.nativeName} / {l.name}</option>)}
                </select>
              </div>
              <div className="prompt-opt-group">
                <label>翻訳先 / Target:</label>
                <select value={promptTargetLang} onChange={(e) => { setPromptTargetLang(e.target.value); const src = getLanguageInfo(promptSourceLang); const tgt = getLanguageInfo(e.target.value); setPromptFlip(src.readingDirection && tgt.readingDirection && src.readingDirection !== tgt.readingDirection); }}>
                  {LANGUAGES.filter(l => l.code !== promptSourceLang).map(l => <option key={l.code} value={l.code}>{l.nativeName} / {l.name}</option>)}
                </select>
              </div>
              <div className="prompt-opt-group">
                <label className="flip-check-label">
                  <input type="checkbox" checked={promptFlip} onChange={(e) => setPromptFlip(e.target.checked)} />
                  🔄 左右反転 / Mirror Flip
                </label>
              </div>
            </div>

            <div className="prompt-text-wrap">
              <pre className="prompt-text-content">{universalPrompt}</pre>
            </div>

            <button className={`btn-copy-prompt ${promptCopied ? 'copied' : ''}`} onClick={handleCopyPrompt}>
              {promptCopied ? '✅ コピーしました! / Copied!' : '📋 プロンプトをコピー / Copy Prompt'}
            </button>

            <div className="prompt-usage-hint">
              <p><strong>💡 使い方 / How to use:</strong></p>
              <ol>
                <li>上のボタンでプロンプトをコピー / Copy the prompt above</li>
                <li>ChatGPT等を開き、翻訳したい漫画画像を添付 / Open ChatGPT etc. and attach your manga image</li>
                <li>コピーしたプロンプトを貼り付けて送信 / Paste the prompt and send</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className={!isUnlocked ? 'app-locked' : ''}>
        {/* ─── 固定ヘッダー＋ステータスエリア ─── */}
        <div className="sticky-top">
          <header className="app-header">
            <div className="header-brand">
              <div className="header-icon">🌐</div>
              <div>
                <h1 className="header-title">{APP_NAME} <span>V{SYSTEM_VERSION}</span></h1>
                <p className="header-subtitle">COMIC TRANSLATION TOOL</p>
              </div>
            </div>
            <div className="header-actions">
              {/* エンジンバッジ */}
              <span className={`engine-badge ${engineMode === 'openai' ? 'engine-openai' : 'engine-gemini'}`}>
                {engineMode === 'openai' ? '🟢 ChatGPT' : '🔵 Gemini'}
              </span>
              <div className="model-select-wrap">
                <label className="model-label">入力言語 / Source</label>
                <select className="lang-select" value={sourceLanguage}
                  onChange={(e) => handleSourceLanguageChange(e.target.value)} disabled={isWorking}>
                  {getSourceLanguageOptions().map(l => (
                    <option key={l.code} value={l.code}>{getLanguageLabel(l)}</option>
                  ))}
                </select>
              </div>
              <div className="model-select-wrap">
                <label className="model-label">翻訳先 / Target</label>
                <select className="lang-select" value={targetLanguage}
                  onChange={(e) => handleTargetLanguageChange(e.target.value)} disabled={isWorking}>
                  {getTargetLanguageOptions(sourceLanguage).map(l => (
                    <option key={l.code} value={l.code}>{getLanguageLabel(l)}</option>
                  ))}
                </select>
              </div>
              {/* モデル選択 — Geminiモード時のみ表示 */}
              {engineMode === 'gemini' && (
                <div className="model-select-wrap">
                  <label className="model-label">生成モデル / Model</label>
                  <select className="model-select" value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)} disabled={isWorking}>
                    {IMAGE_MODEL_OPTIONS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* 汎用プロンプト — OpenAIモード時のみ表示 */}
              {engineMode === 'openai' && (
                <div className="btn-icon-labeled">
                  <span className="btn-icon-label">汎用プロンプト<br />Universal Prompt</span>
                  <button className="btn-icon-only" onClick={() => setShowUniversalPrompt(true)} title="汎用プロンプト / Universal Prompt">📋</button>
                </div>
              )}
              <div className="btn-icon-labeled">
                <span className="btn-icon-label">API切替<br />API Switch</span>
                <button className="btn-icon-only" onClick={handleFullReset} title="API切替 / API Switch">🔌</button>
              </div>
            </div>
          </header>

          {/* ステータス */}
          {statusMessage && (
            <div className="inline-status"><span>{statusMessage}</span><button onClick={() => setStatusMessage('')}>✕</button></div>
          )}
          {errorMessage && (
            <div className="error-bar"><span>⚠️ {errorMessage}</span><button onClick={() => setErrorMessage('')}>✕</button></div>
          )}
        </div>

        {/* ════ メイン2カラム ════ */}
        <div className="main-grid">

          {/* ═══ 左: 入力カラム ═══ */}
          <div className="col-input">
            {/* 画像D&D */}
            <div className={`drop-zone ${isDragging ? 'dragging' : ''} ${originalImage ? 'has-image' : ''}`}
              title="クリックまたはドラッグ＆ドロップで画像を変更"
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
              {originalImage ? (
                <div className="preview-wrap">
                  <img src={originalImage} alt="元画像" className="preview-img" />
                  <div className="preview-actions">
                    <button className="btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>🔄 変更 / Change</button>
                    <button className="btn-sm btn-sm-danger" onClick={(e) => { e.stopPropagation(); handleImageReset(); }}>🗑️ リセット / Reset</button>
                  </div>
                  <div className="preview-filename">{originalFileName}</div>
                </div>
              ) : (
                <div className="drop-content">
                  <div className="drop-icon">📁</div>
                  <p className="drop-text">漫画画像をドラッグ＆ドロップ / Drop comic image here</p>
                  <p className="drop-sub">または クリックして選択 / or click to select</p>
                </div>
              )}
            </div>

            {/* テキスト抽出ボタン（画像の下、テキスト欄の上） */}
            {originalImage && (
              <button className="btn-extract" onClick={() => runExtraction()} disabled={isExtracting || !originalImage}>
                {isExtracting
                  ? <><span className="animate-spin">◉</span> テキスト解析中... / Extracting...</>
                  : <>📖 テキスト再抽出 / Re-extract Text</>
                }
              </button>
            )}

            {/* 抽出中スケルトン */}
            {isExtracting && !translations.length && (
              <div className="skeleton-panel">
                {[1, 2, 3].map(i => <div key={i} className="skeleton-row animate-pulse" />)}
              </div>
            )}

            {/* 抽出テキスト（スクロール制限付き） */}
            {translations.length > 0 && (
              <div className="text-panel">
                <div className="text-panel-header">
                  <span className="text-panel-title">📋 抽出テキスト / Extracted Text ({translations.length})</span>
                  <span className="text-panel-hint">翻訳を修正可 / Editable</span>
                </div>
                <div className="text-list">
                  {translations.map((t, i) => (
                    <div key={i} className="text-row">
                      <span className="text-type" title={t.type}>{typeIcon(t.type)}</span>
                      {t.panel && <span className="panel-badge" title={`所属 / Panel: ${t.panel}`}>{getBilingualPanelLabel(t.panel)}</span>}
                      <textarea value={t.original}
                        onChange={(e) => updateOriginalText(i, e.target.value)}
                        className="text-input text-orig" rows={2} />
                      <div className="text-row-actions">
                        <button className="btn-retrans" onClick={() => handleSingleTranslate(i)} disabled={translatingRow === i} title="この行だけ再翻訳 / Retranslate this line">
                          {translatingRow === i ? <span className="animate-spin" style={{fontSize: '9px'}}>◉</span> : '🔄'}
                        </button>
                        <button className="btn-clear" onClick={() => updateTranslation(i, '')} disabled={translatingRow === i} title="英訳を消去 / Clear translation">🧹</button>
                      </div>
                      <span className="text-arrow">→</span>
                      <textarea value={t.translated}
                        onChange={(e) => updateTranslation(i, e.target.value)}
                        className="text-input text-trans" rows={2} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ 右: 出力カラム ═══ */}
          <div className="col-output">
            {/* 反転トグル + 画像生成ボタン */}
            <div className="flip-toggle-row">
              <label className="flip-toggle">
                <span className="flip-label">🔄 左右反転 / Flip:</span>
                <button
                  className={`toggle-switch ${flipEnabled ? 'toggle-on' : 'toggle-off'}`}
                  onClick={() => {
                    flipManualOverrideRef.current = true;
                    setFlipEnabled(!flipEnabled);
                  }}
                  disabled={isWorking}
                  title={flipEnabled ? '反転ON — 画像を左右反転して生成' : '反転OFF — 原画の向きのまま生成'}
                >
                  <span className="toggle-knob" />
                  <span className="toggle-text">{flipEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </label>
              <span className="flip-hint">
                {flipEnabled ? 'LTR (左→右 / Left-to-Right)' : 'RTL (右→左 / Right-to-Left)'}
              </span>
            </div>
            <button className="btn-generate" onClick={() => handleGenerate(true)} disabled={!canGenerate}>
              {isGenerating
                ? <><span className="animate-spin">◉</span> 画像生成中... / Generating... {engineMode === 'openai' ? '(2〜5分)' : ''}</>
                : <>{translatedImage
                    ? `🌐 原画(左)から${flipEnabled ? '反転(Flip) + ' : ''}${getLanguageInfo(targetLanguage).nativeName}再生成 / Regenerate ${flipEnabled ? 'Flipped ' : ''}${getLanguageInfo(targetLanguage).name} from Original(Left)${engineMode === 'openai' ? ' (2〜5分)' : ''}`
                    : `🌐 ${flipEnabled ? '反転(Flip) + ' : ''}${getLanguageInfo(targetLanguage).nativeName} 画像生成 / Generate ${flipEnabled ? 'Flipped ' : ''}${getLanguageInfo(targetLanguage).name} Image${engineMode === 'openai' ? ' (2〜5分)' : ''}`
                  }</>
              }
            </button>

            {/* 結果画像 */}
            <div className="result-panel">
              <div className="result-header">
                <span className="result-label">🎯 翻訳結果 / Result</span>
                {usedModel && <span className="result-model"><span className="dot-ok">●</span> {usedModel}</span>}
              </div>
              <div className="result-img-box">
                {translatedImage ? (
                  <div className={`img-wrapper ${isGenerating ? 'is-generating' : ''}`}>
                    <img src={translatedImage} alt="翻訳結果" className="result-img" />
                    {isGenerating && (
                      <div className="gen-overlay">
                        <span className="animate-spin gen-spin">◉</span>
                        <p>画像を再生成中... / Regenerating...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="result-empty">
                    {isGenerating ? (
                      <div className="gen-indicator">
                        <span className="animate-spin gen-spin">◉</span>
                        <p>{getLanguageInfo(targetLanguage).nativeName}画像を生成中... / Generating... {engineMode === 'openai' ? <br/> : ''}<span style={{color: '#fbbf24'}}>{engineMode === 'openai' ? '(2〜5分お待ちください)' : ''}</span></p>
                        <p className="gen-sub">{flipEnabled ? '反転 → ' : ''}テキスト翻訳 → 画像再構築</p>
                      </div>
                    ) : (
                      <p>画像をD&Dして上のボタンで生成<br /><span style={{fontSize: '0.85em', opacity: 0.8}}>Drop image & click Generate</span></p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ダウンロードボタン */}
            <button className="btn-download" onClick={handleDownload} disabled={!translatedImage}>
              📥 ダウンロード / Download
            </button>

            {/* 履歴 */}
            {history.length > 0 && (
              <div className="history-panel">
                <div className="history-head">
                  <span>📜 履歴 ({history.length}) / History</span>
                  <button className="btn-tiny" onClick={() => setHistory([])}>🗑️</button>
                </div>
                <div className="history-grid">
                  {history.map((item, idx) => (
                    <div key={idx} className="history-thumb" onClick={() => { setTranslatedImage(item.translated); setUsedModel(item.model); }}>
                      <img src={item.translated} alt={`#${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 再生成オプションビルダー */}
            <div className="builder-panel">
              <div className="builder-header" onClick={() => setShowBuilder(!showBuilder)}>
                <span>✨ 再生成オプション / Regeneration Options</span>
                <span>{showBuilder ? '▲' : '▼'}</span>
              </div>
              
              {showBuilder && (
                <div className="builder-content">
                  <p className="builder-desc">画像を確認後、修正が必要なコマと内容を選んで追加してください。 / Select issue targets and describe the problem to regenerate.</p>
                  
                  <div className="builder-controls">
                    <div className="builder-row">
                      <label>1. 対象 / Target (複数可):</label>
                      <div className="panel-checkboxes">
                        {['全体', 'タイトル', ...(panelLayout?.panels || ['1コマ目', '2コマ目', '3コマ目', '4コマ目']), '欄外'].map(p => (
                          <label key={p} className="panel-checkbox">
                            <input type="checkbox" checked={panelTargets.includes(p)} onChange={() => handleTogglePanelTarget(p)} />
                            <span>{getBilingualPanelLabel(p)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="builder-row mt-2">
                      <label>2. 内容 / Issue:</label>
                      <select value={presetIssue} onChange={e => handlePresetSelect(e.target.value)} className="preset-select">
                        <option value="">-- よくある問題を選択 / Select Quick Issue --</option>
                        <option value={`このコマのテキストが縦書き（垂直方向）で描画されている。全てのテキストを水平方向の横書き（left-to-right）に修正して再描画すること。文字を縦に1文字ずつ積む描画も禁止`}>📐 テキストが縦書きになっている / Text is drawn vertically</option>
                        <option value={`このコマのテキストが横書きで描画されている。全てのテキストを日本の漫画のような縦書き（上から下、右行から左行）に修正して再描画すること。`}>📏 テキストが横書きになっている / Text is drawn horizontally</option>
                        <option value={`このコマのフキダシ内に元のテキストの痕跡が残っている。フキダシ内部を完全に白く塗りつぶしてから、${getLanguageInfo(targetLanguage).name}テキストのみを描画し直すこと`}>⬜ フキダシに元の文字が残っている / Original text remains in bubble</option>
                        <option value={`このコマで翻訳テキストの一部が描画されていない。翻訳リストにある全テキストを対応する位置に1つ残らず漏れなく描画すること`}>✏️ 翻訳テキストが一部描画されていない / Missing translated text</option>
                        <option value={`このコマの吹き出しからテキストがはみ出している。フォントサイズを縮小し改行を増やして、全テキストを吹き出し枠内に完全に収めること`}>📦 文字が枠からはみ出している / Text overflows the bubble</option>
                        <option value={`このコマの吹き出し全体を一度白く塗りつぶし、吹き出しの外形は維持したまま内部を完全にリセットした上で、${getLanguageInfo(targetLanguage).name}テキストをゼロから再描画すること`}>🔄 吹き出しを完全リセットして再描画 / Completely reset bubble inner</option>
                        <option value={`このコマのテキストが背景と同化して判読困難なため、文字に白または黒の縁取り（アウトライン）を追加して確実に判読できるようにすること`}>👁️ 文字が背景と同化して見えない / Text is hard to read against background</option>
                        <option value={`このコマの擬音・効果音（SFX）を、大きく力強いレタリングスタイルで再描画すること`}>💥 擬音・効果音を力強く強調 / Enhance SFX dynamically</option>
                        <option value={`このコマに含まれる不要な要素を完全に消去し、周囲の背景・パターンで自然に補完すること。消去対象: `}>🧹 不要な要素を消去 / Erase specific elements (specify below)</option>
                        <option value={`このコマ内の指定要素を別の要素に置き換え、周囲との整合性を保ちつつ自然に描画すること。変更: [元] → [新]`}>🔀 要素を別のものに置き換え / Replace elements (specify below)</option>
                        <option value={`このコマの [対象] の [現状の問題] を [望む状態] に修正すること`}>📝 自由テンプレート / Custom Template (〇〇を××に修正)</option>
                        <option value="" disabled>──────────────────────</option>
                        <option value={`指定したコマ以外のコマは、テキスト・レイアウト・背景など全て一切変更しないこと`}>⛔ 指定コマ以外は一切変更しない / Do NOT modify other panels</option>
                      </select>
                    </div>

                    <div className="builder-row mt-2">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.1rem' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>3. 自由入力 / Free Input (補足 / Supplement):</label>
                        {customPrompt && (
                          <button className="btn-tiny" onClick={() => { setCustomPrompt(''); setPresetIssue(''); }} title="入力内容をクリア / Clear" style={{ border: 'none', background: 'transparent' }}>🧹</button>
                        )}
                      </div>
                      <textarea 
                        className="text-input" rows={2} 
                        placeholder="例: フキダシは白く… / e.g., Bubble color..."
                        value={customPrompt} onChange={e => { setCustomPrompt(e.target.value); if(!e.target.value) setPresetIssue(''); }} 
                      />
                    </div>
                    
                    <div className="builder-actions" style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn-sm" onClick={handleAddInstructionRule} disabled={!customPrompt.trim()}>
                        ➕ ルールをリストに追加する / Add to Rule List
                      </button>
                    </div>
                  </div>
                  
                  {instructionRules.length > 0 && (
                    <div className="rule-list">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <label className="builder-label-sub" style={{ marginBottom: 0 }}>【現在の修正ルールリスト / Current Rules】</label>
                        <button className="btn-tiny" onClick={() => setInstructionRules([])} title="ルールを全て消去">🧹 全てクリア</button>
                      </div>
                      {instructionRules.map((r, i) => (
                        <div key={i} className="rule-item">
                          <span>{r}</span>
                          <button className="btn-remove-rule" onClick={() => handleRemoveInstructionRule(i)}>❌</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="rule-hint" style={{ marginTop: instructionRules.length > 0 ? '0.5rem' : '1rem', marginBottom: '0.5rem' }}>
                    💡 コマ限定修正の場合は、最後にプルダウンメニューから「このコマ以外は変更しない」をリストに追加すると効果的です / For panel-specific edits, adding 'Do NOT modify other panels' is recommended.
                  </p>
                  <p className="rule-hint" style={{ marginBottom: '1rem', color: '#ffaa00' }}>
                    ⚠️ 修正ルール使用時は右側の翻訳済み画像をベースに再生成します。繰り返すと画質が低下する場合があります。上の「📜 履歴」から以前の結果に戻せます。
                    <br /><span style={{fontSize: '0.85em', opacity: 0.8}}>Refinement uses the translated image as base. Use 📜 History to restore previous results if quality degrades.</span>
                  </p>

                  <button className="btn-generate btn-regenerate" onClick={() => handleGenerate(false)} disabled={!canGenerate || !translatedImage || instructionRules.length === 0}>
                    {isGenerating
                      ? <><span className="animate-spin">◉</span> 処理中... / Processing...</>
                      : <>🔄 翻訳画像(右)をベースに修正再生成 / Refine from Translated(Right)</>
                    }
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
