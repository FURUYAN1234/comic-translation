# AI Comic Translation Tool / AI漫画翻訳ツール

> **Translate manga into 10 languages with one click.**
> **漫画をワンクリックで10言語に翻訳する実験的Webアプリケーション。**
>
> Powered by Google Gemini API — Automatic text extraction, translation, horizontal flip, and image regeneration.
> Google Gemini APIを活用し、テキスト抽出・多言語翻訳・左右反転・画像再生成を自動化。

---

## 🚀 Overview / 概要

This tool automates the process of translating manga pages into 10 languages (English, Japanese, Chinese, Korean, French, Spanish, etc.) using a two-stage AI pipeline.
漫画のページをAIの2段階パイプラインで10言語（英語、日本語、中国語、韓国語、フランス語、スペイン語など）に翻訳するツールです。

### Translation Pipeline / 翻訳パイプライン

1. **Text Extraction / テキスト抽出**: Gemini text model analyzes the manga image and extracts all text elements (titles, dialogue, SFX, narration) with translations.
   Geminiテキストモデルが漫画画像を解析し、全テキスト要素（タイトル、セリフ、擬音、ナレーション）を抽出・翻訳します。

2. **Image Generation / 画像生成**: The original image is automatically flipped if required by the target reading order, and the Gemini image model regenerates the page with translated text.
   翻訳元・翻訳先の読み順に合わせて画像を必要に応じて左右反転し、Gemini画像モデルが翻訳テキスト入りのページを再生成します。

---

## ✨ Features / 機能

- **Drag & Drop Input / ドラッグ&ドロップ入力**: Simply drop a manga page image to begin.
- **Automatic Text Detection / 自動テキスト検出**: Detects titles, dialogue, SFX, and narration automatically.
- **Editable Translations / 翻訳編集**: Review and modify translations before image generation.
- **Horizontal Flip / 左右反転**: Automatically flips pages for left-to-right reading order.
- **AI Image Regeneration / AI画像再生成**: Generates translated manga images using Gemini image models.
- **Download / ダウンロード**: Save the translated image with one click.
- **Model Selection / モデル選択**: Choose from multiple Gemini image generation models.
- **Session-Only API Key / セッション限定APIキー**: API key is stored in memory only — never saved to disk or localStorage.

---

## 🔄 Changelog / 更新履歴

### v1.5.1 (Current)
- **UI Clarification for Regeneration**: Improved button wording and descriptions to clearly indicate whether the regeneration will use the original input image (left) or the already translated image (right) as the base source. / 生成ボタンのラベルの語順と説明文を変更し、左右どちらの画像をベースとして使用するかがより明確に伝わるように改善しました。
- **Auto-reset Regeneration Builder**: The instruction builder now automatically clears its rules and inputs upon a successful image refinement, preventing stale instructions from unintentionally affecting subsequent generations. / 右側の翻訳画像をベースとした再生成（修正指示）が成功した際、次回使用時に以前の指示が意図せず残ったままにならないよう、ビルダーの入力内容を全自動でリセットする仕様に変更しました。

### v1.5.0
- **Regeneration now uses the translated image**: When using regeneration rules, the translated (right-side) image is sent to the API instead of the original, enabling true iterative refinement. / 再生成ルール使用時、翻訳済み画像（右側）をベースにAPIへ送信するように修正。従来は原画を送っていたため修正指示が効かなかった致命的バグを修正。
- **Anti-degradation prompt**: Added Gemini-optimized quality preservation instructions to prevent line-art, screen-tone, and color palette degradation during iterative refinements. / 再生成時の画質劣化防止プロンプトを追加（線画・スクリーントーン・カラーパレットの保護指示）。
- **History restore hint**: Added a visual hint in the regeneration builder reminding users that previous results can be restored from the History panel. / 再生成ビルダーに「📜 履歴から以前の結果に戻せます」のヒントを追加。

### v1.4.8
- Complete UI bilingualization: Full English/Japanese support for all buttons, toggles, prompts, and status messages. / UIの完全な日英併記化（ボタン、トグルスイッチ、メニュー、ステータス表示等すべてを日英対応）。
- Automated Image Flip Logic: Accurately defaults the "Flip Image" switch ON or OFF automatically based on the native reading direction (RTL/LTR) of both input and target translation languages (e.g. Japanese ⇄ Korean, Japanese ⇄ Traditional Chinese). / 翻訳元・先の言語ごとの本来の読み方向（右から左／左から右）に基づく、自然な左右反転スイッチの自動オン・オフ判定アルゴリズムを実装しました。
- Manual Flip Override: Once manually set by the user, the Flip preference locks in and refuses to be overwritten by the auto-detection feature during generation. / 左右反転トグルを手動で操作した場合、言語判定機能による自動書き換えからユーザー操作を優先して保護する機能を追加しました。
- UI Responsiveness Updates: Simplified state locks on specific processes, removing stale states closures from previous versions. / 古い言語設定の引き継ぎバグなどを完全に修正・排除しました。

