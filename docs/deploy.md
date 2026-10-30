# Deploy Rules: comic_translation

共通手順の正本は `C:\Users\sx717\Antigravity\docs\unified_release_completion.md`、契約は `scripts\release-apps.json` の `comic_translation`、実行入口は `scripts\publish_app_release.ps1` である。

- GitHub Pages、GitHub Release、GitHub source ZIP由来の `C:\comic-translation-main`、最終公開検証を共通レシートで完遂する。
- Hugging Faceは対象外。
- 警告0のlintは共通transactionのapp validationとして必須。
- フルバックアップは別の明示操作であり、自動開始しない。

```powershell
powershell -ExecutionPolicy Bypass -File ..\scripts\publish_app_release.ps1 -App comic_translation -NotesPath <absolute-vX.Y.Z.md> -ReleaseTitle "Comic Translation Tool vX.Y.Z"
```

## Third-party notices / 第三者通知

- Normal Vite builds emit `THIRD_PARTY_NOTICES.txt` from installed dependency license files. `npm run build` also verifies the distributed notices, locked versions and unchanged FURU license. / 通常のViteビルドで依存パッケージのライセンス原文から通知を出力します。`npm run build` は通知全文、ロック版、FURU独自ライセンスの保持も検査します。
- After a dependency update, run `npm run licenses:generate` and commit the reviewed source notice with the lockfile. New runtime dependencies or changed license metadata require notice coverage review. / 依存更新時は `npm run licenses:generate` を実行し、内容を確認した通知をロックファイルとともにコミットしてください。新しい実行時依存やライセンス種別の変更は通知の対象確認が必要です。
- After publication, retrieve `THIRD_PARTY_NOTICES.txt` and `LICENSE.txt` from Pages and check the source ZIP notice against the same build. / 公開後はPagesの両通知とソースZIP内の通知を同じビルドと照合してください。
