import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTranslatedImageOAI, setOpenAIApiKey } from '../src/lib/openai.js';
import {
  getOpenAIImageFallbackChain,
} from '../src/lib/openai-image-fallback.js';

test('OpenAI image chain prefers GPT Image 2.6 without a retired-model fallback', () => {
  assert.deepEqual(
    getOpenAIImageFallbackChain().map(({ id, quality }) => ({ id, quality })),
    [
      { id: 'gpt-image-2.6-sunburst', quality: 'xhigh' },
    ],
  );
});

test('the translation path sends 2.6 and the source image together as a single PNG edit request', async (t) => {
  const originalImage = globalThis.Image;
  globalThis.Image = class {
    set src(value) {
      assert.equal(value, 'data:image/png;base64,c291cmNl');
      this.naturalWidth = 1024;
      this.naturalHeight = 1536;
      this.onload();
    }
  };
  t.after(() => { globalThis.Image = originalImage; setOpenAIApiKey(''); });
  setOpenAIApiKey('test-only');
  const send = t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/images/edits');
    assert.equal(init.method, 'POST');
    assert.ok(init.body instanceof FormData);
    assert.equal(init.body.get('model'), 'gpt-image-2.6-sunburst');
    assert.equal(init.body.get('quality'), 'xhigh');
    assert.equal(init.body.get('size'), '1024x1536');
    assert.equal(init.body.get('output_format'), 'png');
    assert.equal(await init.body.get('image').text(), 'source');
    assert.match(init.body.get('prompt'), /GOOD MORNING/);
    return new Response(JSON.stringify({data:[{b64_json:'cmVzdWx0'}]}));
  });
  const result = await generateTranslatedImageOAI('c291cmNl', [
    {original:'おはよう', translated:'Good morning', type:'dialogue'},
  ]);
  assert.equal(send.mock.callCount(), 1);
  assert.equal(result.usedModel, 'gpt-image-2.6-sunburst');
  assert.equal(result.mimeType, 'image/png');
});
