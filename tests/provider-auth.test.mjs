import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { beginApiWork, isApiWorkCancelled, isCurrentApiWork } from '../src/lib/api-work.js';
import { prepareComicInput, readTranslatedImage } from '../src/lib/comic-image.js';
import { extractTranslations, generateTranslatedImage, setApiKey } from '../src/lib/gemini.js';
import { getLanguageInfo } from '../src/lib/languages.js';
import { checkProviderKey, isApiKeyRejected } from '../src/lib/provider-auth.js';

const invalidKey = 'fixture-invalid-key';
const validKey = 'fixture-accepted-key';
const restrictedKey = 'sk-fixture-restricted-key';
const invalidGemini = () => Response.json({
  error: {
    code: 400,
    status: 'INVALID_ARGUMENT',
    message: 'API key not valid. Fixture echo: ' + invalidKey,
    details: [{ reason: 'API_KEY_INVALID' }],
  },
}, { status: 400 });

test('key check uses models endpoints and distinguishes rejection, permission, quota, and transport failures', async (t) => {
  beginApiWork();
  let reply = () => Response.json({ models: [] });
  const requested = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requested.push([url, options.headers]);
    assert.ok(!options.method || options.method === 'GET');
    assert.equal(options.body, undefined);
    return reply();
  });

  assert.equal(await checkProviderKey('gemini', validKey), true);
  assert.deepEqual(requested.pop(), ['https://generativelanguage.googleapis.com/v1beta/models', { 'x-goog-api-key': validKey }]);
  reply = invalidGemini;
  await assert.rejects(checkProviderKey('gemini', invalidKey), error => {
    assert.ok(isApiKeyRejected(error));
    assert.match(error.message, /GeminiがAPIキーを受け付けませんでした/);
    assert.ok(!error.message.includes(invalidKey));
    return true;
  });
  reply = () => Response.json({ error: { status: 'PERMISSION_DENIED' } }, { status: 403 });
  assert.equal(await checkProviderKey('gemini', validKey), false);
  assert.equal(await checkProviderKey('openai', restrictedKey), false);
  assert.deepEqual(requested.pop(), ['https://api.openai.com/v1/models', { Authorization: 'Bearer ' + restrictedKey }]);

  reply = () => Response.json({ data: [] });
  assert.equal(await checkProviderKey('openai', restrictedKey), true);
  reply = () => Response.json({ error: { message: 'Missing scopes: api.models.read' } }, { status: 401 });
  assert.equal(await checkProviderKey('openai', restrictedKey), false);
  reply = () => Response.json({ error: { code: 'invalid_api_key' } }, { status: 401 });
  await assert.rejects(checkProviderKey('openai', restrictedKey), isApiKeyRejected);
  reply = () => Response.json({ error: { status: 'RESOURCE_EXHAUSTED' } }, { status: 429 });
  await assert.rejects(checkProviderKey('gemini', validKey), error => (
    error.code === 'RESOURCE_EXHAUSTED' && /利用上限/.test(error.message)
  ));
  reply = () => { throw new TypeError('transport fixture'); };
  await assert.rejects(checkProviderKey('gemini', validKey), /通信環境を確認/);
  reply = () => Response.json({ message: 'unexpected' });
  await assert.rejects(checkProviderKey('gemini', validKey), /予期しない応答/);
});

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
function appFunction(name) {
  const start = app.indexOf('  const ' + name + ' = ');
  const end = app.indexOf('\n  };', start);
  assert.ok(start >= 0 && end > start, 'could not locate ' + name);
  return app.slice(start, end + '\n  };'.length);
}
function invoke(name, state, args = []) {
  const functions = ['reportApiError', name].map(appFunction).join('\n');
  return vm.runInNewContext('(() => {\n' + functions + '\nreturn ' + name + '(...args);\n})()', { ...state, needsApiKey: state.connectionStatus === 'rejected', args });
}

