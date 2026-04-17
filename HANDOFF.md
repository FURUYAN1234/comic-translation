# HANDOFF

## Goal
マルチエージェント用ドキュメントアーキテクチャ（4本柱モデル）の整備。

## Current Status
整備完了。Antigravity側から GitHub リモートリポジトリへ Push される状態。

## Done
- `AGENTS.md` の作成（常駐ルールおよび Four-File Operating Model 記載）
- `docs/project_standards.md` の作成（絶対防衛ライン明記）
- `docs/deploy.md` の作成（絶対に書き換えてはならない base パスの制約等を明示）

## Remaining Tasks
- 特になし（Codex側での作業環境の同期待ち）

## Decisions
- 各プロジェクトごとのコンテキスト汚染を防ぐため、アプリ固有のルールは `docs/project_standards.md` と `docs/deploy.md` に集約することとした。

## Constraints
- プラットフォーム等の固有仕様は `docs/deploy.md` の指示に従い、他プロジェクトのルールから推測・流用しないこと。

## Touched Files
- `AGENTS.md` [NEW]
- `HANDOFF.md` [MODIFIED]
- `docs/project_standards.md` [NEW]
- `docs/deploy.md` [NEW]

## Entry Points
- `AGENTS.md`
- `HANDOFF.md`

## Verification
- [x] ルール策定およびファイル配置
- [x] Git Push 準備完了

## Risks / Assumptions
- Codex側の作業ディレクトリが同じリモートリポジトリの clone であることを前提としている。

## Diff Scope
- Other (Documentation)

## Project Rules
- 詳細は `docs/project_standards.md`, `docs/deploy.md` 参照

## Next Step
Codex側は、作業再開の前に自身の作業ディレクトリ上で `git pull origin main` を行い、Antigravity側で追加された変更を取り込むこと。

## Suggested Commands
```bash
git pull origin main
```
