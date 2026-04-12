// AI漫画翻訳ツール V1.3.0 — 多言語対応
import React, { useState, useRef, useCallback } from 'react';
import './App.css';
import {
  setApiKey,
  IMAGE_MODEL_OPTIONS,
  extractTranslations,
  generateTranslatedImage,
  translateSingleText
} from './lib/gemini';
import { LANGUAGES, getDefaultFlip, getLanguageInfo, getLanguageLabel } from './lib/languages';

const SYSTEM_VERSION = "1.3.0";
const APP_NAME = "AI漫画翻訳ツール";

const App = () => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODEL_OPTIONS[0].value);

  // 多言語設定
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [flipEnabled, setFlipEnabled] = useState(true); // デフォルト: 英語なのでON

  // 言語変更ハンドラ（デフォルトの反転設定も連動更新）
  const handleLanguageChange = useCallback((langCode) => {
    setTargetLanguage(langCode);
    setFlipEnabled(getDefaultFlip(langCode));
  }, []);

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

  // ── API認証 ──
  const handleApiKeySubmit = () => {
    const key = apiKeyInput.trim();
    if (key.length > 10) { setApiKey(key); setIsUnlocked(true); }
  };

  // ── 画像読み込み（D&D時は自動抽出） ──
  const loadImage = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('画像ファイルを選択してください。'); return;
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
  }, []);

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
      const result = await extractTranslations(base64, (s) => {
        if (currentSession === extractionSessionRef.current) showStatus(s);
      }, lang);
      
      // もし抽出中に別の画像がドロップされセッションが変わっていたら、古い結果は画面に反映せず破棄する
      if (currentSession !== extractionSessionRef.current) return;

      // 新形式 {layout, texts} を分離して保存
      if (result.layout && result.texts) {
        setPanelLayout(result.layout);
        setTranslations(result.texts);
        const layoutLabel = result.layout.type === '4koma' ? '四コマ' : `一般漫画(${result.layout.panels.length}コマ)`;
        showStatus(`✅ ${result.texts.length}件検出 / ${layoutLabel}`, true);
      } else {
        // 万一旧形式が返った場合のフォールバック
        setTranslations(Array.isArray(result) ? result : []);
        showStatus(`✅ 検出完了`, true);
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
    showStatus(`🔄 テキスト #${index + 1} を翻訳中...`);
    try {
      const langInfo = getLanguageInfo(targetLanguage);
      const translated = await translateSingleText(item.original, targetLanguage);
      updateTranslation(index, translated);
      showStatus(`✅ テキスト #${index + 1} → ${langInfo.nativeName} 翻訳完了`, true);
    } catch (err) {
      setErrorMessage(`個別翻訳エラー: ${err.message}`);
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
      setErrorMessage('内容を選択するか、自由入力欄に指示をご記入ください。');
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
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.scale(-1, 1);
        ctx.drawImage(img, -canvas.width, 0);
        resolve(canvas.toDataURL('image/png').split(',')[1]);
      };
      img.src = dataUrl;
    });
  };

  // ── 画像生成 ──
  const handleGenerate = async () => {
    if (!originalImage || isGenerating) return;
    setIsGenerating(true);
    setErrorMessage('');
    
    // UIを自動で閉じる
    setShowBuilder(false);

    const langInfo = getLanguageInfo(targetLanguage);

    try {
      let inputBase64;
      if (flipEnabled) {
        showStatus('🔄 画像を左右反転中...');
        inputBase64 = await flipImageHorizontally(originalImage);
      } else {
        showStatus('📋 画像を準備中...');
        inputBase64 = originalImage.split(',')[1];
      }
      showStatus(`🌐 ${langInfo.nativeName}画像を生成中...`);
      const result = await generateTranslatedImage(
        inputBase64, translations, selectedModel, (s) => showStatus(s), instructionRules, customPrompt, targetLanguage
      );
      const imgSrc = `data:image/png;base64,${result.base64Img}`;
      setTranslatedImage(imgSrc);
      setUsedModel(result.usedModel);
      setHistory(prev => [{ translated: imgSrc, model: result.usedModel, fileName: originalFileName, timestamp: Date.now() }, ...prev]);
      showStatus(`✅ ${langInfo.nativeName}翻訳完了 (${result.usedModel})`, true);
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

  // ── API リセット ──
  const handleFullReset = () => {
    handleImageReset();
    setApiKey('');
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
            <input type="password" className="api-gate-input" placeholder="Gemini API キーを入力..."
              value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()} />
            <button className="api-gate-btn" onClick={handleApiKeySubmit}>🔓 起動する</button>
            <p className="api-gate-note">※ APIキーはセッション限定（ブラウザに保存されません）<br />Google AI Studio: ai.google.dev で取得</p>
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
              <div className="model-select-wrap">
                <label className="model-label">翻訳先</label>
                <select className="lang-select" value={targetLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)} disabled={isWorking}>
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{getLanguageLabel(l)}</option>
                  ))}
                </select>
              </div>
              <div className="model-select-wrap">
                <label className="model-label">生成モデル</label>
                <select className="model-select" value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)} disabled={isWorking}>
                  {IMAGE_MODEL_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn-icon-only" onClick={handleFullReset} title="API含む全リセット">⏻</button>
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
                    <button className="btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>📁 変更</button>
                    <button className="btn-sm btn-sm-danger" onClick={(e) => { e.stopPropagation(); handleImageReset(); }}>🗑️ リセット</button>
                  </div>
                  <div className="preview-filename">{originalFileName}</div>
                </div>
              ) : (
                <div className="drop-content">
                  <div className="drop-icon">📁</div>
                  <p className="drop-text">漫画画像をドラッグ&ドロップ</p>
                  <p className="drop-sub">または クリックして選択</p>
                </div>
              )}
            </div>

            {/* テキスト抽出ボタン（画像の下、テキスト欄の上） */}
            {originalImage && (
              <button className="btn-extract" onClick={() => runExtraction()} disabled={isExtracting || !originalImage}>
                {isExtracting
                  ? <><span className="animate-spin">◉</span> テキスト抽出中...</>
                  : <>📖 テキスト再抽出</>
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
                  <span className="text-panel-title">📋 抽出テキスト ({translations.length}件)</span>
                  <span className="text-panel-hint">英訳を修正可能</span>
                </div>
                <div className="text-list">
                  {translations.map((t, i) => (
                    <div key={i} className="text-row">
                      <span className="text-type" title={t.type}>{typeIcon(t.type)}</span>
                      {t.panel && <span className="panel-badge" title={`所属: ${t.panel}`}>{t.panel}</span>}
                      <textarea value={t.original}
                        onChange={(e) => updateOriginalText(i, e.target.value)}
                        className="text-input text-orig" rows={2} />
                      <div className="text-row-actions">
                        <button className="btn-retrans" onClick={() => handleSingleTranslate(i)} disabled={translatingRow === i} title="この行だけ再翻訳">
                          {translatingRow === i ? <span className="animate-spin" style={{fontSize: '9px'}}>◉</span> : '🔄'}
                        </button>
                        <button className="btn-clear" onClick={() => updateTranslation(i, '')} disabled={translatingRow === i} title="英訳を消去">🧹</button>
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
                <span className="flip-label">🔄 左右反転:</span>
                <button
                  className={`toggle-switch ${flipEnabled ? 'toggle-on' : 'toggle-off'}`}
                  onClick={() => setFlipEnabled(!flipEnabled)}
                  disabled={isWorking}
                  title={flipEnabled ? '反転ON — 画像を左右反転して生成' : '反転OFF — 原画の向きのまま生成'}
                >
                  <span className="toggle-knob" />
                  <span className="toggle-text">{flipEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </label>
              <span className="flip-hint">
                {flipEnabled ? '左→右読み（西洋式）' : '右→左読み（日本式）'}
              </span>
            </div>
            <button className="btn-generate" onClick={handleGenerate} disabled={!canGenerate}>
              {isGenerating
                ? <><span className="animate-spin">◉</span> 画像生成中...</>
                : <>{translatedImage
                    ? `🌐 ${getLanguageInfo(targetLanguage).nativeName}画像を再生成`
                    : `🌐 ${flipEnabled ? '反転 + ' : ''}${getLanguageInfo(targetLanguage).nativeName}画像 生成`
                  }</>
              }
            </button>

            {/* 結果画像 */}
            <div className="result-panel">
              <div className="result-header">
                <span className="result-label">🎯 翻訳結果</span>
                {usedModel && <span className="result-model"><span className="dot-ok">●</span> {usedModel}</span>}
              </div>
              <div className="result-img-box">
                {translatedImage ? (
                  <div className={`img-wrapper ${isGenerating ? 'is-generating' : ''}`}>
                    <img src={translatedImage} alt="翻訳結果" className="result-img" />
                    {isGenerating && (
                      <div className="gen-overlay">
                        <span className="animate-spin gen-spin">◉</span>
                        <p>画像を再生成中...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="result-empty">
                    {isGenerating ? (
                      <div className="gen-indicator">
                        <span className="animate-spin gen-spin">◉</span>
                        <p>{getLanguageInfo(targetLanguage).nativeName}画像を生成中...</p>
                        <p className="gen-sub">{flipEnabled ? '反転 → ' : ''}テキスト翻訳 → 画像再構築</p>
                      </div>
                    ) : (
                      <p>画像をD&Dして<br />上のボタンで生成</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ダウンロードボタン */}
            <button className="btn-download" onClick={handleDownload} disabled={!translatedImage}>
              📥 ダウンロード
            </button>

            {/* 履歴 */}
            {history.length > 0 && (
              <div className="history-panel">
                <div className="history-head">
                  <span>📜 履歴 ({history.length})</span>
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
                <span>✨ 再生成オプション (修正詳細の指示)</span>
                <span>{showBuilder ? '▲' : '▼'}</span>
              </div>
              
              {showBuilder && (
                <div className="builder-content">
                  <p className="builder-desc">画像を確認後、修正が必要なコマと内容を選んで追加してください。</p>
                  
                  <div className="builder-controls">
                    <div className="builder-row">
                      <label>1. 対象 (複数可):</label>
                      <div className="panel-checkboxes">
                        {['全体', 'タイトル', ...(panelLayout?.panels || ['1コマ目', '2コマ目', '3コマ目', '4コマ目']), '欄外'].map(p => (
                          <label key={p} className="panel-checkbox">
                            <input type="checkbox" checked={panelTargets.includes(p)} onChange={() => handleTogglePanelTarget(p)} />
                            <span>{p}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="builder-row mt-2">
                      <label>2. 内容:</label>
                      <select value={presetIssue} onChange={e => handlePresetSelect(e.target.value)} className="preset-select">
                        <option value="">-- よくある問題を選択 / または下の欄に自由記述 --</option>
                        <option value={`このコマのテキストが縦書き（垂直方向）で描画されている。全てのテキストを水平方向の横書き（left-to-right）に修正して再描画すること。文字を縦に1文字ずつ積む描画も禁止`}>📐 テキストが縦書きになっている</option>
                        <option value={`このコマのフキダシ内に日本語テキストの痕跡が残っている。フキダシ内部を完全に白く塗りつぶしてから、${getLanguageInfo(targetLanguage).name}テキストのみを描画し直すこと`}>⬜ フキダシに日本語が残っている</option>
                        <option value={`このコマで翻訳テキストの一部が描画されていない。翻訳リストにある全テキストを対応する位置に1つ残らず漏れなく描画すること`}>✏️ 翻訳テキストが一部描画されていない</option>
                        <option value={`このコマの吹き出しからテキストがはみ出している。フォントサイズを縮小し改行を増やして、全テキストを吹き出し枠内に完全に収めること`}>📦 文字が枠からはみ出している</option>
                        <option value={`このコマの吹き出し全体を一度白く塗りつぶし、吹き出しの外形は維持したまま内部を完全にリセットした上で、${getLanguageInfo(targetLanguage).name}テキストをゼロから再描画すること`}>🔄 吹き出しを完全リセットして再描画</option>
                        <option value={`このコマのテキストが背景と同化して判読困難なため、文字に白または黒の縁取り（アウトライン）を追加して確実に判読できるようにすること`}>👁️ 文字が背景と同化して見えない</option>
                        <option value={`このコマの擬音・効果音（SFX）を、大きく力強いレタリングスタイルで再描画すること`}>💥 擬音・効果音を力強く強調</option>
                        <option value={`このコマに含まれる不要な要素を完全に消去し、周囲の背景・パターンで自然に補完すること。消去対象: `}>🧹 不要な要素を消去（※対象を下記で指定）</option>
                        <option value={`このコマ内の指定要素を別の要素に置き換え、周囲との整合性を保ちつつ自然に描画すること。変更: [元] → [新]`}>🔀 要素を別のものに置き換え（※内容を下記で指定）</option>
                        <option value={`このコマの [対象] の [現状の問題] を [望む状態] に修正すること`}>📝 自由テンプレート（〇〇を××に修正）</option>
                        <option value="" disabled>──────────────────────</option>
                        <option value={`指定したコマ以外のコマは、テキスト・レイアウト・背景など全て一切変更しないこと`}>⛔ 指定コマ以外は一切変更しない</option>
                      </select>
                    </div>

                    <div className="builder-row mt-2">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.1rem' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>3. 自由入力（上記の補足、修正、もしくは詳細な指示など）:</label>
                        {customPrompt && (
                          <button className="btn-tiny" onClick={() => { setCustomPrompt(''); setPresetIssue(''); }} title="入力内容をクリア" style={{ border: 'none', background: 'transparent' }}>🧹</button>
                        )}
                      </div>
                      <textarea 
                        className="text-input" rows={2} 
                        placeholder="例: 1コマ目右のフキダシは・・・・　3コマ目の擬音を……"
                        value={customPrompt} onChange={e => { setCustomPrompt(e.target.value); if(!e.target.value) setPresetIssue(''); }} 
                      />
                    </div>
                    
                    <button className="btn-add-rule mt-2" onClick={handleAddInstructionRule}>➕ ルールをリストに追加する</button>
                  </div>
                  
                  {instructionRules.length > 0 && (
                    <div className="rule-list">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <label className="builder-label-sub" style={{ marginBottom: 0 }}>【現在の修正ルールリスト】</label>
                        <button className="btn-tiny" onClick={() => setInstructionRules([])} title="ルールを全て消去">🧹 全てクリア</button>
                      </div>
                      {instructionRules.map((r, i) => (
                        <div key={i} className="rule-item">
                          <span>{r}</span>
                          <button className="btn-remove-rule" onClick={() => handleRemoveInstructionRule(i)}>❌</button>
                        </div>
                      ))}
                      <p className="rule-hint">💡 コマ限定修正の場合は、最後にプルダウンメニューから「このコマ以外は変更しない」をリストに追加すると効果的です</p>
                    </div>
                  )}

                  <button className="btn-generate btn-regenerate" onClick={handleGenerate} disabled={!canGenerate}>
                    {isGenerating
                      ? <><span className="animate-spin">◉</span> 処理中...</>
                      : <>🔄 このリストの指示で画像を再生成する</>
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