test('the app waits for key verification, preserves a portrait page on rejection, and permits extraction and generation after re-entry', async (t) => {
  const portrait = readFileSync(new URL('./fixtures/portrait-comic.png', import.meta.url), 'base64');
  const original = 'data:image/png;base64,' + portrait;
  const errorMessages = [];
  const statuses = [];
  const operations = [];
  const rows = [{ original: '灯台', translated: 'Lighthouse', type: 'dialogue', panel: '1コマ目' }];
  const model = 'gemini-nano-banana-2.1';
  const state = {
    apiKeyInput: invalidKey, isUnlocked: false, connectionStatus: null, isCheckingApiKey: false,
    apiKeyCheckPending: { current: false }, originalImage: original, originalFileName: 'portrait-comic.png',
    sourceLanguage: 'ja', targetLanguage: 'en', flipEnabled: false, textModel: 'gpt-6-luna',
    engineMode: 'gemini', selectedModel: model, isGenerating: false, imageResult: null, translatedImage: null,
    translations: [], instructionRules: [], customPrompt: '', extractionSessionRef: { current: 0 },
    startAiWork: beginApiWork, isCurrentApiWork, isApiWorkCancelled, checkProviderKey, isApiKeyRejected,
    getLanguageInfo, prepareComicInput, readTranslatedImage,
    extractTranslationsAI: extractTranslations, generateTranslatedImageAI: generateTranslatedImage,
    setApiKey, setOpenAIApiKey() {}, setActiveEngine() {}, setApiBusy() {}, setIsExtracting() {},
    setIsGenerating() {}, setShowBuilder() {}, setPanelLayout() {},
    setTranslations(value) { state.translations = value; },
    setErrorMessage(value) { errorMessages.push(value); },
    setConnectionStatus(value) { state.connectionStatus = value; },
    setIsCheckingApiKey(value) { state.isCheckingApiKey = value; },
    setApiKeyInput(value) { state.apiKeyInput = value; },
    setEngineMode(value) { state.engineMode = value; },
    setIsUnlocked(value) { state.isUnlocked = value; },
    setImageResult(value) { state.imageResult = value; },
    setHistory() {},
    showStatus(value) { statuses.push(value); },
  };
  const pageSettings = () => [
    state.originalImage, state.originalFileName, state.sourceLanguage,
    state.targetLanguage, state.selectedModel, state.textModel, state.flipEnabled,
  ];
  const initial = pageSettings();

  let runtimeKeyRejects = true;
  let delayedModels;
  let delayNext = true;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    operations.push(url);
    assert.ok(!url.includes('?key='));
    const key = options.headers['x-goog-api-key'];
    if (url.endsWith('/models')) {
      if (delayNext) {
        delayNext = false;
        return new Promise(resolve => { delayedModels = resolve; });
      }
      if (runtimeKeyRejects) return Response.json({ error: { status: 'PERMISSION_DENIED' } }, { status: 403 });
      return Response.json({ models: [{ name: 'models/gemini-3.8-flash' }] });
    }
    assert.equal(key, validKey);
    if (runtimeKeyRejects) return invalidGemini();
    const request = JSON.parse(options.body);
    if (url.endsWith(':generateContent')) {
      assert.deepEqual(request.contents[0].parts[0].inlineData, { mimeType: 'image/png', data: portrait });
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        layout: { type: '4koma', panels: ['1コマ目', '2コマ目', '3コマ目', '4コマ目'] },
        detectedLanguage: 'ja',
        texts: rows,
      }) }] } }] });
    }
    assert.ok(url.endsWith('/interactions'));
    assert.equal(request.model, model);
    assert.equal(request.input[0].data, portrait);
    assert.match(request.input[1].text, /Lighthouse/i);
    return Response.json({ steps: [{ content: [{ type: 'image', mime_type: 'image/png', data: portrait }] }] });
  });

  const previousImage = globalThis.Image;
  t.after(() => { globalThis.Image = previousImage; setApiKey(''); });
  globalThis.Image = class {
    set src(url) {
      assert.equal(url, original);
      this.naturalWidth = 6;
      this.naturalHeight = 10;
      this.onload();
    }
  };

  const submit = invoke('handleApiKeySubmit', state);
  assert.equal(state.isCheckingApiKey, true);
  assert.equal(state.isUnlocked, false);
  assert.equal(statuses.length, 0);
  await invoke('handleApiKeySubmit', state);
  assert.equal(operations.length, 1);
  delayedModels(invalidGemini());
  await submit;
  assert.equal(state.isUnlocked, false);
  assert.match(errorMessages.at(-1), /GeminiがAPIキーを受け付けませんでした/);

  state.apiKeyInput = validKey;
  await invoke('handleApiKeySubmit', state);
  assert.equal(state.isUnlocked, true);
  assert.equal(state.connectionStatus, 'unverified');
  assert.match(statuses.at(-1), /モデル一覧の権限/);
  assert.deepEqual(pageSettings(), initial);

  await invoke('runExtraction', state);
  assert.equal(state.connectionStatus, 'rejected');
  assert.match(errorMessages.at(-1), /GeminiがAPIキーを受け付けませんでした/);
  assert.equal(operations.filter(url => url.endsWith(':generateContent')).length, 1);
  assert.deepEqual(pageSettings(), initial);

  invoke('handleRetryApiKey', state);
  assert.equal(state.isUnlocked, false);
  assert.deepEqual(pageSettings(), initial);
  state.apiKeyInput = validKey;
  runtimeKeyRejects = false;
  await invoke('handleApiKeySubmit', state);
  assert.equal(state.isUnlocked, true);
  assert.match(statuses.at(-1), /「テキスト再抽出」/);
  assert.equal(operations.filter(url => url.endsWith(':generateContent')).length, 1, 're-entry does not send an image operation');
  assert.deepEqual(pageSettings(), initial);

  const extracted = await invoke('runExtraction', state);
  assert.equal(extracted.targetLanguage, 'en');
  assert.deepEqual(extracted.rows, rows);
  const generated = await invoke('handleGenerate', state);
  assert.equal(generated.model, model);
  assert.equal(generated.imageData, original);
  assert.equal(state.imageResult.fileName, state.originalFileName);
  assert.deepEqual(pageSettings(), initial);
});
