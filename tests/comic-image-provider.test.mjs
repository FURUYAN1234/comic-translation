import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createServer } from 'vite';

const fixtures = [
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
].map(([mimeType, extension]) => {
  const bytes = readFileSync(new URL(`./fixtures/comic-image.${extension}`, import.meta.url));
  return { bytes, base64: bytes.toString('base64'), mimeType, extension };
});

const dataUrl = ({ mimeType, base64 }) => `data:${mimeType};base64,${base64}`;
const [png, jpeg, webp] = fixtures;

test('Gemini and OpenAI send the actual format for extraction and image editing', async (t) => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  t.after(() => server.close());
  const gemini = await server.ssrLoadModule('/src/lib/gemini.js');
  const openai = await server.ssrLoadModule('/src/lib/openai.js');
  gemini.setApiKey('test-only');
  openai.setOpenAIApiKey('test-only');
  t.after(() => {
    gemini.setApiKey('');
    openai.setOpenAIApiKey('');
  });

  const sent = [];
  const OriginalImage = globalThis.Image;
  globalThis.Image = class {
    set src(value) {
      sent.push(value);
      this.naturalWidth = 10;
      this.naturalHeight = 6;
      this.onload();
    }
  };
  t.after(() => { globalThis.Image = OriginalImage; });
  t.mock.method(globalThis, 'fetch', async (url, { body }) => {
    if (url.endsWith('/interactions')) {
      const request = JSON.parse(body);
      sent.push(request.input[0]);
      assert.equal(request.response_format.mime_type, 'image/jpeg');
      return Response.json({
        status: 'completed',
        steps: [{ content: [{ type: 'image', data: jpeg.base64, mime_type: jpeg.mimeType }] }],
      });
    }
    if (url.includes(':generateContent?')) {
      sent.push(JSON.parse(body).contents[0].parts[0].inlineData);
      return Response.json({ candidates: [{ content: { parts: [{ text: '[]' }] } }] });
    }
    if (url.endsWith('/chat/completions')) {
      sent.push(JSON.parse(body).messages[0].content.find(part => part.type === 'image_url').image_url.url);
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '[]' } }] });
    }
    assert.equal(url, 'https://api.openai.com/v1/images/edits');
    const image = body.get('image');
    sent.push([image.type, image.name, Buffer.from(await image.arrayBuffer()), body.get('output_format')]);
    return Response.json({ data: [{ b64_json: png.base64 }] });
  });

  for (const image of fixtures) {
    const { base64, mimeType, bytes, extension } = image;
    await gemini.extractTranslations(base64, undefined, 'en', 'ja', mimeType);
    const geminiResult = await gemini.generateTranslatedImage(
      base64, [], 'gemini-nano-banana-2.1', undefined, [], '', 'en', 'ja', false, mimeType,
    );
    await openai.extractTranslationsOAI(base64, undefined, 'en', 'ja', mimeType);
    const openaiResult = await openai.generateTranslatedImageOAI(
      base64, [], undefined, undefined, [], '', 'en', 'ja', true, mimeType,
    );

    assert.deepEqual(sent.splice(0), [
      { mimeType, data: base64 },
      { type: 'image', mime_type: mimeType, data: base64 },
      dataUrl(image),
      dataUrl(image),
      [mimeType, `manga.${extension}`, bytes, 'png'],
    ]);
    assert.equal(geminiResult.mimeType, jpeg.mimeType);
    assert.equal(geminiResult.base64Img, jpeg.base64);
    assert.equal(openaiResult.mimeType, png.mimeType);
    assert.equal(openaiResult.base64Img, png.base64);
  }
});
