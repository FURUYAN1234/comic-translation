# Deploy Rules & Full Protocol: comic_translation

CodexおよびAntigravityがデプロイ作業を行う際の完全な手順書（フルプロトコル）です。

## 1. Deploy Targets & Environment
- **Deploy Target**: GitHub Pages (gh-pages)
- **Protected Settings**: `vite.config.js` の `base` は `/comic-translation/` であること。推測で `'./'` に変更しない。
- **Not Applicable**: Hugging Face Spaces, Vercel, Netlify

## 2. Version Bump Targets (バージョン更新対象ファイル)
以下のファイルのバージョン番号 (`vX.Y.Z`) を全て一致させること。
1. `package.json` (`"version": "X.Y.Z"`)
2. `src/App.jsx` (`const SYSTEM_VERSION = "X.Y.Z"` など存在する場合)
3. `index.html` (`<title>` タグ内のバージョン)
4. `README.md` (バッジ表記やChangeLog等)

## 3. Pre-Deploy Audit (監査ルール)
デプロイ前に以下のチェックを必ず行うこと。
- **ゴミファイル**: 一時検証スクリプト、テンプレート残骸が存在しないか。
- **個人情報/ローカルパス**: `C:\Users\...` などのパス、個人名、メールアドレスが含まれていないか。
- **公開禁止の固有名詞**: 他プロジェクト名（`Nano Banana Pro`, `remotion_video_2` 等）が混入していないか。
- **機密情報**: APIキーが直書きされていないか。

## 4. Build & Deploy Commands
```bash
npm run build
npm run deploy
```
※ `npm run deploy` 後、リモートの `gh-pages` に反映されるまで1〜2分待機すること。

## 5. Post-Deploy Verification (デプロイ後の確認)
- リモート反映確認コマンド: `git fetch origin gh-pages && git show origin/gh-pages:index.html`
- ライブ確認: GitHub Pages のURLにアクセスし、`?v=TIMESTAMP` を付与して確認。

## 6. Commit, Tag & Push Rules
- コミット: `vX.Y.Z: 変更概要`
- タグ: `git tag -a vX.Y.Z -m "vX.Y.Z: 変更概要 / Feature summary"` (日本語と英語の併記)
- プッシュ: `git push origin main` および `git push origin vX.Y.Z`

## 7. GitHub Release (リリース作成)
※ Codexの `gh` トークンが無効な場合はスキップしてAntigravityに引き継ぐこと。
- タイトル: `vX.Y.Z: Feature Name / 機能名`
- 本文: `## What's New / 更新内容` 以下に英日併記。
- コマンド: `gh release create vX.Y.Z --title "タイトル" --notes "本文"`

## 8. ZIP Extraction (バックアップ展開先ルール)
※ GitHub Release が作成された場合のみ実行。
- ダウンロード: `gh release download vX.Y.Z --archive zip --output $env:TEMP\comic_translation-vX.Y.Z.zip`
- 展開先: `C:\comic-translation-main` (既存を削除してから配置、二重フォルダに注意)

## 9. Full Workspace Backup (全体バックアップ手順)
※ 全体バックアップが必要な場合のみ。すべての開発・デプロイ完了後に実行。
- 実行コマンド: `powershell -ExecutionPolicy Bypass -File C:\Users\sx717\Antigravity\scripts\backup_full.ps1`

## 10. Rollback Procedure
- Actionsが止まった場合: 空コミットで再トリガー (`git commit --allow-empty -m "Trigger Build"`)
