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

function installImageDom(t, { pngEncoding = pngUrl, clickError } = {}) {
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
  const attached = new Set();
  const objectUrls = new Map();
  const revocations = [];
  const timers = [];
  t.mock.method(URL, 'createObjectURL', blob => {
    const url = 'blob:fixture/' + (objectUrls.size + 1);
    objectUrls.set(url, blob);
    return url;
  });
  t.mock.method(URL, 'revokeObjectURL', url => { revocations.push(url); objectUrls.delete(url); });
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => { timers.push({ callback, delay }); });
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
    body: { append: link => attached.add(link) },
    createElement(element) {
      if (element === 'a') {
        return {
          click() {
            assert.ok(attached.has(this), 'link was attached before browser activation');
            if (clickError) throw clickError;
            assert.match(this.href, /^blob:/);
            downloads.push({ blob: objectUrls.get(this.href), name: this.download });
          },
          remove() { attached.delete(this); },
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
        toBlob(callback, type) {
          assert.equal(type, 'image/png');
          queueMicrotask(() => callback(pngEncoding === 'data:,'
            ? null
            : new Blob([Buffer.from(pngEncoding.split(',')[1], 'base64')], { type })));
        },
        toDataURL(type) {
          assert.equal(type, 'image/png');
          return pngEncoding;
        },
      };
    },
  };
  return { downloads, draws, transforms, attached, objectUrls, revocations, timers };
}

test('saved results use PNG bytes and the chosen result name and language', async (t) => {
  const { downloads, draws, transforms, attached, objectUrls, revocations, timers } = installImageDom(t);
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
  for (const { blob } of downloads) {
    assert.equal(blob.type, 'image/png');
    assert.equal(Buffer.from(await blob.arrayBuffer()).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  }
  assert.deepEqual(Buffer.from(await downloads[0].blob.arrayBuffer()), Buffer.from(png, 'base64'));
  assert.equal(attached.size, 0);
  assert.equal(revocations.length, 0);
  assert.equal(objectUrls.size, 3);
  for (const { callback, delay } of timers) {
    assert.equal(delay, 30_000);
    callback();
  }
  assert.equal(objectUrls.size, 0);
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

test('a failed activation removes the temporary link and still schedules URL cleanup', async t => {
  const error = new Error('fixture click could not start');
  const { attached, timers, objectUrls, downloads } = installImageDom(t, { clickError: error });
  await assert.rejects(downloadComicPng({ translated: pngUrl, fileName: 'first.png', targetLanguage: 'ja' }), error);
  assert.equal(attached.size, 0);
  assert.equal(downloads.length, 0);
  assert.equal(timers.length, 1);
  assert.equal(objectUrls.size, 1);
  timers[0].callback();
  assert.equal(objectUrls.size, 0);
});
