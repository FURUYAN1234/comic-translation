// AI漫画翻訳ツール V1.0.3
import React, { useState, useRef, useCallback } from 'react';
import './App.css';
import {
  setApiKey,
  IMAGE_MODEL_OPTIONS,
  extractTranslations,
  generateTranslatedImage,
} from './lib/gemini';

const SYSTEM_VERSION = "1.0.0";
const APP_NAME = "AI漫画翻訳ツール";

const App = () => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODEL_OPTIONS[0].value);

  // 入力
  const [originalImage, setOriginalImage] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // 翻訳テキスト
  const [translations, setTranslations] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // 出力
  const [translatedImage, setTranslatedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedModel, setUsedModel] = useState('');

  // ステータス
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const statusTimerRef = useRef(null);
  const [history, setHistory] = useState([]);

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
    setTranslatedImage(null);
    setUsedModel('');
    setOriginalFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setOriginalImage(dataUrl);
      // 自動でテキスト抽出
      await runExtraction(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  // ── テキスト抽出 ──
  const runExtraction = async (imageDataUrl) => {
    const dataUrl = imageDataUrl || originalImage;
    if (!dataUrl) return;
    setIsExtracting(true);
    setErrorMessage('');
    showStatus('📖 テキスト抽出中...');
    try {
      const base64 = dataUrl.split(',')[1];
      const result = await extractTranslations(base64, (s) => showStatus(s));
      setTranslations(result);
      showStatus(`✅ ${result.length}件検出完了`, true);
    } catch (err) {
      setErrorMessage(`テキスト抽出エラー: ${err.message}`);
      showStatus('', false);
    } finally {
      setIsExtracting(false);
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
  const updateTranslation = (index, value) => {
    setTranslations(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], translated: value };
      return copy;
    });
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
    showStatus('🔄 画像を左右反転中...');
    try {
      const flippedBase64 = await flipImageHorizontally(originalImage);
      showStatus('🌐 英訳画像を生成中...');
      const result = await generateTranslatedImage(
        flippedBase64, translations, selectedModel, (s) => showStatus(s)
      );
      const imgSrc = `data:image/png;base64,${result.base64Img}`;
      setTranslatedImage(imgSrc);
      setUsedModel(result.usedModel);
      setHistory(prev => [{ translated: imgSrc, model: result.usedModel, fileName: originalFileName, timestamp: Date.now() }, ...prev]);
      showStatus(`✅ 翻訳完了 (${result.usedModel})`, true);
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
    const link = document.createElement('a');
    link.href = translatedImage;
    link.download = `${(originalFileName || 'manga').replace(/\.[^.]+$/, '')}_EN_${Date.now()}.png`;
    link.click();
  };

  // ── 画像リセット ──
  const handleImageReset = () => {
    setOriginalImage(null);
    setOriginalFileName('');
    setTranslations([]);
    setTranslatedImage(null);
    setUsedModel('');
    setErrorMessage('');
    showStatus('🔄 リセット完了', true);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            <p className="api-gate-sub">V{SYSTEM_VERSION} — Comic Translation Tool</p>
            <input type="password" className="api-gate-input" placeholder="Gemini API キーを入力..."
              value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()} />
            <button className="api-gate-btn" onClick={handleApiKeySubmit}>🔓 起動する</button>
            <p className="api-gate-note">※ APIキーはセッション限定（ブラウザに保存されません）<br />Google AI Studio: ai.google.dev で取得</p>
          </div>
        </div>
      )}

      <div className={!isUnlocked ? 'app-locked' : ''}>
        {/* ヘッダー */}
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

        {/* ════ メイン2カラム ════ */}
        <div className="main-grid">

          {/* ═══ 左: 入力カラム ═══ */}
          <div className="col-input">
            {/* 画像D&D */}
            <div className={`drop-zone ${isDragging ? 'dragging' : ''} ${originalImage ? 'has-image' : ''}`}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => !originalImage && fileInputRef.current?.click()}>
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
                      <span className="text-type">{typeIcon(t.type)}</span>
                      <div className="text-input text-orig">{t.original}</div>
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
            {/* 反転+画像生成ボタン（結果画像の上） */}
            <button className="btn-generate" onClick={handleGenerate} disabled={!canGenerate}>
              {isGenerating
                ? <><span className="animate-spin">◉</span> 画像生成中...</>
                : <>{translatedImage ? '🌐 英訳画像を再生成する' : '🌐 反転 + 英訳画像 生成'}</>
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
                        <p>英訳画像を生成中...</p>
                        <p className="gen-sub">反転 → テキスト英訳 → 画像再構築</p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
