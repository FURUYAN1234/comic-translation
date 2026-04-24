# HANDOFF (Comic Translation → Codex)

## Snapshot Date
2026-04-24T10:27:00+09:00

## Current Status
- ✅ **v1.5.3** — 安定稼働中（GitHub Pages デプロイ済み）
- ブランチ: `main`
- 未コミット変更: なし（Working tree clean）
- 直近5コミット:
  - `955fe3b` fix: resolve mojibake in README.md
  - `e4de454` chore: release v1.5.3
  - `f237abc` v1.5.2: URL/ISBN casing protection & pre-applied casing control
  - `6a82457` chore: update AGENTS.md with codex sync reference
  - `b79f280` docs: setup Four-File Operating Model

## Architecture & Key Files
| 用途 | ファイル |
|------|----------|
| メインUI | `src/App.jsx` |
| Gemini APIクライアント | `src/` 配下の該当ファイル |
| ビルド設定 | `vite.config.js` (base: `'/comic-translation/'` — **変更厳禁**) |

## Rule Enforcement (重要)
- 作業開始前に **必ず** `docs/project_standards.md` と `docs/deploy.md` を読むこと。
- ⚠️ **`vite.config.js` の `base` は `/comic-translation/`（絶対パス形式）が必須**。他アプリ（`./'`）と異なるので注意。変更すると画面が真っ白になる。
- デプロイ先: GitHub Pages のみ（HF Spaces は対象外）

## Done (前回作業)
- `AGENTS.md`, `docs/project_standards.md`, `docs/deploy.md` の整備完了
- README.md の文字化け修正 (v1.5.3)

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
