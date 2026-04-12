### 🚀 Key Updates / 主なアップデート

- **Enhanced Instruction Builder / 再生成指示ビルダーの改善**
  Added explicit, context-aware presets (e.g., "Reset speech balloon and redraw") and a customizable free-form template.
  再生成指示ビルダーに、具体的な状況に合わせたプリセット（例：完全白塗り等）と、カッコ内を自由に書き換えられるテンプレートを追加し、AIへの指示がより的確に出しやすくなりました。

- **Fixed Extraction Race Conditions / 抽出処理の非同期バグ（重複）を修正**
  Implemented session management. Dropping a new image while a previous image is still processing will now cleanly cancel the old extraction and prevent text overlaps.
  セッション管理を導入し、前の画像のテキスト解析中に新しい画像をドロップ・投入した場合でも、情報が重なったり溜まったりするバグ（レースコンディション）を完全に防ぐよう修正しました。

- **Improved Click-to-Upload Consistency / 画像クリックによるアップロード操作の統一**
  Made the entire preview image clickable to change files, eliminating the need to click a tiny folder icon. This ensures interaction consistency with the drag-and-drop workflow.
  ドラッグ＆ドロップ時の操作感と統一させるため、読み込み後の画像プレビュー全体をクリックしてファイルを直接選び直せるように改善しました（わざわざ小さなフォルダアイコンを狙ってクリックする必要がなくなりました）。

- **Quick Rules Clear Button / ルール一括クリアボタンの追加**
  Added a dedicated "Clear All" button to easily reset the current generation rules without reloading the file.
  現在の修正ルール（リスト）を1回で全てリセットできる「🧹 全てクリア」ボタンを追加しました。

### 🐞 Bug Fixes / バグ修正
- Allowed free form text insertion without requiring a panel to be targeted.
  ・対象コマにチェックをひとつも入れなくても、自由入力欄のテキストをそのまま（チェックエラーを出さずに）ルールとして追加できるよう修正しました。

### 📦 Downloads / ダウンロード
To update, please download the Source code (zip) below and replace your local files.
アップデートする場合は、以下の Source code (zip) をダウンロードしてローカルフォルダに展開・上書きしてください。
