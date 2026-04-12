/**
 * 翻訳先言語の定義マスター
 * 
 * defaultFlip: 日本語漫画（右→左読み）からの翻訳時に、左右反転をデフォルトでONにするかどうか
 *   - true: 西洋圏（左→右読みが標準）→ 反転して左→右読みにする
 *   - false: アジア圏（右→左読みがそのまま通用する文化）→ 反転しない
 * 
 * style: 画像生成プロンプトのレタリングスタイル指示に使用
 *   - comic: アメコミ風 ALL CAPS
 *   - webtoon: 韓国ウェブトゥーン風
 *   - manhua: 中国漫画風
 *   - european: 欧州BD(バンドデシネ)風
 *   - general: 汎用（特定スタイルなし）
 */

export const LANGUAGES = [
  { code: 'en',    name: 'English',                nativeName: 'English',          defaultFlip: true,  style: 'comic' },
  { code: 'ko',    name: 'Korean',                 nativeName: '한국어',            defaultFlip: false, style: 'webtoon' },
  { code: 'zh-CN', name: 'Chinese (Simplified)',    nativeName: '中文简体',          defaultFlip: false, style: 'manhua' },
  { code: 'zh-TW', name: 'Chinese (Traditional)',   nativeName: '中文繁體',          defaultFlip: false, style: 'manhua' },
  { code: 'es',    name: 'Spanish',                nativeName: 'Español',          defaultFlip: true,  style: 'european' },
  { code: 'fr',    name: 'French',                 nativeName: 'Français',         defaultFlip: true,  style: 'european' },
  { code: 'de',    name: 'German',                 nativeName: 'Deutsch',          defaultFlip: true,  style: 'european' },
  { code: 'id',    name: 'Indonesian',             nativeName: 'Bahasa Indonesia', defaultFlip: true,  style: 'general' },
  { code: 'th',    name: 'Thai',                   nativeName: 'ไทย',              defaultFlip: true,  style: 'general' },
];

/**
 * 言語コードからデフォルトの反転設定を取得
 */
export const getDefaultFlip = (langCode) => {
  return LANGUAGES.find(l => l.code === langCode)?.defaultFlip ?? true;
};

/**
 * 言語コードから言語情報を取得
 */
export const getLanguageInfo = (langCode) => {
  return LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0];
};

/**
 * UI表示用の言語ラベル（プルダウン用）
 * 例: "English" / "한국어 (Korean)"
 */
export const getLanguageLabel = (lang) => {
  if (lang.code === 'en') return lang.nativeName;
  return `${lang.nativeName} (${lang.name})`;
};
