/**
 * 言語定義マスター — ソース言語 & ターゲット言語の両方に使用
 * 
 * readingDirection: 
 *   - 'rtl': 右→左読み（日本漫画）
 *   - 'ltr': 左→右読み（アメコミ、ウェブトゥーン、欧州BD等）
 * 
 * style: 画像生成プロンプトのレタリングスタイル指示に使用
 *   - comic: アメコミ風 ALL CAPS
 *   - manga: 日本マンガ風
 *   - webtoon: 韓国ウェブトゥーン風
 *   - manhua: 中国漫画風
 *   - european: 欧州BD(バンドデシネ)風
 *   - general: 汎用（特定スタイルなし）
 */

export const LANGUAGES = [
  { code: 'ja',    name: 'Japanese',               nativeName: '日本語',            readingDirection: 'rtl', style: 'manga' },
  { code: 'en',    name: 'English',                nativeName: 'English',          readingDirection: 'ltr', style: 'comic' },
  { code: 'ko',    name: 'Korean',                 nativeName: '한국어',            readingDirection: 'ltr', style: 'webtoon' },
  { code: 'zh-CN', name: 'Chinese (Simplified)',    nativeName: '中文简体',          readingDirection: 'rtl', style: 'manhua' },
  { code: 'zh-TW', name: 'Chinese (Traditional)',   nativeName: '中文繁體',          readingDirection: 'rtl', style: 'manhua' },
  { code: 'es',    name: 'Spanish',                nativeName: 'Español',          readingDirection: 'ltr', style: 'european' },
  { code: 'fr',    name: 'French',                 nativeName: 'Français',         readingDirection: 'ltr', style: 'european' },
  { code: 'de',    name: 'German',                 nativeName: 'Deutsch',          readingDirection: 'ltr', style: 'european' },
  { code: 'id',    name: 'Indonesian',             nativeName: 'Bahasa Indonesia', readingDirection: 'ltr', style: 'general' },
  { code: 'th',    name: 'Thai',                   nativeName: 'ไทย',              readingDirection: 'ltr', style: 'general' },
];

// 自動検出オプション（ソース言語用）
export const AUTO_DETECT = { code: 'auto', name: 'Auto-Detect', nativeName: '自動検出 / Auto-Detect', readingDirection: null, style: null };

/**
 * ソース言語とターゲット言語の読み方向からデフォルトの反転設定を計算
 * 反転が必要 = ソースとターゲットの読み方向が異なる場合
 */
export const getDefaultFlip = (sourceLang, targetLang) => {
  const src = getLanguageInfo(sourceLang);
  const tgt = getLanguageInfo(targetLang);
  // 自動検出の場合 or 同じ方向ならデフォルトOFF
  if (!src.readingDirection || !tgt.readingDirection) return false;
  return src.readingDirection !== tgt.readingDirection;
};

/**
 * 言語コードから言語情報を取得
 */
export const getLanguageInfo = (langCode) => {
  if (langCode === 'auto') return AUTO_DETECT;
  return LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0];
};

/**
 * UI表示用の言語ラベル（プルダウン用 — 日英併記）
 * 例: "日本語 / Japanese" / "한국어 / Korean"
 */
export const getLanguageLabel = (lang) => {
  if (lang.code === 'auto') return lang.nativeName;
  if (lang.nativeName === lang.name) return lang.name; // English
  return `${lang.nativeName} / ${lang.name}`;
};

/**
 * ソース言語用の選択肢（自動検出 + 全言語）
 */
export const getSourceLanguageOptions = () => {
  return [AUTO_DETECT, ...LANGUAGES];
};

/**
 * ターゲット言語用の選択肢（ソース言語を除外）
 */
export const getTargetLanguageOptions = (sourceLang) => {
  if (sourceLang === 'auto') return LANGUAGES;
  return LANGUAGES.filter(l => l.code !== sourceLang);
};
