import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { downloadComicPng, prepareComicInput, readTranslatedImage } from '../src/lib/comic-image.js';

const loadFixture = (extension) => readFileSync(new URL(`./fixtures/comic-image.${extension}`, import.meta.url), 'base64');
const png = loadFixture('png');
const jpeg = loadFixture('jpg');
const webp = loadFixture('webp');
const dataUrl = (mimeType, base64) => `data:${mimeType};base64,${base64}`;
const pngUrl = dataUrl('image/png', png);
const jpegUrl = dataUrl('image/jpeg', jpeg);
const webpUrl = dataUrl('image/webp', webp);

function installImageDom(t, { pngEncoding = pngUrl } = {}) {
  const previousImage = globalThis.Image;
  const previousDocument = globalThis.document;
  t.after(() => {
    globalThis.Image = previousImage;
    globalThis.document = previousDocument;
  });
  const knownImages = new Set([pngUrl, jpegUrl, webpUrl]);
  const downloads = [];
  const draws = [];
  const transforms = [];
  globalThis.Image = class {
    set src(url) {
      this.url = url;
      queueMicrotask(() => {
        if (!knownImages.has(url)) {
          this.onerror();
          return;
        }
        this.naturalWidth = 10;
        this.naturalHeight = 6;
        this.onload();
      });
    }
  };
  globalThis.document = {
    createElement(element) {
      if (element === 'a') {
        return {
          click() { downloads.push({ url: this.href, name: this.download }); },
        };
      }
      assert.equal(element, 'canvas');
      return {
        getContext(type) {
          assert.equal(type, '2d');
          return {
            drawImage: (image, x, y) => {
              draws.push({ url: image.url, width: this.width, height: this.height, x, y });
            },
            translate: (x, y) => transforms.push(['translate', x, y]),
            scale: (x, y) => transforms.push(['scale', x, y]),
          };
        },
        toDataURL(type) {
          assert.equal(type, 'image/png');
          return pngEncoding;
        },
      };
    },
  };
  return { downloads, draws, transforms };
}

test('saved results use PNG bytes and the chosen result name and language', async (t) => {
  const { downloads, draws, transforms } = installImageDom(t);
  t.mock.method(Date, 'now', () => 1795827332771);
  const cases = [
    { translated: pngUrl, fileName: 'new.png', targetLanguage: 'en' },
    { translated: dataUrl('image/png', jpeg), fileName: 'first.edition.jpg', targetLanguage: 'zh-TW' },
    { translated: webpUrl, fileName: '', targetLanguage: 'ja' },
  ];
  for (const result of cases) await downloadComicPng(result);
  assert.deepEqual(downloads.map(({ name }) => name), [
    'new_EN_1795827332771.png',
    'first.edition_ZH_TW_1795827332771.png',
    'manga_JA_1795827332771.png',
  ]);
  for (const { url } of downloads) {
    assert.match(url, /^data:image\/png;base64,/);
    assert.equal(Buffer.from(url.split(',')[1], 'base64').subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  }
  assert.equal(downloads[0].url, pngUrl, 'a valid PNG bypasses re-encoding');
  assert.deepEqual(draws, [jpegUrl, webpUrl].map(url => ({ url, width: 10, height: 6, x: 0, y: 0 })));
  assert.deepEqual(transforms, []);
});

test('provider input keeps the actual bytes and MIME unless it must be flipped', async (t) => {
  const { draws, transforms } = installImageDom(t);
  assert.deepEqual(await prepareComicInput(dataUrl('image/png', jpeg)), { base64: jpeg, mimeType: 'image/jpeg' });
  assert.deepEqual(await prepareComicInput(webpUrl), { base64: webp, mimeType: 'image/webp' });
  assert.deepEqual(await prepareComicInput(pngUrl), { base64: png, mimeType: 'image/png' });
  assert.deepEqual(await prepareComicInput(jpegUrl, true), { base64: png, mimeType: 'image/png' });
  assert.deepEqual(draws, [{ url: jpegUrl, width: 10, height: 6, x: 0, y: 0 }]);
  assert.deepEqual(transforms, [['translate', 10, 0], ['scale', -1, 1]]);
});

test('invalid image responses and failed PNG conversion never create a download', async (t) => {
  const { downloads } = installImageDom(t, { pngEncoding: 'data:,' });
  assert.equal(await readTranslatedImage(png), pngUrl);
  assert.equal(await readTranslatedImage(jpeg), jpegUrl);
  assert.equal(await readTranslatedImage(webp), webpUrl);
  await assert.rejects(readTranslatedImage(undefined), /Could not read image data/);
  await assert.rejects(readTranslatedImage('?!bad base64'), /Could not read image data/);
  await assert.rejects(readTranslatedImage('iVBORw0KGgo='), /Could not read image data/);
  await assert.rejects(downloadComicPng({
    translated: dataUrl('image/jpeg', 'ZGF0YQ=='), fileName: 'broken', targetLanguage: 'ja',
  }), /Could not read image data/);
  await assert.rejects(downloadComicPng({
    translated: jpegUrl, fileName: 'sample', targetLanguage: 'ja',
  }), /Could not encode the PNG image/);
  assert.deepEqual(downloads, []);
});
