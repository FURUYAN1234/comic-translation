# PROJECT RULES: comic-translation

## Project Overview
Gemini などの生成AIを用いて、マンガ画像内のテキストをOCR抽出し、翻訳を行うアプリケーション。

## Architecture Guardrails (絶対防衛ライン)
AI（Codex等）の過剰な最適化によるシステム破壊を絶対に防ぐこと。以下のロジックは、推測で削除・短縮・単純化してはいけない。

### 1. API特有のエラーハンドリング
- Gemini API 等の `429 Too Many Requests` 回避や、非同期処理担保のための `wait loop`, `retry` 処理は、泥臭く見えても勝手に削らないこと。

### 2. プロンプトの物理強制力
- OCR抽出や翻訳時の「出力フォーマット（JSON形式等の厳密な指定）」はシステムの中核である。長大な制約プロンプトがあっても、冗長だと判断して要約・省略してはならない。

## Forbidden Files / Settings (変更禁止)
- `package.json` や UI上のバージョン表記は連動させること。
- API Key などの機密情報をフロントエンドコードにハードコードしないこと。
