# AI Comic Translation Tool / AI貍ｫ逕ｻ鄙ｻ險ｳ繝・・繝ｫ

> **"Translate manga into 10 languages with one click."**
> **縲梧ｼｫ逕ｻ繧偵Ρ繝ｳ繧ｯ繝ｪ繝・け縺ｧ10險隱槭↓鄙ｻ險ｳ縺吶ｋ螳滄ｨ鍋噪Web繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ縲・*
>
> Powered by Google Gemini API 窶・Automatic text extraction, translation, horizontal flip, and image regeneration.
> Google Gemini API繧呈ｴｻ逕ｨ縺励√ユ繧ｭ繧ｹ繝域歓蜃ｺ繝ｻ螟夊ｨ隱樒ｿｻ險ｳ繝ｻ蟾ｦ蜿ｳ蜿崎ｻ｢繝ｻ逕ｻ蜒丞・逕滓・繧貞ｮ悟・閾ｪ蜍募喧縲・

---

This project is an experimental tool designed to automate the labor-intensive process of manga translation, typesetting, and redrawing by leveraging the multimodal capabilities of the Gemini API.
譛ｬ繝励Ο繧ｸ繧ｧ繧ｯ繝医・縲；emini API縺ｮ繝槭Ν繝√Δ繝ｼ繝繝ｫ讖溯・繧呈ｴｻ逕ｨ縺励∵ｼｫ逕ｻ縺ｮ鄙ｻ險ｳ縲∝・讀阪√Μ繝峨Ο繝ｼ縺ｨ縺・≧蜉ｴ蜒埼寔邏・噪縺ｪ菴懈･ｭ繧定・蜍募喧縺吶ｋ縺薙→繧堤岼逧・→縺励◆螳滄ｨ鍋噪繝・・繝ｫ縺ｧ縺吶・

## 噫 Overview / 讎りｦ・

This tool automates the process of translating manga pages into 10 languages (English, Japanese, Chinese, Korean, French, Spanish, etc.) using a two-stage AI pipeline.
貍ｫ逕ｻ縺ｮ繝壹・繧ｸ繧但I縺ｮ2谿ｵ髫弱ヱ繧､繝励Λ繧､繝ｳ縺ｧ10險隱橸ｼ郁恭隱槭∵律譛ｬ隱槭∽ｸｭ蝗ｽ隱槭・沒蝗ｽ隱槭√ヵ繝ｩ繝ｳ繧ｹ隱槭√せ繝壹う繝ｳ隱槭↑縺ｩ・峨↓鄙ｻ險ｳ縺吶ｋ繝・・繝ｫ縺ｧ縺吶・

### Translation Pipeline / 鄙ｻ險ｳ繝代う繝励Λ繧､繝ｳ

1. **Text Extraction & Translation / 繝・く繧ｹ繝域歓蜃ｺ繝ｻ鄙ｻ險ｳ**: Gemini text model analyzes the manga image and extracts all text elements (titles, dialogue, SFX, narration) with high-precision translations.
   Gemini繝・く繧ｹ繝医Δ繝・Ν縺梧ｼｫ逕ｻ逕ｻ蜒上ｒ隗｣譫舌＠縲∝・繝・く繧ｹ繝郁ｦ∫ｴ・医ち繧､繝医Ν縲√そ繝ｪ繝輔∵闘髻ｳ縲√リ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ・峨ｒ鬮倡ｲｾ蠎ｦ縺ｧ謚ｽ蜃ｺ繝ｻ鄙ｻ險ｳ縺励∪縺吶・

2. **Image Regeneration / 逕ｻ蜒丞・逕滓・**: The original image is automatically flipped if required by the target reading order, and the Gemini image model regenerates the page with translated text naturally integrated into the artwork.
   鄙ｻ險ｳ蜈・・鄙ｻ險ｳ蜈医・隱ｭ縺ｿ鬆・↓蜷医ｏ縺帙※逕ｻ蜒上ｒ蠢・ｦ√↓蠢懊§縺ｦ閾ｪ蜍輔〒蟾ｦ蜿ｳ蜿崎ｻ｢縺励；emini逕ｻ蜒上Δ繝・Ν縺檎ｿｻ險ｳ繝・く繧ｹ繝医ｒ蜈・・繧｢繝ｼ繝医Ρ繝ｼ繧ｯ縺ｫ閾ｪ辟ｶ縺ｫ邨ｱ蜷医＠縺溘・繝ｼ繧ｸ繧貞・逕滓・縺励∪縺吶・

---

