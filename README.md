# AI Comic Translation Tool / AI漫画翻訳ツール

[![Demo / デモ](https://img.shields.io/badge/Demo-Play_Now-blue?style=for-the-badge)](https://furuyan1234.github.io/comic-translation/)

> **"Translate manga into 10 languages with one click."**
> **「漫画をワンクリックで10言語に翻訳する実験的Webアプリケーション」**
>
> [!['AI_Creative_Studio'](https://github.com/user-attachments/assets/d9b97ee9-5051-4f99-8bd3-fb82967d5c12)](https://youtu.be/Ik59dL_zG1s?si=VduXBkmCTGfz51aJ)
>
> Powered by Dual API Architecture (Gemini & OpenAI) — Automatic text extraction, translation, horizontal flip, and image regeneration.
> Gemini & OpenAIのDual APIアーキテクチャを活用し、テキスト抽出・多言語翻訳・左右反転・画像再生成を完全自動化。

---

This project is an experimental tool designed to automate the labor-intensive process of manga translation, typesetting, and redrawing by leveraging the multimodal capabilities of the Gemini API and OpenAI API.
本プロジェクトは、Gemini APIおよびOpenAI APIのマルチモーダル機能を活用し、漫画の翻訳、写植、リドローという労働集約的な作業を自動化することを目的とした実験的ツールです。

## 🚀 Overview / 概要

This tool automates the process of translating manga pages into 10 languages (English, Japanese, Chinese, Korean, French, Spanish, etc.) using a two-stage AI pipeline.
漫画のページをAIの2段階パイプラインで10言語（英語、日本語、中国語、韓国語、フランス語、スペイン語など）に翻訳するツールです。

### Translation Pipeline / 翻訳パイプライン

1. **Text Extraction & Translation / テキスト抽出・翻訳**: The AI engine analyzes the manga image and extracts all text elements (titles, dialogue, SFX, narration) with high-precision translations.
   AIエンジンが漫画画像を解析し、全テキスト要素（タイトル、セリフ、擬音、ナレーション）を高精度で抽出・翻訳します。

2. **Image Regeneration / 画像再生成**: The original image is automatically flipped if required by the target reading order, and the image model regenerates the page with translated text naturally integrated into the artwork.
   翻訳元・翻訳先の読み順に合わせて画像を必要に応じて自動で左右反転し、画像モデルが翻訳テキストを元のアートワークに自然に統合したページを再生成します。

---

## 🏗️ Unique Architecture Highlights / 固有アーキテクチャの要点

This system goes beyond simple machine translation by implementing strict controls to preserve the original artistic intent while adapting to different languages.
本システムは単純な機械翻訳にとどまらず、言語の適応を行いながらもオリジナルの芸術的意図を維持するための厳密な制御を実装しています。

* **Dual API Architecture (Zenith Protocol) / デュアルAPIアーキテクチャ**: Seamlessly switch between two powerful AI engines based on the input API key.
  入力されたAPIキーから自動でエンジンを判別し、ルーティング層を介して処理を切り替えます。
  * **🔵 Gemini Mode (Default)**: Extremely fast processing, zero intervention required. Free to use within Google AI Studio limits. / 圧倒的な処理速度。Google AI Studioの無料枠内で利用可能。
  * **🟢 ChatGPT Mode (OpenAI)**: World-class translation quality, perfectly capturing cultural nuances and character voices (role-language). Note: Uses a pay-as-you-go billing model. / 世界最高峰の翻訳精度。意訳やキャラクターの役割語を完璧に捉えます。※OpenAIの従量課金モデルが適用されます。

* **Context-Aware Multimodal Translation / コンテキストを維持したマルチモーダル翻訳**: Unlike standard OCR+GPT workflows that translate text line-by-line, this tool leverages the AI engine's massive context window and native vision capabilities. It reads the entire manga page as a single cohesive unit, understanding the flow of conversation, character tone, and visual context simultaneously. This prevents awkward literal translations and maintains character voice across the scene.
  単純に文字を抽出して一行ずつ翻訳する従来のOCR＋GPT方式とは異なり、AIエンジンの巨大なコンテキストウィンドウとネイティブな視覚能力（Vision）を活用します。漫画のページ全体をひとつの繋がりとして読み取り、前後の会話の文脈、キャラクターの口調、視覚的な状況（誰がどんな表情で話しているか）を同時に理解することで、直訳による不自然さを防ぎ、シーン全体で一貫したキャラクターのトーンを維持します。

* **Casing Protection Protocol / ケーシング保護プロトコル**: Automatically protects technical strings like URLs, ISBNs, and email addresses in margin text from being forced to ALL CAPS, while maintaining comic-style ALL CAPS for dialogue, titles, and SFX.
  欄外のURL・ISBN・メールアドレス等の技術的文字列が全大文字化されないよう保護しつつ、吹き出し内セリフ・タイトル・擬音はコミックスタイルの大文字を維持します。

* **Automated Image Flip Logic / 自動左右反転ロジック**: Accurately defaults the "Flip Image" switch ON or OFF automatically based on the native reading direction (RTL/LTR) of both input and target translation languages (e.g. Japanese ⇄ English).
  翻訳元・先の言語ごとの本来の読み方向（右から左／左から右）に基づく、自然な左右反転判定アルゴリズムを実装。

* **Iterative Refinement Engine / 反復修正エンジン**: When regenerating images, the system uses the already translated image as a base, allowing users to apply specific correction rules via the instruction builder for true iterative refinement.
  再生成ルール使用時、翻訳済み画像をベースにAPIへ送信し、指示ビルダーを通じて特定の修正ルールを適用することで、真の反復的な修正・改善を可能にします。

* **Anti-Degradation Prompting / 画質劣化防止プロンプト**: Incorporates model-optimized quality preservation instructions to prevent line-art, screen-tone, and color palette degradation during multiple generation passes.
  複数回の生成パスにおける線画・スクリーントーン・カラーパレットの劣化を防ぐため、各モデルに最適化された画質保護プロンプトを組み込んでいます。

---

## ✨ Features / 機能

- **Drag & Drop Input / ドラッグ&ドロップ入力**: Simply drop a manga page image to begin.
- **Editable Translations / 翻訳編集**: Review and modify translations before image generation.
- **Bilingual UI / 完全日英対応UI**: Full English/Japanese support for all buttons, toggles, prompts, and status messages.
- **Download / ダウンロード**: Save the translated image with one click.
- **Session-Only API Key / セッション限定APIキー**: API key is stored in memory only — never saved to disk or localStorage.
- **Universal Prompt Generator / 汎用プロンプト生成**: Generate a copy-paste translation prompt for ChatGPT and other web AI services — no API key required. Supports language selection, flip toggle, and per-service compatibility notes.
  ChatGPTなどのWebサービスで使える翻訳プロンプトをワンクリック生成。APIキー不要。言語選択・反転トグル・サービス別対応状況の注記付き。

---

## 💻 Tech Stack / 技術スタック

* **Frontend**: React 19 / Vite 8 / Vanilla CSS
* **AI Routing**: Zenith Protocol Architecture (Dual Engine Abstraction)
* **LLM/VFM (Gemini)**: `gemini-2.0-flash`, `gemini-flash-latest`, `gemini-1.5-flash`, `gemini-1.5-pro`
* **LLM/VFM (OpenAI)**: `gpt-4o` (Vision), `gpt-4o-mini`, `dall-e-2` (Edit API)
* **Image Processing**: Canvas API (Horizontal Flip / 左右反転処理)
* **Security**: Memory-only API key management (no localStorage, no hardcoding)

---

## 📝 Setup & Launch / セットアップと起動

### 🌍 Cloud / Browser (Deploy)

1. **Get API Key**: Obtain a Gemini API key at [Google AI Studio](https://aistudio.google.com/) or an OpenAI API key at [OpenAI Platform](https://platform.openai.com/).
   [Google AI Studio](https://aistudio.google.com/) で Gemini API キー、または [OpenAI Platform](https://platform.openai.com/) で OpenAI API キーを取得してください。
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

All generations are performed through the **official Google Gemini API and OpenAI API**. This system adheres strictly to the Terms of Service and Forbidden Use Policies of both Google and OpenAI.
本システムはGoogle公式のGemini APIおよびOpenAI公式のAPIを介して動作しており、各社が定める「生成AI禁止事項」および利用規約を厳格に遵守しています。

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

本ツールは漫画翻訳の技術検証および創作支援を目的としたものであり、既存の著作物の無断複製・無断翻訳・無断配布を推奨するものではありません。
This tool is intended for technical verification of manga translation and creative assistance, and does not endorse unauthorized reproduction, translation, or distribution of copyrighted works.

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

#### 1. Nano Banana 2 and ChatGPT Images 2.0 Powered Super AI 4-koma System
A system specialized in creating 4-panel manga with AI. / AIを活用した4コマ漫画制作に特化したシステムです。
- [Explanation / 解説](https://note.com/happy_duck780/n/ndf063558c1f5)
- [Demo / デモ](https://furuyan1234.github.io/nano-banana-pro/)
- [Code / コード](https://github.com/FURUYAN1234/nano-banana-pro)

#### 2. AI Story Maker
A tool for generating creative stories and plots using AI. / AIを用いてクリエイティブなストーリーやプロットを生成するツールです。
- [Explanation / 解説](https://note.com/happy_duck780/n/nd3d972922868)
- [Demo / デモ](https://furuyan1234.github.io/story-maker/)
- [Code / コード](https://github.com/FURUYAN1234/story-maker)

#### 3. AI Character Sheet Maker
An assistant for designing detailed character sheets and settings. / 詳細なキャラクターシートや設定をデザインするための支援ツールです。
- [Explanation / 解説](https://note.com/happy_duck780/n/neccbebd7d957)
- [Demo / デモ](https://furuyan1234.github.io/character-sheet-maker/)
- [Code / コード](https://github.com/FURUYAN1234/character-sheet-maker)

#### 4. AI Comic Translation Tool
A tool for translating manga into 10 languages using AI. / AIを使って漫画を10言語に翻訳するツールです。
- [Explanation / 解説](https://note.com/happy_duck780/n/nbdf826604ce7)
- [Demo / デモ](https://furuyan1234.github.io/comic-translation/)
- [Code / コード](https://github.com/FURUYAN1234/comic-translation)

#### 5. 360° AI Panorama Generator
A tool that generates seamless 360-degree spatial backgrounds to provide background assets for manga and video. / シームレスな360度空間の背景を生成し、漫画や動画の背景素材として提供するツールです。
- [Explanation / 解説](https://note.com/happy_duck780/n/nb53b121fef88)
- [Demo / デモ](https://furuyan1234.github.io/panoforge/)
- [Code / コード](https://github.com/FURUYAN1234/panoforge)

#### 6. AI Voice Comic Maker
A tool to automatically convert static 4-koma manga into fully voiced animated videos. / 静止画の4コマ漫画をフルボイスの動画に自動変換するツールです。
- [Explanation / 解説](https://note.com/happy_duck780/n/ndc6533c1512f)
- [Code / コード](https://github.com/FURUYAN1234/ai-voice-comic-maker)
---

## 🔄 Changelog / 更新履歴

### v1.8.0
- **[Stable Release / Deploy]** Full deploy and version stabilization following the successful unification of the Gemini and OpenAI image generation prompts. The rigid "ART PRESERVATION" constraints have proven to completely eliminate Gemini's layout hallucination and dialogue cross-wiring bugs. All internal proper nouns and temporary comments have been audited and removed prior to deployment. / GeminiとOpenAIの画像生成プロンプトの完全統合が成功し、レイアウト破綻バグが完全に解消されたことを受けての安定版デプロイ。ソースコード内の固有名詞や不要なコメントをクリーンアップし、本番環境へと反映しました。

### v1.7.9
- **[Fix / Prompt]** Completely unified the Gemini image generation prompt with the highly successful OpenAI prompt structure. Visual inspection revealed that the previous Gemini prompt (which prioritized "text erasure" over "art preservation") was causing the Gemini models to aggressively redraw the artwork, leading to completely hallucinated panel layouts and swapped character positions (cross-wiring dialogue bubbles). By strictly enforcing the `ART PRESERVATION (NON-NEGOTIABLE): The output image must be IDENTICAL to the input` constraints identical to the OpenAI prompt, Gemini is now forced to perform a precise text-replacement image editing task without altering the original artwork or spatial relationships. / Geminiの画像生成プロンプトの構造を、完璧な結果を出しているOpenAI側のプロンプト構造に完全に統合・統一しました。画像比較検証により、以前のGeminiプロンプト（アート保護よりもテキスト消去を優先した緩和設定）が原因で、Geminiモデルが「文字を入れるために絵を勝手に描き直す」という暴走状態に陥り、キャラの立ち位置やコマ割りを幻覚してセリフを混線させていたことが発覚しました。今回、OpenAIと同じ「元画像とピクセルレベルで完全一致させよ（アートの改変は一切許さない）」という厳格な制約を復活させたことで、Geminiでも絵を崩さずにテキストだけを正確に差し替える完璧な挙動が復元されました。

### v1.7.8
- **[Model / Layout Accuracy]** Switched the default image generation model from `gemini-3-pro-image-preview` to `gemini-3.1-flash-image-preview`. While the Pro model possesses high overall intelligence, visual verification revealed that its spatial reasoning and layout constraints were too loose, causing it to hallucinate the placement of text and cross-wire dialogues between different panels. The next-generation `gemini-3.1-flash-image-preview` model, however, demonstrated perfect adherence to spatial constraints, flawless mirrored-text erasure, and impeccable placement of translated text into the correct speech bubbles. Therefore, `3.1 Flash` has been designated as the primary default model to ensure optimal layout accuracy. / 画像生成のデフォルトモデルを `gemini-3-pro-image-preview` から `gemini-3.1-flash-image-preview`（次世代Flashモデル）へ変更しました。実機検証の結果、Proモデルは全体の知能は高いものの自由度が高すぎるのか「どのセリフをどの吹き出しに配置するか」という空間配置（レイアウト）の認識が破綻し、コマを跨いでセリフが混線することが判明しました。一方で、次世代アーキテクチャの `3.1 Flash` モデルは、鏡文字の消去、正しい英字の描画、そして「指定されたセリフを指定された吹き出しに完璧に収める」というレイアウト遵守能力において、Proを遥かに凌駕する完璧な結果を出しました。このため、レイアウト精度を最優先し `3.1 Flash` をデフォルトモデルに設定しました。

### v1.7.7
- **[Model / Intelligence]** Changed the default image generation model from the lightweight `gemini-2.5-flash-image` to the highest-tier `gemini-3-pro-image-preview`. Extensive testing revealed that the Flash model lacked the necessary reasoning capabilities (intelligence) to process complex mirrored text replacements, leading to translation abandonment or severe spelling hallucinations regardless of prompt optimization. By switching the default to the highly capable Pro model (equivalent to the tier used in Nano Banana Pro), the AI can now reliably recognize mirrored Japanese text, erase it perfectly, and render accurate English translations without hallucination. / 画像生成のデフォルトモデルを、軽量版の `gemini-2.5-flash-image` から最高推論能力を持つ `gemini-3-pro-image-preview`（Proモデル）に変更しました。度重なる検証の結果、Flashモデルの知能では「裏返しの鏡文字を認識し、それを消去して正しい英語のスペルを配置する」という高度なタスクを処理しきれず、いくらプロンプトを最適化しても翻訳を放棄したりスペルミス（幻覚）を起こしてしまうことが判明したためです。デフォルトを強力なProモデル（Nano Banana Pro等で採用されている同等クラス）に切り替えることで、鏡文字の消去と正確な英字レンダリングが完璧に行われるようになりました。

### v1.7.6
- **[Fix / Prompt]** Completely restructured the Gemini image generation prompt to fix the "Translation Abandonment" and "Hallucination" bugs. Moved "TEXT REPLACEMENT" to the absolute highest priority (STEP 1) and demoted "ARTWORK PRESERVATION" to a secondary rule (STEP 3). Explicitly granted permission to "paint over the inside of speech bubbles with solid white" and strongly commanded the AI to "COPY EXACTLY letter-by-letter". This resolves the issue where `gemini-2.5-flash-image` was too afraid to erase mirrored Japanese text due to strict preservation rules, and eliminates the spelling hallucinations caused by copying mirrored text. / Geminiの画像生成プロンプトの構造を抜本的に再構築し、「翻訳放棄バグ」と「幻覚バグ」を完全に修正しました。「テキストの消去と上書き」を絶対的な最優先事項（STEP 1）に引き上げ、「アートワークの保護」を後回し（STEP 3）にしました。また、「吹き出しの中を白く塗りつぶしてよい」という明確な許可を与え、「一字一句絶対に正確にコピーせよ（COPY EXACTLY）」と強く指示しました。これにより、臆病な `gemini-2.5-flash-image` が鏡文字を消すことを恐れてそのまま出力してしまう問題と、裏返しの文字を写し間違える幻覚（スペルミスや単語の重複）を完全に解決しました。

### v1.7.5
- **[Fix / Prompt]** Completely restored the detailed lettering "know-how" (Preservation Rules & Text Rendering Rules) to the Gemini image generation prompts using precise English. Added a specific "Mirrored Image Alert" to prevent the new `gemini-2.5-flash-image` model from hallucinating or generating garbled text when processing horizontally flipped images containing backwards Japanese text. This resolves the severe text corruption and hallucination issues caused by the oversimplified English rewrite in v1.7.4. / Geminiの画像生成プロンプトに対し、以前まで培われていた「詳細なレタリングのノウハウ（スタッキング絶対禁止、はみ出し許可など）」を英語で一字一句完全に復元しました。さらに、新モデル（`gemini-2.5-flash-image`）が左右反転画像内の「鏡文字」に混乱して幻覚（スペルミスやぐちゃぐちゃな文字）を起こすバグを防ぐため、鏡文字に対する特別警戒指示を追加しました。これにより、v1.7.4の単純化しすぎた英語プロンプトによる翻訳崩壊を根本から解決しました。

### v1.7.4
- **[Fix / Prompt]** Completely rewrote the image generation prompts for Gemini into clear, simple English, and removed overly strict constraints such as "IDENTICAL to the input". The recent shift to the official `gemini-2.5-flash-image` model caused garbled text rendering when using Japanese prompts for English output. However, the previous English prompt caused the model to skip translation entirely due to the strict identity constraint. This new balanced English prompt resolves both the garbled text and the unresponsive behavior, ensuring high-quality translated image generation. / Geminiの画像生成プロンプトを「シンプルで明確な英語」に完全リライトし、「元画像と完全に同一にしろ」といった強すぎる拘束条件を削除しました。最近のモデル（gemini-2.5-flash-image正式版）では、日本語プロンプトで英語を描画させようとすると文字化け（エイリアン語）が発生する劣化が起きていました。一方で前回の英語プロンプトでは拘束が強すぎてAIが翻訳を放棄していましたが、今回のバランスの取れた英語プロンプトにより、文字化けと無反応バグの両方を根本から解決しました。

### v1.7.3
- **[Fix / Prompt]** Reverted the image generation prompt and lettering instructions for Gemini back to Japanese. The overly strict constraints in the English prompt ("IDENTICAL to the input") caused the model to completely skip text replacement and output the original image unchanged. Restoring the proven Japanese prompt resolves this unresponsive behavior and restores proper translation and lettering capabilities. / Geminiの画像生成プロンプトおよびレタリング指示文を実績のある「日本語」へ再度復元しました。英語プロンプト内の「元画像と完全に同一に保つ」という制約が強すぎたため、AIがテキストの置換すら放棄し元画像をそのまま出力してしまう深刻なバグ（無反応バグ）が発生していました。日本語プロンプトに戻すことで、正常な翻訳とレタリング機能が復旧しました。

### v1.7.2
- **[Fix / Prompt]** Re-translated the image generation prompt and lettering instructions for Gemini back to English. This resolves the critical issue where the model rendered garbled CJK/kanji characters inside speech bubbles when using a Japanese prompt, ensuring clean English text rendering. / Geminiの画像生成プロンプトおよびレタリング指示文を「英語」に再設定しました。プロンプトが日本語の際に、モデルが吹き出し内にぐちゃぐちゃな日本語・漢字をレンダリングしてしまっていた深刻なバグが解消され、正常な英語テキストが綺麗に描画されるようになりました。

### v1.7.1
- **[Fix / Prompt]** Restored stable Japanese prompt templates and lettering rules for Gemini image generation models, resolving translation and bubble placement issues introduced in the previous prompt translation. Added error and reject handling to the image-flip function and introduced a 10-second timeout to the diagnostic API connection tool to prevent infinite hangs. / Geminiの画像生成モデルに対する画像生成プロンプトおよびレタリング指示文を実績のある日本語記述へ復元し、前回の英語化で発生していた翻訳やフキダシ配置の不具合を解消しました。また、画像の左右反転処理にエラー検知（reject）を追加し、接続診断ツールには10秒のタイムアウトを設定することで、エラー発生時の無限フリーズバグを修正しました。

### v1.7.0
- **[API / Model]** Hotfixed Gemini image generation model options. Removed the deprecated `gemini-2.5-flash-preview-image` which caused 404 API errors, and designated `gemini-2.5-flash-image` (Stable) as the primary option alongside `gemini-3-pro-image-preview`. / Geminiの画像生成モデルオプションのバグを修正しました。APIの404エラーを引き起こしていた廃止済みの `gemini-2.5-flash-preview-image` を削除し、正式な `gemini-2.5-flash-image`（推奨）を最優先に設定し、`gemini-3-pro-image-preview` を選択肢に追加しました。

### v1.6.9
- **[API / Model]** Updated primary Gemini OCR and translation models to `gemini-3.5-flash` and `gemini-flash-latest` due to model deprecations. Added `gemini-1.5-pro` to the fallback list and implemented a strict 25-second timeout on requests to eliminate infinite hangs and API crash loops. / モデル廃止に伴い、最優先のGemini OCR・翻訳モデルを `gemini-3.5-flash` および `gemini-flash-latest` に更新しました。また、フォールバックモデルとして `gemini-1.5-pro` を追加し、リクエストに25秒のタイムアウト制御を設けることで、応答なしのハングやエラー時のクラッシュループを防止しました。

### v1.6.8
- **[API / Model]** Optimized OpenAI text model fallback sequence based on nano-banana-pro changes. Prioritized `gpt-4.1` for single-text translation and added `gpt-4.1-nano` as backup to ensure higher translation quality and robust fallback logic. / OpenAIのテキスト翻訳モデルのフォールバック順序を最適化しました。`gpt-4.1` を最優先に設定し、バックアップに `gpt-4.1-nano` を追加することで、翻訳品質の向上と安全性を強化しました。

### v1.6.7
- **[API / UI]** Extended OpenAI image generation timeout from 4 minutes to 5 minutes, and updated corresponding wait-time indications to "2-5 minutes". / OpenAI画像生成のタイムアウトを4分から 5分 に延長し、UI上の待ち時間表記を「(2〜5分)」に更新しました。

### v1.6.6
- **[Docs]** Added a prominent Demo link at the top of the README. / READMEの冒頭にデモサイトへのリンクを追加しました。

### v1.6.5
- **[UI]** Renamed the "Full Reset" button in the top right to "API Switch" (API切替) and changed its icon to be more intuitive, as returning to the API gate is primarily used for switching engines or updating keys. / 右上の「全リセット」ボタンを「API切替」ボタンに変更し、アイコンをより直感的なものに変更しました。

### v1.6.4
- **[Logic]** Refined the Casing Protection Protocol. The AI now accurately separates and translates descriptive text (e.g., "Official site:") while still perfectly preserving the exact casing and strings of adjacent URLs, ISBNs, or emails. / Casing Protection Protocol（ケーシング保護プロトコル）のロジックを改善。URL・ISBN・メールアドレスなどの技術的文字列は完全に原文のまま保護しつつ、その前後に付随する説明文（例：「公式サイト：」など）だけを正確に分離して翻訳できるようになりました。

### v1.6.3
- **[Feature]** Added timer to OpenAI image generation (dall-e-2) status bar to display elapsed seconds. / OpenAIの画像生成（dall-e-2）時、ステータスバーに経過秒数を表示するタイマー機能を追加し、進捗状況を可視化しました。

### v1.6.2
- **[Deploy]** Routine maintenance and automated deployment pipeline execution. / メンテナンスと環境同期のための自動デプロイメントパイプラインを実行しました。

### v1.6.1
- **[Docs]** Updated README and UI strings to accurately reflect the Dual API Architecture (Gemini API & OpenAI API) throughout the project, ensuring there are no misleading references to Gemini as the sole engine. / アプリ内UIとREADMEを全面改訂し、Gemini APIとOpenAI APIのDual APIアーキテクチャであることを正確に表記するよう修正しました。

### v1.6.0
- **[Feature]** Dual API Architecture (Gemini + OpenAI): The application now supports both Google Gemini API (default, fast, free tier) and OpenAI API (high-quality, pay-as-you-go). / Dual APIアーキテクチャ（Gemini + OpenAI）に対応しました。入力されたAPIキー（`sk-` プレフィックス）を検知し、内部のルーティング層で自動的に「🔵Geminiモード（無料枠・高速）」と「🟢ChatGPTモード（高品質・従量課金）」を切り替えます。
- **[Integration]** Implemented full pipeline for OpenAI API: `gpt-4o` Vision for text extraction and layout analysis, `gpt-4o-mini` for targeted single-text re-translation, and `dall-e-2` (Edit API) for high-fidelity translated image regeneration. / OpenAI APIのフルパイプラインを実装しました。`gpt-4o` Visionによるテキスト抽出とレイアウト解析、`gpt-4o-mini`による単一テキスト再翻訳、安定版の `dall-e-2` Edit APIによる高精細な画像再生成に対応しています。
- **[UI]** Unified API Gateway UI: Redesigned the start screen with real-time API key detection, dynamic engine badges, and specific key-acquisition links. Removed the universal prompt modal from the Gemini flow to streamline the UI. Added explicit wait-time warnings (2-4 minutes) during OpenAI image generation. / 統合APIゲート画面：APIキーの自動判別、リアルタイムエンジンインジケーター、専用のAPI取得リンクを実装しました。Geminiモードでは不要となった「汎用翻訳プロンプト」を削除し、UIを洗練化。また、処理時間の長いOpenAI画像生成時には待ち時間（2〜4分）の警告を表示するように改善しました。

### v1.5.7
- **[Fix]** Updated dev server configuration in `vite.config.js` to use a strict port (5177). / `vite.config.js`の開発サーバー設定を更新し、ポート番号を5177に固定しました。

### v1.5.6
- **[Prompt Quality]** Major overhaul of the Universal Translation Prompt for ChatGPT/web AI services. Reframed the task as "IMAGE EDITING" instead of "image generation" to drastically reduce art degradation. Added Translation Accuracy Rules: preservation of literary references/wordplay, prohibition of re-interpretation and loose paraphrasing, accurate domain-specific term translation (e.g., 同人誌→doujinshi), and a pre-output verification checklist. Art preservation rules moved to top priority. / ChatGPT等のWebサービス向け汎用翻訳プロンプトを大幅改善。タスクを「画像生成」から「画像編集」に再定義し、アート劣化を大幅に低減。翻訳精度ルールを新設：文学的引用・パロディの保持、再解釈・意訳の禁止、専門用語の正確な翻訳、出力前検証チェックリストを追加。アート保護ルールを最優先に移動。

### v1.5.5
- **[Feature]** Universal Translation Prompt: Added a copy-paste prompt generator for AI web services (ChatGPT, Gemini web) where API-based image editing is unavailable. No API key required. Includes language/flip options, per-service flip compatibility notes, and quality caveats. / 汎用翻訳プロンプト機能を追加。ChatGPTやGemini webなど、APIによる画像編集が不可能なWebサービス向けに、コピペで使える翻訳プロンプトを生成。APIキー不要。サービス別反転対応状況の注記付き。
- **[UI]** Added bilingual labels (JP/EN) to header icon buttons (Universal Prompt, Full Reset) for consistency with other controls. / ヘッダーのアイコンボタン（汎用プロンプト、全リセット）に日英併記のラベルを追加し、他のコントロールとの統一性を向上。

### v1.5.4
- **[UI]** Fixed an issue where the displayed filename overlapped the preview image. / 画像プレビュー表示時に、元ファイル名が画像に被って表示される問題を修正。

### v1.5.3
- **[Docs]** Updated README to reflect technical architecture and ecosystem changes. / READMEを更新し、技術的アーキテクチャの解説追加とエコシステム名称の実態合わせを実施。

### v1.5.2
- **URL/ISBN Casing Protection**: URLs, ISBNs, and email addresses in margin text are now preserved with their original casing instead of being forced to ALL CAPS. Comic-style ALL CAPS is still applied to dialogue, titles, and SFX. / 欄外のURL・ISBN・メールアドレス等の技術的文字列が全大文字化されないよう保護機能を追加。吹き出し内セリフ・タイトル・擬音は従来通りALL CAPSを維持。
- **Pre-applied Casing Control**: Instead of relying on the AI model to decide casing, the translation list now pre-applies ALL CAPS to dialogue/title/SFX items and preserves original casing for other text types, giving deterministic control over text rendering. / ケーシング判断をAIモデル任せにせず、コード側で翻訳リストに事前適用する方式に変更。URLなどのtype:otherは⚠EXACT CASEマーク付きで原文ケーシングを厳密に保護。

### v1.5.1
- **UI Clarification for Regeneration**: Improved button wording and descriptions to clearly indicate whether the regeneration will use the original input image (left) or the already translated image (right) as the base source. / 生成ボタンのラベルの語順と説明文を変更し、左右どちらの画像をベースとして使用するかがより明確に伝わるように改善しました。
- **Auto-reset Regeneration Builder**: The instruction builder now automatically clears its rules and inputs upon a successful image refinement, preventing stale instructions from unintentionally affecting subsequent generations. / 右側の翻訳画像をベースとした再生成（修正指示）が成功した際、次回使用時に以前の指示が意図せず残ったままにならないよう、ビルダーの入力内容を全自動でリセットする仕様に変更しました。

### v1.5.0
- **Regeneration now uses the translated image**: When using regeneration rules, the translated (right-side) image is sent to the API instead of the original, enabling true iterative refinement. / 再生成ルール使用時、翻訳済み画像（右側）をベースにAPIへ送信するように修正。従来は原画を送っていたため修正指示が効かなかった致命的バグを修正。
- **Anti-degradation prompt**: Added Gemini-optimized quality preservation instructions to prevent line-art, screen-tone, and color palette degradation during iterative refinements. / 再生成時の画質劣化防止プロンプトを追加（線画・スクリーントーン・カラーパレットの保護指示）。
- **History restore hint**: Added a visual hint in the regeneration builder reminding users that previous results can be restored from the History panel. / 再生成ビルダーに「📜 履歴から以前の結果に戻せます」のヒントを追加。

### v1.4.8
- Complete UI bilingualization: Full English/Japanese support for all buttons, toggles, prompts, and status messages. / UIの完全な日英併記化（ボタン、トグルスイッチ、メニュー、ステータス表示等すべてを日英対応）。
- Automated Image Flip Logic: Accurately defaults the "Flip Image" switch ON or OFF automatically based on the native reading direction (RTL/LTR) of both input and target translation languages (e.g. Japanese ⇄ Korean, Japanese ⇄ Traditional Chinese). / 翻訳元・先の言語ごとの本来の読み方向（右から左／左から右）に基づく、自然な左右反転スイッチの自動オン・オフ判定アルゴリズムを実装しました。

---

Developed by **FURU**
