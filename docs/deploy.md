# Deploy Rules: comic_translation

## Deploy Targets
- GitHub Pages

## Deploy Commands
```bash
npm run build
npm run deploy
```

※「デプロイして」と指示された場合は、ビルド、検証（remote確認）、コミット、タグ作成、リリース作成まで一気通貫で行うワークフロー（`/deploy`）に従うこと。

## Platform-Specific Guardrails (🚨超重要🚨)
- ❌ **`vite.config.js` の `base` を勝手に変更しないこと！**
  - このアプリは `base: '/comic-translation/'` （絶対パス形式）が必須設定として定義されている。他のアプリ（例: Nano Banana Pro）のように `'./'`（相対パス）にしたり、記述を削除したりしてはならない。画面が真っ白になる原因となる。

## Protected Settings
- `vite.config.js` (baseプロパティ関連)

## Not Applicable
- Hugging Face Spaces (HFへのデプロイスクリプト `deploy:hf` や `.git` 保護ルールは**一切不要**)
- Vercel / Netlify / Cloudflare Pages / Firebase Hosting

## Local Deployment Cleanup (ローカル環境同期)
デプロイ（GitHub Releaseの作成・ZIPの検証）完了後、最終工程として必ず以下の処理を行い、ローカルの検証用・運用環境を更新すること。

1. **古い環境の削除**: 既存の `C:\comic-translation-main` ディレクトリを完全に削除する。
   ```powershell
   Remove-Item -Recurse -Force C:\comic-translation-main -ErrorAction SilentlyContinue
   ```
2. **最新版の配置**: 
   最新の `comic-translation-main`（ZIP形式でダウンロード・展開したもの等）を `C:\` 直下に配置（コピー）し、パスが `C:\comic-translation-main` となるようにする。
   ※展開時に `C:\comic-translation-main\comic-translation-main` のような二重フォルダにならないよう注意すること。