### v1.2.4

### v1.2.3
- Added specific presets and templates to the regeneration instruction builder. / 再生成指示ビルダーに詳細なプリセットと自由記述用のテンプレートを追加しました。
- Implemented extraction session management to prevent text overlap bugs when dropping new images during processing. / 抽出中の別画像ドロップによるテキスト情報の累積・混在バグを防ぐためのセッション管理を実装しました。
- Made the entire loaded image clickable for changing files (consistent with drag-and-drop behavior). / ドラッグ＆ドロップと一貫性を持たせるため、読込後のプレビュー画像全体のクリックでファイル変更ができるように改善しました。
- Added a "Clear All" button to easily reset the instruction list. / 指示リストを簡単にリセットするための「全てクリア」ボタンを追加しました。

---

## 💻 Tech Stack / 技術スタック

* **Frontend**: React 19 / Vite 8 / Vanilla CSS
* **AI Models**: Google Gemini API (Text: gemini-2.5-flash, Image: gemini-2.5-flash-preview-image)
* **Image Processing**: Canvas API (horizontal flip)
* **Security**: Memory-only API key management (no localStorage, no hardcoding)

---

## 📝 Setup & Launch / セットアップと起動

### 🌍 Cloud / Browser (Deploy)

1. **Get API Key**: Obtain a Gemini API key at [Google AI Studio](https://aistudio.google.com/).
   [Google AI Studio](https://aistudio.google.com/) で Gemini API キーを取得してください。
2. **Access**: Open the deployed web app ([Comic Translation Tool](https://furuyan1234.github.io/comic-translation/)) and enter your API key.
   [Webアプリ (デモサイト)](https://furuyan1234.github.io/comic-translation/) にアクセスし、APIキーを入力してスタートします。

### 💻 Local Launch (Windows) / ローカルでの起動 (Windows)

1. **Download**: Download the Source Code (ZIP) from [Releases](../../releases) or click "Code" -> "Download ZIP".
   [Releases](../../releases) または "Code" ボタンからZIPファイルをダウンロードします。
2. **Unzip**: Extract the ZIP file to any folder.
   ダウンロードしたZIPファイルを解凍してください。
3. **Run**: Double-click `start_comic_transration.bat`.
   フォルダ内の `start_comic_transration.bat` をダブルクリックします。
   *(Node.js required / 事前にNode.jsのインストールが必要です)*
4. **Start**: The system will automatically install dependencies and launch the browser.
   必要なライブラリが自動インストールされ、ブラウザが立ち上がります。

---

## ⚖️ Compliance & Legal Stance / 法的遵守について

### Japanese Copyright Law (Article 30-4)

This project is developed in full compliance with **Article 30-4 of the Japanese Copyright Act**, which allows for the exploitation of copyrighted works for information analysis and technological development of AI.
本プロジェクトは、日本の著作権法第30条の4（情報解析目的の利用）に基づき、技術検証および情報解析を目的として開発されており、法的に適正な範囲内で公開されています。

### Official API Usage

All generations are performed through the **official Google Gemini API**. This system adheres strictly to Google's "Generative AI Forbidden Use Policy" and Terms of Service.
本システムはGoogle公式のGemini APIを介して動作しており、Googleが定める「生成AI禁止事項」および利用規約を厳格に遵守しています。

### Translation Purpose

This tool is designed for **translation assistance** of original works by their rightful owners. It is not intended for unauthorized reproduction or distribution of copyrighted material.
本ツールは、正当な権利者による**翻訳支援**を目的としています。著作権のある素材の無許可複製や配布を意図したものではありません。

---

## ⚖️ License & Rights / ライセンス・権利関係

* **Source Code**: [MIT License](https://opensource.org/licenses/MIT)
  Applies to software logic and implementation code. / ソフトウェアの動作ロジックや実装コードに適用。
* **Output Ownership / 生成物の帰属**:
  The developer does not claim ownership of content generated by this tool. Rights and responsibilities belong to the user.
  開発者は本ツールで生成されたコンテンツの権利を主張しません。権利と責任はユーザーに帰属します。

---

## 利用規約 / Terms of Use

### 1. 目的 / Purpose

本ツールは漫画翻訳の支援を目的としたものであり、既存の著作物の無断複製・無断翻訳・無断配布を推奨するものではありません。
This tool is intended for manga translation assistance and does not endorse unauthorized reproduction, translation, or distribution of copyrighted works.

---

### 2. 生成コンテンツに関する禁止事項 / Prohibited Uses

ユーザーは、本ツールを使用して以下の行為を行ってはなりません。
Users must not engage in the following:

#### (1) 著作権・知的財産権侵害 / Intellectual Property Infringement
- 権利者の許可なく第三者の著作物を翻訳・配布する行為
- 商業漫画の無断翻訳版を公開・販売する行為

Translating and distributing copyrighted works without permission from the rights holder.

#### (2) 入力データの不正利用 / Misuse of Input Data
- ユーザーは、入力する画像について、適法な権利または使用許諾を有することを保証するものとします
- 権利を有しない第三者コンテンツを入力として使用する行為

Users must have legal rights to all input images.

#### (3) 法令違反・不正行為 / Illegal Activities
- 適用される法令に違反する行為
- 詐欺、不正行為、または有害な目的での利用

Any illegal or harmful use.

---

### 3. 生成物の責任および権利 / Responsibility & Ownership

生成されたコンテンツの内容および利用に関するすべての責任はユーザーに帰属します。
The user bears full responsibility for generated content.

本ツールの利用によって生成されたコンテンツについて、開発者は著作権その他の権利を主張しませんが、その適法性・利用可能性を保証するものではありません。
The developer does not claim ownership of generated content but does not guarantee its legality or usability.

---

### 4. 免責事項 / Disclaimer

本ツールは「現状有姿（AS IS）」で提供され、明示または黙示を問わず、いかなる保証も行いません。
This tool is provided "as is" without any warranties.

開発者は、本ツールの利用または生成コンテンツに起因するいかなる損害についても責任を負いません。
The developer shall not be liable for any damages arising from use.

---

### 5. 権利侵害への対応 / Infringement & Takedown

権利侵害の申し立てがあった場合、開発者は独自の判断により以下の対応を行う場合があります。
Upon receiving a valid claim, the developer may:

- 該当コンテンツの削除要請または削除
- 利用の制限または禁止
- リポジトリの公開停止等の措置

Remove content, restrict usage, or take necessary actions.

---

### 6. 規約の変更 / Changes

本規約は予告なく変更される場合があります。
These terms may be updated without notice.

---

### 7. 準拠法 / Governing Law

本規約は日本法に準拠します。
These terms are governed by the laws of Japan.

---

## AI Manga Creative Suite / AIまんが制作エコシステム

This project is part of an integrated ecosystem designed to support AI-powered manga and story creation.
本プロジェクトは、AIを活用した漫画・ストーリー制作を支援する統合エコシステムの一部です。

### Ecosystem Components / 構成システム

#### 1. Nano Banana 2 Powered Super AI 4-koma System
A system specialized in creating 4-panel manga with AI.
AIを活用した4コマ漫画制作に特化したシステムです。
- [Explanation / 解説](https://note.com/happy_duck780/n/ndf063558c1f5)
- [Demo / デモ](https://furuyan1234.github.io/nano-banana-pro/)
- [Code / コード](https://github.com/FURUYAN1234/nano-banana-pro)

#### 2. AI Story Maker
A tool for generating creative stories and plots using AI.
AIを用いてクリエイティブなストーリーやプロットを生成するツールです。
- [Explanation / 解説](https://note.com/happy_duck780/n/nd3d972922868)
- [Demo / デモ](https://furuyan1234.github.io/story-maker/)
- [Code / コード](https://github.com/FURUYAN1234/story-maker)

#### 3. AI Character Sheet Maker
An assistant for designing detailed character sheets and settings.
詳細なキャラクターシートや設定をデザインするための支援ツールです。
- [Explanation / 解説](https://note.com/happy_duck780/n/neccbebd7d957)
- [Demo / デモ](https://furuyan1234.github.io/character-sheet-maker/)
- [Code / コード](https://github.com/FURUYAN1234/character-sheet-maker)

#### 4. AI Comic Translation Tool
A tool for translating manga into 10 languages using AI.
AIを使って漫画を10言語に翻訳するツールです。
- [Explanation / 解説](https://note.com/happy_duck780/n/nbdf826604ce7)
- [Demo / デモ](https://furuyan1234.github.io/comic-translation/)
- [Code / コード](https://github.com/FURUYAN1234/comic-translation)

---

Developed by **FURU**
