const PNG = 'image/png';
const UNREADABLE_IMAGE = '画像データを読み込めませんでした。 / Could not read image data.';

function asDataUrl(mimeType, base64) {
  return `data:${mimeType};base64,${base64}`;
}

function detectImageMimeType(base64) {
  let bytes;
  try {
    bytes = atob(base64);
  } catch {
    throw new Error(UNREADABLE_IMAGE);
  }
  if (bytes.startsWith('\x89PNG\r\n\x1a\n')) return PNG;
  if (bytes.startsWith('\xff\xd8\xff')) return 'image/jpeg';
  if (bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

function readImageDataUrl(dataUrl) {
  const match = /^data:(image\/[\w.+-]+);base64,([\s\S]+)$/i.exec(dataUrl);
  if (!match) throw new Error(UNREADABLE_IMAGE);

  const [, declaredMimeType, base64] = match;
  const mimeType = detectImageMimeType(base64);
  return { base64, mimeType, dataUrl: asDataUrl(mimeType || declaredMimeType, base64) };
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(UNREADABLE_IMAGE));
    image.src = dataUrl;
  });
}

async function renderPng(dataUrl, flip = false) {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('PNG画像を作成できませんでした。 / Could not create the PNG image.');

  if (flip) {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(image, 0, 0);

  const png = canvas.toDataURL(PNG);
  if (!png.startsWith('data:image/png;base64,')) {
    throw new Error('PNG画像を保存できませんでした。 / Could not encode the PNG image.');
  }
  return png;
}

export async function prepareComicInput(dataUrl, flip = false) {
  const image = readImageDataUrl(dataUrl);
  if (!flip && image.mimeType) return { base64: image.base64, mimeType: image.mimeType };

  // Other browser-readable formats and flipped input are rasterized to PNG for the APIs.
  const png = await renderPng(image.dataUrl, flip);
  return { base64: png.split(',')[1], mimeType: PNG };
}

export async function readTranslatedImage(base64) {
  const mimeType = typeof base64 === 'string' && detectImageMimeType(base64);
  if (!mimeType) throw new Error(UNREADABLE_IMAGE);

  const dataUrl = asDataUrl(mimeType, base64);
  await loadImage(dataUrl);
  return dataUrl;
}

export async function downloadComicPng({ translated, fileName, targetLanguage }) {
  const image = readImageDataUrl(translated);
  if (!image.mimeType) throw new Error(UNREADABLE_IMAGE);

  const link = document.createElement('a');
  link.href = image.mimeType === PNG ? image.dataUrl : await renderPng(image.dataUrl);
  const stem = (fileName || 'manga').replace(/\.[^.]+$/, '');
  const language = targetLanguage.toUpperCase().replace('-', '_');
  link.download = `${stem}_${language}_${Date.now()}.png`;
  link.click();
}
