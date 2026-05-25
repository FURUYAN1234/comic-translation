# HANDOFF (Comic Translation → Codex)

## Snapshot Date
2026-05-25T10:30:00+09:00

## Current Status
- ✅ **v1.6.9** — 安定稼働中（ビルド検証済み。デプロイ待ち）
- ブランチ: `master`
- 未コミット変更: あり（`gemini.js`, `App.jsx`, `package.json`, `index.html`, `README.md` の変更）
- 直近コミット:
  - `955fe3b` fix: resolve mojibake in README.md
  - `e4de454` chore: release v1.5.3

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

## Done (前回作業)
- **v1.6.9: Gemini APIモデル非推奨化対応（OCR・翻訳処理のクラッシュ対策）**
  - OCRおよび翻訳モデルのリストから廃止された `gemini-2.0-flash` を削除し、`gemini-3.5-flash` / `gemini-flash-latest` を最優先に指定。
  - テキスト抽出（OCR）および単一テキスト再翻訳のAPIタイムアウト制御（25秒）を適用。
  - APIエラーやタイムアウト時の `gemini-1.5-pro` への安全なフォールバックロジックを実装。
  - **再チェック時の堅牢性向上**:
    - `gemini.js` 内の各種APIコールで `try...finally` による `clearTimeout` の漏れ防止処理（リーク対策）を適用。
    - OpenAI 側のテキスト処理（OCR/再翻訳）に対しても同様にタイムアウト制御を `25` 秒に同期調整（`openai.js`）。
  - バージョン情報を v1.6.9 へ同期（`package.json`, `App.jsx`, `index.html`, `README.md`）。
  - ローカル環境での `npm run build` が正常に完了することを確認済み。

## Remaining Tasks
- 特になし（ユーザーからの新たな指示を待機中）

## Verification State
- GitHub Pages デプロイ済み (v1.5.3)

## Risks
なし

## Entry Points for Codex
1. `AGENTS.md` → 全体ルール
2. `docs/project_standards.md` → コード規約・禁止事項
3. `docs/deploy.md` → デプロイ手順（base パス注意）

## Suggested First Command
```bash
git pull origin main
```

---

## Root App Protection Rule

This workspace root app is an active product app and must not be treated as a scratchpad, disposable shell, or temporary target for unrelated UI experiments.

### Protected Existing App
- `C:\Users\sx717\OneDrive\Documents\Codex_App\comic-translation`

### Protected Files
- `src/App.jsx`
- `src/App.css`
- `src/index.css`
- `src/lib/`
- `public/`
- `README.md`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `dist/`

### Mandatory Interpretation
- Requests for a separate app, clone-like UI, prototype, experiment, mock, or public-safe rewrite must be implemented in a new subfolder.
- Do not satisfy those requests by replacing the current app.
- If the target app is not explicit, do not edit anything until the target is clarified.

### Build / Deploy Guardrail
- Do not run `npm run build`, `npm run deploy`, or any command that rewrites `dist/` unless the current root app is explicitly the intended target.

### Multi-Agent / Multi-PC Guardrail
- These protection rules apply equally in Codex and Antigravity.
- Opening the correct folder is required but not sufficient; agents must still respect the protected-file and separate-subfolder rules above.