## 女・・Unique Architecture Highlights / 蝗ｺ譛峨い繝ｼ繧ｭ繝・け繝√Ε縺ｮ隕∫せ

This system goes beyond simple machine translation by implementing strict controls to preserve the original artistic intent while adapting to different languages.
譛ｬ繧ｷ繧ｹ繝・Β縺ｯ蜊倡ｴ斐↑讖滓｢ｰ鄙ｻ險ｳ縺ｫ縺ｨ縺ｩ縺ｾ繧峨★縲∬ｨ隱槭・驕ｩ蠢懊ｒ陦後＞縺ｪ縺後ｉ繧ゅが繝ｪ繧ｸ繝翫Ν縺ｮ闃ｸ陦鍋噪諢丞峙繧堤ｶｭ謖√☆繧九◆繧√・蜴ｳ蟇・↑蛻ｶ蠕｡繧貞ｮ溯｣・＠縺ｦ縺・∪縺吶・

* **Casing Protection Protocol / 繧ｱ繝ｼ繧ｷ繝ｳ繧ｰ菫晁ｭｷ繝励Ο繝医さ繝ｫ**: Automatically protects technical strings like URLs, ISBNs, and email addresses in margin text from being forced to ALL CAPS, while maintaining comic-style ALL CAPS for dialogue, titles, and SFX.
  谺・､悶・URL繝ｻISBN繝ｻ繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ遲峨・謚陦鍋噪譁・ｭ怜・縺悟・螟ｧ譁・ｭ怜喧縺輔ｌ縺ｪ縺・ｈ縺・ｿ晁ｭｷ縺励▽縺､縲∝聖縺榊・縺怜・繧ｻ繝ｪ繝輔・繧ｿ繧､繝医Ν繝ｻ謫ｬ髻ｳ縺ｯ繧ｳ繝溘ャ繧ｯ繧ｹ繧ｿ繧､繝ｫ縺ｮ螟ｧ譁・ｭ励ｒ邯ｭ謖√＠縺ｾ縺吶・

* **Automated Image Flip Logic / 閾ｪ蜍募ｷｦ蜿ｳ蜿崎ｻ｢繝ｭ繧ｸ繝・け**: Accurately defaults the "Flip Image" switch ON or OFF automatically based on the native reading direction (RTL/LTR) of both input and target translation languages (e.g. Japanese 竍・English).
  鄙ｻ險ｳ蜈・・蜈医・險隱槭＃縺ｨ縺ｮ譛ｬ譚･縺ｮ隱ｭ縺ｿ譁ｹ蜷托ｼ亥承縺九ｉ蟾ｦ・丞ｷｦ縺九ｉ蜿ｳ・峨↓蝓ｺ縺･縺上∬・辟ｶ縺ｪ蟾ｦ蜿ｳ蜿崎ｻ｢蛻､螳壹い繝ｫ繧ｴ繝ｪ繧ｺ繝繧貞ｮ溯｣・・

* **Iterative Refinement Engine / 蜿榊ｾｩ菫ｮ豁｣繧ｨ繝ｳ繧ｸ繝ｳ**: When regenerating images, the system uses the already translated image as a base, allowing users to apply specific correction rules via the instruction builder for true iterative refinement.
  蜀咲函謌舌Ν繝ｼ繝ｫ菴ｿ逕ｨ譎ゅ∫ｿｻ險ｳ貂医∩逕ｻ蜒上ｒ繝吶・繧ｹ縺ｫAPI縺ｸ騾∽ｿ｡縺励∵欠遉ｺ繝薙Ν繝繝ｼ繧帝壹§縺ｦ迚ｹ螳壹・菫ｮ豁｣繝ｫ繝ｼ繝ｫ繧帝←逕ｨ縺吶ｋ縺薙→縺ｧ縲∫悄縺ｮ蜿榊ｾｩ逧・↑菫ｮ豁｣繝ｻ謾ｹ蝟・ｒ蜿ｯ閭ｽ縺ｫ縺励∪縺吶・

* **Anti-Degradation Prompting / 逕ｻ雉ｪ蜉｣蛹夜亟豁｢繝励Ο繝ｳ繝励ヨ**: Incorporates Gemini-optimized quality preservation instructions to prevent line-art, screen-tone, and color palette degradation during multiple generation passes.
  隍・焚蝗槭・逕滓・繝代せ縺ｫ縺翫￠繧狗ｷ夂判繝ｻ繧ｹ繧ｯ繝ｪ繝ｼ繝ｳ繝医・繝ｳ繝ｻ繧ｫ繝ｩ繝ｼ繝代Ξ繝・ヨ縺ｮ蜉｣蛹悶ｒ髦ｲ縺舌◆繧√；emini縺ｫ譛驕ｩ蛹悶＆繧後◆逕ｻ雉ｪ菫晁ｭｷ繝励Ο繝ｳ繝励ヨ繧堤ｵ・∩霎ｼ繧薙〒縺・∪縺吶・

