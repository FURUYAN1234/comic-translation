# HANDOFF (Comic Translation → Codex)

## Snapshot Date
2026-05-25T18:35:00+09:00

## Current Status
- ✅ **v1.6.12** — 安定稼働中（ビルド・ローカル検証完了）
- ブランチ: `main`
- 未コミット変更: あり（修正済みファイルをステージング/コミット待ち）
- 直近コミット:
  - `cd3f817` v1.6.10: Hotfix Gemini image model 404 error

## Architecture & Key Files
| 用途 | ファイル |
|------|----------|
| メインUI | `src/App.jsx` |
| Gemini APIクライアント | `src/lib/gemini.js` |
| ビルド設定 | `vite.config.js` (base: `'/comic-translation/'` — **変更厳禁**) |

## Rule Enforcement (重要)
- 作業開始前に **必ず** `docs/project_standards.md` と `docs/deploy.md` を読むこと。
- ⚠️ **`vite.config.js` の `base` は `/comic-translation/`（絶対パス形式）が必須**。他アプリ（`./'`）と異なるので注意。変更すると画面が真っ白になる。
- デプロイ先: GitHub Pages のみ（HF Spaces は対象外）

## Done (今回および前回作業)
- **v1.6.12: Gemini画像生成モデルのプロンプト英語再設定（文字化け修正）**
  - **プロンプト英語再設定**: プロンプトが日本語の際に、モデルが吹き出し内にぐちゃぐちゃな日本語・漢字をレンダリングしてしまっていた深刻なバグを解消するため、Gemini画像生成モデルに送信するプロンプト全体（`basePrompt`, `buildStyleInstructions`）を完全に「英語」へ再翻訳。これにより、アルファベット表記が正常に描画されるように修正。
  - **タイムアウト・フリーズ対策の維持**: 前回の修正で実装したCanvas左右反転の `onerror`/`reject` 処理、および `diagnoseConnection` の10秒タイムアウト処理はそのまま維持。
  - **バージョン同期**: バージョン表記を `1.6.12` に同期更新（`package.json`, `App.jsx`, `index.html`, `README.md`）。
- **v1.6.11: Gemini画像生成プロンプト日本語復元および無限フリーズバグ修正（※文字化けが発生したためv1.6.12で英語プロンプトに再修正）**
  - 画像の左右反転処理にエラー検知（reject）を追加し、接続診断ツールには10秒のタイムアウトを設定することで、エラー発生時の無限フリーズバグを修正。
- **v1.6.10: Gemini 画像生成モデル 404 エラーホットフィックス**
  - 画像生成時に API 404 エラーを引き起こしていた廃止済みの `gemini-2.5-flash-preview-image` を削除。
  - 正式な `gemini-2.5-flash-image`（推奨）を最優先（デフォルト選択）に設定し、`gemini-3-pro-image-preview`（Premium）を新規選択肢に追加。
- **v1.6.9: Gemini APIモデル非推奨化対応（OCR・翻訳処理のクラッシュ対策）**
  - OCRおよび翻訳モデルのリストから廃止された `gemini-2.0-flash` を削除し、`gemini-3.5-flash` / `gemini-flash-latest` を最優先に指定。

## Remaining Tasks
- 特になし（デプロイ指示等があれば実行可能）

## Verification State
- ローカルビルド（`npm run build`）完了、動作検証済み。

## Risks
なし
