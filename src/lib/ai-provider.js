/**
 * AI Provider Router for AI漫画翻訳ツール
 * v1.0.0 - Dual Engine 抽象化レイヤー（共通モジュール準拠）
 *
 * 起動時に選択された AI Engine に基づいて、
 * テキスト抽出・個別翻訳・画像生成のルーティングを行う。
 *
 * 設計思想:
 * - Gemini側のコード（gemini.js）は一切変更しない
 * - OpenAI側のコード（openai.js）も独立
 * - この1ファイルだけが切り替えロジックを持つ
 */

import { extractTranslations, generateTranslatedImage, translateSingleText } from './gemini';
import { extractTranslationsOAI, generateTranslatedImageOAI, translateSingleTextOAI } from './openai';

// --- エンジン状態管理 ---
// 'gemini' | 'openai'
let activeEngine = 'gemini';

/**
 * アクティブエンジンを設定する（起動時にAPIキー入力で1回だけ呼ばれる）
 */
export const setActiveEngine = (engine) => {
  if (engine !== 'gemini' && engine !== 'openai') {
    console.warn(`[AI Provider] Unknown engine "${engine}". Defaulting to "gemini".`);
    activeEngine = 'gemini';
    return;
  }
  activeEngine = engine;
  console.log(`[AI Provider] Engine switched to: ${engine.toUpperCase()}`);
};

/**
 * 現在のアクティブエンジンを取得する
 */
export const getActiveEngine = () => activeEngine;

/**
 * エンジン名を日本語で返す（UI表示用）
 */
export const getEngineDisplayName = () => {
  return activeEngine === 'openai' ? 'ChatGPT' : 'Gemini';
};

/**
 * 統合テキスト抽出関数
 * activeEngine に応じて Gemini or OpenAI に自動ルーティング
 */
export const extractTranslationsAI = async (...args) => {
  if (activeEngine === 'openai') {
    return extractTranslationsOAI(...args);
  }
  return extractTranslations(...args);
};

/**
 * 統合個別翻訳関数
 */
export const translateSingleTextAI = async (...args) => {
  if (activeEngine === 'openai') {
    return translateSingleTextOAI(...args);
  }
  return translateSingleText(...args);
};

/**
 * 統合画像生成関数
 */
export const generateTranslatedImageAI = async (...args) => {
  if (activeEngine === 'openai') {
    return generateTranslatedImageOAI(...args);
  }
  return generateTranslatedImage(...args);
};