---

## 笨ｨ Features / 讖溯・

- **Drag & Drop Input / 繝峨Λ繝・げ&繝峨Ο繝・・蜈･蜉・*: Simply drop a manga page image to begin.
- **Editable Translations / 鄙ｻ險ｳ邱ｨ髮・*: Review and modify translations before image generation.
- **Bilingual UI / 螳悟・譌･闍ｱ蟇ｾ蠢弑I**: Full English/Japanese support for all buttons, toggles, prompts, and status messages.
- **Download / 繝繧ｦ繝ｳ繝ｭ繝ｼ繝・*: Save the translated image with one click.
- **Session-Only API Key / 繧ｻ繝・す繝ｧ繝ｳ髯仙ｮ哂PI繧ｭ繝ｼ**: API key is stored in memory only 窶・never saved to disk or localStorage.

---

## 捗 Tech Stack / 謚陦薙せ繧ｿ繝・け

* **Frontend**: React 19 / Vite 8 / Vanilla CSS
* **LLM/VFM**: Google Gemini API (Text: `gemini-2.5-flash`, Image: `gemini-2.5-flash-preview-image`)
* **Image Processing**: Canvas API (Horizontal Flip / 蟾ｦ蜿ｳ蜿崎ｻ｢蜃ｦ逅・
* **Security**: Memory-only API key management (no localStorage, no hardcoding)

---

## 統 Setup & Launch / 繧ｻ繝・ヨ繧｢繝・・縺ｨ襍ｷ蜍・

### 訣 Cloud / Browser (Deploy)

1. **Get API Key**: Obtain a Gemini API key at [Google AI Studio](https://aistudio.google.com/).
   [Google AI Studio](https://aistudio.google.com/) 縺ｧ Gemini API 繧ｭ繝ｼ繧貞叙蠕励＠縺ｦ縺上□縺輔＞縲・
2. **Access**: Open the deployed web app ([Comic Translation Tool](https://furuyan1234.github.io/comic-translation/)) and enter your API key.
   [Web繧｢繝励Μ (繝・Δ繧ｵ繧､繝・](https://furuyan1234.github.io/comic-translation/) 縺ｫ繧｢繧ｯ繧ｻ繧ｹ縺励、PI繧ｭ繝ｼ繧貞・蜉帙＠縺ｦ繧ｹ繧ｿ繝ｼ繝医＠縺ｾ縺吶・

### 捗 Local Launch (Windows) / 繝ｭ繝ｼ繧ｫ繝ｫ縺ｧ縺ｮ襍ｷ蜍・(Windows)

1. **Download**: Download the Source Code (ZIP) from [Releases](../../releases) or click "Code" -> "Download ZIP".
   [Releases](../../releases) 縺ｾ縺溘・ "Code" 繝懊ち繝ｳ縺九ｉZIP繝輔ぃ繧､繝ｫ繧偵ム繧ｦ繝ｳ繝ｭ繝ｼ繝峨＠縺ｾ縺吶・
2. **Unzip**: Extract the ZIP file to any folder.
   繝繧ｦ繝ｳ繝ｭ繝ｼ繝峨＠縺飮IP繝輔ぃ繧､繝ｫ繧定ｧ｣蜃阪＠縺ｦ縺上□縺輔＞縲・
3. **Run**: Double-click `start_comic_transration.bat`.
   繝輔か繝ｫ繝蜀・・ `start_comic_transration.bat` 繧偵ム繝悶Ν繧ｯ繝ｪ繝・け縺励∪縺吶・
   *(Node.js required / 莠句燕縺ｫNode.js縺ｮ繧､繝ｳ繧ｹ繝医・繝ｫ縺悟ｿ・ｦ√〒縺・*
4. **Start**: The system will automatically install dependencies and launch the browser.
   蠢・ｦ√↑繝ｩ繧､繝悶Λ繝ｪ縺瑚・蜍輔う繝ｳ繧ｹ繝医・繝ｫ縺輔ｌ縲√ヶ繝ｩ繧ｦ繧ｶ縺檎ｫ九■荳翫′繧翫∪縺吶・

---

## 笞厄ｸ・Compliance & Legal Stance / 豕慕噪驕ｵ螳医↓縺､縺・※

### Japanese Copyright Law (Article 30-4)

This project is developed in full compliance with **Article 30-4 of the Japanese Copyright Act**, which allows for the exploitation of copyrighted works for information analysis and technological development of AI.
譛ｬ繝励Ο繧ｸ繧ｧ繧ｯ繝医・縲∵律譛ｬ縺ｮ闡嶺ｽ懈ｨｩ豕慕ｬｬ30譚｡縺ｮ4・域ュ蝣ｱ隗｣譫千岼逧・・蛻ｩ逕ｨ・峨↓蝓ｺ縺･縺阪∵橿陦捺､懆ｨｼ縺翫ｈ縺ｳ諠・ｱ隗｣譫舌ｒ逶ｮ逧・→縺励※髢狗匱縺輔ｌ縺ｦ縺翫ｊ縲∵ｳ慕噪縺ｫ驕ｩ豁｣縺ｪ遽・峇蜀・〒蜈ｬ髢九＆繧後※縺・∪縺吶・

### Official API Usage

All generations are performed through the **official Google Gemini API**. This system adheres strictly to Google's "Generative AI Forbidden Use Policy" and Terms of Service.
譛ｬ繧ｷ繧ｹ繝・Β縺ｯGoogle蜈ｬ蠑上・Gemini API繧剃ｻ九＠縺ｦ蜍穂ｽ懊＠縺ｦ縺翫ｊ縲；oogle縺悟ｮ壹ａ繧九檎函謌植I遖∵ｭ｢莠矩・阪♀繧医・蛻ｩ逕ｨ隕冗ｴ・ｒ蜴ｳ譬ｼ縺ｫ驕ｵ螳医＠縺ｦ縺・∪縺吶・

### Translation Purpose

This tool is designed for **translation assistance** of original works by their rightful owners. It is not intended for unauthorized reproduction or distribution of copyrighted material.
譛ｬ繝・・繝ｫ縺ｯ縲∵ｭ｣蠖薙↑讓ｩ蛻ｩ閠・↓繧医ｋ**鄙ｻ險ｳ謾ｯ謠ｴ**繧堤岼逧・→縺励※縺・∪縺吶り送菴懈ｨｩ縺ｮ縺ゅｋ邏譚舌・辟｡險ｱ蜿ｯ隍・｣ｽ繧・・蟶・ｒ諢丞峙縺励◆繧ゅ・縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・

---

## 笞厄ｸ・License & Rights / 繝ｩ繧､繧ｻ繝ｳ繧ｹ繝ｻ讓ｩ蛻ｩ髢｢菫・

* **Source Code**: [MIT License](https://opensource.org/licenses/MIT)
  Applies to software logic and implementation code. / 繧ｽ繝輔ヨ繧ｦ繧ｧ繧｢縺ｮ蜍穂ｽ懊Ο繧ｸ繝・け繧・ｮ溯｣・さ繝ｼ繝峨↓驕ｩ逕ｨ縲・
* **Output Ownership / 逕滓・迚ｩ縺ｮ蟶ｰ螻・*:
  The developer does not claim ownership of content generated by this tool. Rights and responsibilities belong to the user.
  髢狗匱閠・・譛ｬ繝・・繝ｫ縺ｧ逕滓・縺輔ｌ縺溘さ繝ｳ繝・Φ繝・・讓ｩ蛻ｩ繧剃ｸｻ蠑ｵ縺励∪縺帙ｓ縲よｨｩ蛻ｩ縺ｨ雋ｬ莉ｻ縺ｯ繝ｦ繝ｼ繧ｶ繝ｼ縺ｫ蟶ｰ螻槭＠縺ｾ縺吶・

---

## 蛻ｩ逕ｨ隕冗ｴ・/ Terms of Use

### 1. 逶ｮ逧・/ Purpose

譛ｬ繝・・繝ｫ縺ｯ貍ｫ逕ｻ鄙ｻ險ｳ縺ｮ謚陦捺､懆ｨｼ縺翫ｈ縺ｳ蜑ｵ菴懈髪謠ｴ繧堤岼逧・→縺励◆繧ゅ・縺ｧ縺ゅｊ縲∵里蟄倥・闡嶺ｽ懃黄縺ｮ辟｡譁ｭ隍・｣ｽ繝ｻ辟｡譁ｭ鄙ｻ險ｳ繝ｻ辟｡譁ｭ驟榊ｸ・ｒ謗ｨ螂ｨ縺吶ｋ繧ゅ・縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
This tool is intended for technical verification of manga translation and creative assistance, and does not endorse unauthorized reproduction, translation, or distribution of copyrighted works.

---

### 2. 逕滓・繧ｳ繝ｳ繝・Φ繝・↓髢｢縺吶ｋ遖∵ｭ｢莠矩・/ Prohibited Uses

繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ縲∵悽繝・・繝ｫ繧剃ｽｿ逕ｨ縺励※莉･荳九・陦檎ぜ繧定｡後▲縺ｦ縺ｯ縺ｪ繧翫∪縺帙ｓ縲・
Users must not engage in the following:

#### (1) 闡嶺ｽ懈ｨｩ繝ｻ遏･逧・ｲ｡逕｣讓ｩ萓ｵ螳ｳ / Intellectual Property Infringement
- 讓ｩ蛻ｩ閠・・險ｱ蜿ｯ縺ｪ縺冗ｬｬ荳芽・・闡嶺ｽ懃黄繧堤ｿｻ險ｳ繝ｻ驟榊ｸ・☆繧玖｡檎ぜ
- 蝠・･ｭ貍ｫ逕ｻ縺ｮ辟｡譁ｭ鄙ｻ險ｳ迚医ｒ蜈ｬ髢九・雋ｩ螢ｲ縺吶ｋ陦檎ぜ

Translating and distributing copyrighted works without permission from the rights holder.

#### (2) 蜈･蜉帙ョ繝ｼ繧ｿ縺ｮ荳肴ｭ｣蛻ｩ逕ｨ / Misuse of Input Data
- 繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ縲∝・蜉帙☆繧狗判蜒上↓縺､縺・※縲・←豕輔↑讓ｩ蛻ｩ縺ｾ縺溘・菴ｿ逕ｨ險ｱ隲ｾ繧呈怏縺吶ｋ縺薙→繧剃ｿ晁ｨｼ縺吶ｋ繧ゅ・縺ｨ縺励∪縺・
- 讓ｩ蛻ｩ繧呈怏縺励↑縺・ｬｬ荳芽・さ繝ｳ繝・Φ繝・ｒ蜈･蜉帙→縺励※菴ｿ逕ｨ縺吶ｋ陦檎ぜ

Users must have legal rights to all input images.

#### (3) 豕穂ｻ､驕募渚繝ｻ荳肴ｭ｣陦檎ぜ / Illegal Activities
- 驕ｩ逕ｨ縺輔ｌ繧区ｳ穂ｻ､縺ｫ驕募渚縺吶ｋ陦檎ぜ
- 隧先ｬｺ縲∽ｸ肴ｭ｣陦檎ぜ縲√∪縺溘・譛牙ｮｳ縺ｪ逶ｮ逧・〒縺ｮ蛻ｩ逕ｨ

Any illegal or harmful use.

---

### 3. 逕滓・迚ｩ縺ｮ雋ｬ莉ｻ縺翫ｈ縺ｳ讓ｩ蛻ｩ / Responsibility & Ownership

逕滓・縺輔ｌ縺溘さ繝ｳ繝・Φ繝・・蜀・ｮｹ縺翫ｈ縺ｳ蛻ｩ逕ｨ縺ｫ髢｢縺吶ｋ縺吶∋縺ｦ縺ｮ雋ｬ莉ｻ縺ｯ繝ｦ繝ｼ繧ｶ繝ｼ縺ｫ蟶ｰ螻槭＠縺ｾ縺吶・
The user bears full responsibility for generated content.

譛ｬ繝・・繝ｫ縺ｮ蛻ｩ逕ｨ縺ｫ繧医▲縺ｦ逕滓・縺輔ｌ縺溘さ繝ｳ繝・Φ繝・↓縺､縺・※縲・幕逋ｺ閠・・闡嶺ｽ懈ｨｩ縺昴・莉悶・讓ｩ蛻ｩ繧剃ｸｻ蠑ｵ縺励∪縺帙ｓ縺後√◎縺ｮ驕ｩ豕墓ｧ繝ｻ蛻ｩ逕ｨ蜿ｯ閭ｽ諤ｧ繧剃ｿ晁ｨｼ縺吶ｋ繧ゅ・縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
The developer does not claim ownership of generated content but does not guarantee its legality or usability.

---

### 4. 蜈崎ｲｬ莠矩・/ Disclaimer

譛ｬ繝・・繝ｫ縺ｯ縲檎樟迥ｶ譛牙ｧｿ・・S IS・峨阪〒謠蝉ｾ帙＆繧後∵・遉ｺ縺ｾ縺溘・鮟咏､ｺ繧貞撫繧上★縲√＞縺九↑繧倶ｿ晁ｨｼ繧り｡後＞縺ｾ縺帙ｓ縲・
This tool is provided "as is" without any warranties.

髢狗匱閠・・縲∵悽繝・・繝ｫ縺ｮ蛻ｩ逕ｨ縺ｾ縺溘・逕滓・繧ｳ繝ｳ繝・Φ繝・↓襍ｷ蝗縺吶ｋ縺・°縺ｪ繧区錐螳ｳ縺ｫ縺､縺・※繧りｲｬ莉ｻ繧定ｲ縺・∪縺帙ｓ縲・
The developer shall not be liable for any damages arising from use.

---

### 5. 讓ｩ蛻ｩ萓ｵ螳ｳ縺ｸ縺ｮ蟇ｾ蠢・/ Infringement & Takedown

讓ｩ蛻ｩ萓ｵ螳ｳ縺ｮ逕ｳ縺礼ｫ九※縺後≠縺｣縺溷ｴ蜷医・幕逋ｺ閠・・迢ｬ閾ｪ縺ｮ蛻､譁ｭ縺ｫ繧医ｊ莉･荳九・蟇ｾ蠢懊ｒ陦後≧蝣ｴ蜷医′縺ゅｊ縺ｾ縺吶・
Upon receiving a valid claim, the developer may:

- 隧ｲ蠖薙さ繝ｳ繝・Φ繝・・蜑企勁隕∬ｫ九∪縺溘・蜑企勁
- 蛻ｩ逕ｨ縺ｮ蛻ｶ髯舌∪縺溘・遖∵ｭ｢
- 繝ｪ繝昴ず繝医Μ縺ｮ蜈ｬ髢句●豁｢遲峨・謗ｪ鄂ｮ

Remove content, restrict usage, or take necessary actions.

---

### 6. 隕冗ｴ・・螟画峩 / Changes

譛ｬ隕冗ｴ・・莠亥相縺ｪ縺丞､画峩縺輔ｌ繧句ｴ蜷医′縺ゅｊ縺ｾ縺吶・
These terms may be updated without notice.

---

### 7. 貅匁侠豕・/ Governing Law

譛ｬ隕冗ｴ・・譌･譛ｬ豕輔↓貅匁侠縺励∪縺吶・
These terms are governed by the laws of Japan.

---

## AI Manga Creative Suite / AI縺ｾ繧薙′蛻ｶ菴懊お繧ｳ繧ｷ繧ｹ繝・Β

This project is part of an integrated ecosystem designed to support AI-powered manga and story creation.
譛ｬ繝励Ο繧ｸ繧ｧ繧ｯ繝医・縲、I繧呈ｴｻ逕ｨ縺励◆貍ｫ逕ｻ繝ｻ繧ｹ繝医・繝ｪ繝ｼ蛻ｶ菴懊ｒ謾ｯ謠ｴ縺吶ｋ邨ｱ蜷医お繧ｳ繧ｷ繧ｹ繝・Β縺ｮ荳驛ｨ縺ｧ縺吶・

### Ecosystem Components / 讒区・繧ｷ繧ｹ繝・Β

#### 1. Nano Banana 2 and ChatGPT image 2.0 Powered Super AI 4-koma System
A system specialized in creating 4-panel manga with AI.
AI繧呈ｴｻ逕ｨ縺励◆4繧ｳ繝樊ｼｫ逕ｻ蛻ｶ菴懊↓迚ｹ蛹悶＠縺溘す繧ｹ繝・Β縺ｧ縺吶・
- [Explanation / 隗｣隱ｬ](https://note.com/happy_duck780/n/ndf063558c1f5)
- [Demo / 繝・Δ](https://furuyan1234.github.io/nano-banana-pro/)
- [Code / 繧ｳ繝ｼ繝云(https://github.com/FURUYAN1234/nano-banana-pro)

#### 2. AI Story Maker
A tool for generating creative stories and plots using AI.
AI繧堤畑縺・※繧ｯ繝ｪ繧ｨ繧､繝・ぅ繝悶↑繧ｹ繝医・繝ｪ繝ｼ繧・・繝ｭ繝・ヨ繧堤函謌舌☆繧九ヤ繝ｼ繝ｫ縺ｧ縺吶・
- [Explanation / 隗｣隱ｬ](https://note.com/happy_duck780/n/nd3d972922868)
- [Demo / 繝・Δ](https://furuyan1234.github.io/story-maker/)
- [Code / 繧ｳ繝ｼ繝云(https://github.com/FURUYAN1234/story-maker)

#### 3. AI Character Sheet Maker
An assistant for designing detailed character sheets and settings.
隧ｳ邏ｰ縺ｪ繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧ｷ繝ｼ繝医ｄ險ｭ螳壹ｒ繝・じ繧､繝ｳ縺吶ｋ縺溘ａ縺ｮ謾ｯ謠ｴ繝・・繝ｫ縺ｧ縺吶・
- [Explanation / 隗｣隱ｬ](https://note.com/happy_duck780/n/neccbebd7d957)
- [Demo / 繝・Δ](https://furuyan1234.github.io/character-sheet-maker/)
- [Code / 繧ｳ繝ｼ繝云(https://github.com/FURUYAN1234/character-sheet-maker)

#### 4. AI Comic Translation Tool
A tool for translating manga into 10 languages using AI.
AI繧剃ｽｿ縺｣縺ｦ貍ｫ逕ｻ繧・0險隱槭↓鄙ｻ險ｳ縺吶ｋ繝・・繝ｫ縺ｧ縺吶・
- [Explanation / 隗｣隱ｬ](https://note.com/happy_duck780/n/nbdf826604ce7)
- [Demo / 繝・Δ](https://furuyan1234.github.io/comic-translation/)
- [Code / 繧ｳ繝ｼ繝云(https://github.com/FURUYAN1234/comic-translation)

---

## 売 Changelog / 譖ｴ譁ｰ螻･豁ｴ

### v1.5.3 (Current)
- **[Docs]** Updated README to reflect technical architecture and ecosystem changes. / READMEを更新し、技術的アーキテクチャの解説追加とエコシステム名称の実態合わせを実施。

### v1.5.2
- **URL/ISBN Casing Protection**: URLs, ISBNs, and email addresses in margin text are now preserved with their original casing instead of being forced to ALL CAPS. Comic-style ALL CAPS is still applied to dialogue, titles, and SFX. / 谺・､悶・URL繝ｻISBN繝ｻ繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ遲峨・謚陦鍋噪譁・ｭ怜・縺悟・螟ｧ譁・ｭ怜喧縺輔ｌ縺ｪ縺・ｈ縺・ｿ晁ｭｷ讖溯・繧定ｿｽ蜉縲ょ聖縺榊・縺怜・繧ｻ繝ｪ繝輔・繧ｿ繧､繝医Ν繝ｻ謫ｬ髻ｳ縺ｯ蠕捺擂騾壹ｊALL CAPS繧堤ｶｭ謖√・
- **Pre-applied Casing Control**: Instead of relying on the AI model to decide casing, the translation list now pre-applies ALL CAPS to dialogue/title/SFX items and preserves original casing for other text types, giving deterministic control over text rendering. / 繧ｱ繝ｼ繧ｷ繝ｳ繧ｰ蛻､譁ｭ繧但I繝｢繝・Ν莉ｻ縺帙↓縺帙★縲√さ繝ｼ繝牙・縺ｧ鄙ｻ險ｳ繝ｪ繧ｹ繝医↓莠句燕驕ｩ逕ｨ縺吶ｋ譁ｹ蠑上↓螟画峩縲６RL縺ｪ縺ｩ縺ｮtype:other縺ｯ笞EXACT CASE繝槭・繧ｯ莉倥″縺ｧ蜴滓枚繧ｱ繝ｼ繧ｷ繝ｳ繧ｰ繧貞宍蟇・↓菫晁ｭｷ縲・

### v1.5.1
- **UI Clarification for Regeneration**: Improved button wording and descriptions to clearly indicate whether the regeneration will use the original input image (left) or the already translated image (right) as the base source. / 逕滓・繝懊ち繝ｳ縺ｮ繝ｩ繝吶Ν縺ｮ隱樣・→隱ｬ譏取枚繧貞､画峩縺励∝ｷｦ蜿ｳ縺ｩ縺｡繧峨・逕ｻ蜒上ｒ繝吶・繧ｹ縺ｨ縺励※菴ｿ逕ｨ縺吶ｋ縺九′繧医ｊ譏守｢ｺ縺ｫ莨昴ｏ繧九ｈ縺・↓謾ｹ蝟・＠縺ｾ縺励◆縲・
- **Auto-reset Regeneration Builder**: The instruction builder now automatically clears its rules and inputs upon a successful image refinement, preventing stale instructions from unintentionally affecting subsequent generations. / 蜿ｳ蛛ｴ縺ｮ鄙ｻ險ｳ逕ｻ蜒上ｒ繝吶・繧ｹ縺ｨ縺励◆蜀咲函謌撰ｼ井ｿｮ豁｣謖・､ｺ・峨′謌仙粥縺励◆髫帙∵ｬ｡蝗樔ｽｿ逕ｨ譎ゅ↓莉･蜑阪・謖・､ｺ縺梧э蝗ｳ縺帙★谿九▲縺溘∪縺ｾ縺ｫ縺ｪ繧峨↑縺・ｈ縺・√ン繝ｫ繝繝ｼ縺ｮ蜈･蜉帛・螳ｹ繧貞・閾ｪ蜍輔〒繝ｪ繧ｻ繝・ヨ縺吶ｋ莉墓ｧ倥↓螟画峩縺励∪縺励◆縲・

### v1.5.0
- **Regeneration now uses the translated image**: When using regeneration rules, the translated (right-side) image is sent to the API instead of the original, enabling true iterative refinement. / 蜀咲函謌舌Ν繝ｼ繝ｫ菴ｿ逕ｨ譎ゅ∫ｿｻ險ｳ貂医∩逕ｻ蜒擾ｼ亥承蛛ｴ・峨ｒ繝吶・繧ｹ縺ｫAPI縺ｸ騾∽ｿ｡縺吶ｋ繧医≧縺ｫ菫ｮ豁｣縲ょｾ捺擂縺ｯ蜴溽判繧帝√▲縺ｦ縺・◆縺溘ａ菫ｮ豁｣謖・､ｺ縺悟柑縺九↑縺九▲縺溯・蜻ｽ逧・ヰ繧ｰ繧剃ｿｮ豁｣縲・
- **Anti-degradation prompt**: Added Gemini-optimized quality preservation instructions to prevent line-art, screen-tone, and color palette degradation during iterative refinements. / 蜀咲函謌先凾縺ｮ逕ｻ雉ｪ蜉｣蛹夜亟豁｢繝励Ο繝ｳ繝励ヨ繧定ｿｽ蜉・育ｷ夂判繝ｻ繧ｹ繧ｯ繝ｪ繝ｼ繝ｳ繝医・繝ｳ繝ｻ繧ｫ繝ｩ繝ｼ繝代Ξ繝・ヨ縺ｮ菫晁ｭｷ謖・､ｺ・峨・
- **History restore hint**: Added a visual hint in the regeneration builder reminding users that previous results can be restored from the History panel. / 蜀咲函謌舌ン繝ｫ繝繝ｼ縺ｫ縲交沒・螻･豁ｴ縺九ｉ莉･蜑阪・邨先棡縺ｫ謌ｻ縺帙∪縺吶阪・繝偵Φ繝医ｒ霑ｽ蜉縲・

### v1.4.8
- Complete UI bilingualization: Full English/Japanese support for all buttons, toggles, prompts, and status messages. / UI縺ｮ螳悟・縺ｪ譌･闍ｱ菴ｵ險伜喧・医・繧ｿ繝ｳ縲√ヨ繧ｰ繝ｫ繧ｹ繧､繝・メ縲√Γ繝九Η繝ｼ縲√せ繝・・繧ｿ繧ｹ陦ｨ遉ｺ遲峨☆縺ｹ縺ｦ繧呈律闍ｱ蟇ｾ蠢懶ｼ峨・
- Automated Image Flip Logic: Accurately defaults the "Flip Image" switch ON or OFF automatically based on the native reading direction (RTL/LTR) of both input and target translation languages (e.g. Japanese 竍・Korean, Japanese 竍・Traditional Chinese). / 鄙ｻ險ｳ蜈・・蜈医・險隱槭＃縺ｨ縺ｮ譛ｬ譚･縺ｮ隱ｭ縺ｿ譁ｹ蜷托ｼ亥承縺九ｉ蟾ｦ・丞ｷｦ縺九ｉ蜿ｳ・峨↓蝓ｺ縺･縺上∬・辟ｶ縺ｪ蟾ｦ蜿ｳ蜿崎ｻ｢繧ｹ繧､繝・メ縺ｮ閾ｪ蜍輔が繝ｳ繝ｻ繧ｪ繝募愛螳壹い繝ｫ繧ｴ繝ｪ繧ｺ繝繧貞ｮ溯｣・＠縺ｾ縺励◆縲・

---

Developed by **FURU**

