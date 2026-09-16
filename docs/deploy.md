# Deploy Rules: comic_translation

共通手順の正本は `C:\Users\sx717\Antigravity\docs\unified_release_completion.md`、契約は `scripts\release-apps.json` の `comic_translation`、実行入口は `scripts\publish_app_release.ps1` である。

- GitHub Pages、GitHub Release、GitHub source ZIP由来の `C:\comic-translation-main`、最終公開検証を共通レシートで完遂する。
- Hugging Faceは対象外。
- 警告0のlintは共通transactionのapp validationとして必須。
- フルバックアップは別の明示操作であり、自動開始しない。

```powershell
powershell -ExecutionPolicy Bypass -File ..\scripts\publish_app_release.ps1 -App comic_translation -NotesPath <absolute-vX.Y.Z.md> -ReleaseTitle "Comic Translation Tool vX.Y.Z"
```
