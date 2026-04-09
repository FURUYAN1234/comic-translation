// AI漫画翻訳ツール V1.2.0
import React, { useState, useRef, useCallback } from 'react';
import './App.css';
import {
  setApiKey,
  IMAGE_MODEL_OPTIONS,
  extractTranslations,
  generateTranslatedImage,
  translateSingleText
} from './lib/gemini';

const SYSTEM_VERSION = "1.2.2";
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
      const translated = await translateSingleText(item.original);
      updateTranslation(index, translated);
      showStatus(`✅ テキスト #${index + 1} 翻訳完了`, true);
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
    if (panelTargets.length === 0) {
      setErrorMessage('対象のコマを選択してください。');
      return;
    }
    if (!customPrompt.trim()) {
      setErrorMessage('内容を選択するか、自由入力欄に指示をご記入ください。');
      return;
    }
    
    // 全体が選ばれている場合は「全体」として統合
    let targetText = panelTargets.includes('全体') ? '全体' : panelTargets.sort().join('と');
    const ruleText = `【${targetText}】${customPrompt.trim()}`;
    
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

    showStatus('🔄 画像を左右反転中...');
    try {
      const flippedBase64 = await flipImageHorizontally(originalImage);
      showStatus('🌐 英訳画像を生成中...');
      const result = await generateTranslatedImage(
        flippedBase64, translations, selectedModel, (s) => showStatus(s), instructionRules, customPrompt
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
                        <option value="このコマのセリフ・テキストが縦書きや斜めになっているため、全て完全に横書き（水平・左右方向）で描き直すこと">📐 文字が縦/斜め → 完全横書きで描き直す</option>
                        <option value="このコマの吹き出し内の文字が枠からはみ出しているため、フォントを小さくし改行を増やして吹き出し枠内に収めること">📦 文字が枠からはみ出し → 縮小・改行して収める</option>
                        <option value="このコマのテキストが背景と同化して読みにくいため、黒または白のフチ取り（アウトライン）をつけて視認性を上げること">🔲 文字が読みにくい → フチ取りで視認性を上げる</option>
                        <option value="このコマに描画された不要な文字・ゴミのような線・汚れを全て消去すること">🧹 不要なゴミ・変な線・汚れを消去する</option>
                        <option value="このコマで一部の英訳テキストが描画されていないため、全てのテキストを漏れなく確実に描画すること">✏️ 消えている文字を漏れなく確実に描画する</option>
                        <option value="このコマのフキダシ内に元の日本語の痕跡が残っているため、完全に白く塗りつぶした上で英語テキストを描くこと">⬜ フキダシの日本語痕跡を白塗りしてから描く</option>
                        <option value="このコマの擬音語・効果音を、アメコミ風のポップでダイナミックなスタイルで大きく力強く描画すること">💥 擬音・効果音をアメコミ風に大きく描画</option>
                        <option value="このコマの吹き出し全体を一度白く塗りつぶし、元の形を維持しつつ内部を完全にリセットしてから英語テキストを再描画すること">🔄 吹き出しをリセットして英語を再描画</option>
                        <option value="" disabled>──────────────────────</option>
                        <option value="指定したコマ以外のコマは、テキスト・レイアウト・背景など全て一切変更しないこと">⛔ このコマ以外は一切変更しない（コマ限定修正用）</option>
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
                      <label className="builder-label-sub">【現在の修正ルールリスト】</label>
                      {instructionRules.map((r, i) => (
                        <div key={i} className="rule-item">
                          <span>{r}</span>
                          <button className="btn-remove-rule" onClick={() => handleRemoveInstructionRule(i)}>❌</button>
                        </div>
                      ))}
                      <p className="rule-hint">💡 コマ限定修正の場合は、最後に「このコマ以外は変更しない」をリストに追加すると効果的です</p>
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
