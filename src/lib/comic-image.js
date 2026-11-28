const PNG = 'image/png';
const UNREADABLE_IMAGE = '画像データを読み込めませんでした。 / Could not read image data.';

function asDataUrl(mimeType, base64) {
  return `data:${mimeType};base64,${base64}`;
}

function decodeBase64(base64) {
  let bytes;
  try {
    bytes = atob(base64);
  } catch {
    throw new Error(UNREADABLE_IMAGE);
  }
  return bytes;
}

function detectImageMimeType(bytes) {
  if (bytes.startsWith('\x89PNG\r\n\x1a\n')) return PNG;
  if (bytes.startsWith('\xff\xd8\xff')) return 'image/jpeg';
  if (bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

function readImageDataUrl(dataUrl) {
  const match = /^data:(image\/[\w.+-]+);base64,([\s\S]+)$/i.exec(dataUrl);
  if (!match) throw new Error(UNREADABLE_IMAGE);

  const [, declaredMimeType, base64] = match;
  const bytes = decodeBase64(base64);
  const mimeType = detectImageMimeType(bytes);
  return { base64, bytes, mimeType, dataUrl: asDataUrl(mimeType || declaredMimeType, base64) };
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(UNREADABLE_IMAGE));
    image.src = dataUrl;
  });
}

async function renderCanvas(dataUrl, flip = false) {
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

  return canvas;
}

function encodeCanvasPng(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob?.type === PNG && blob.size > 0) resolve(blob);
      else reject(new Error('PNG画像を保存できませんでした。 / Could not encode the PNG image.'));
    }, PNG);
  });
}

function bytesToPng(bytes) {
  const binary = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index++) binary[index] = bytes.charCodeAt(index);
  return new Blob([binary], { type: PNG });
}

function saveBlob(blob, filename) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  try {
    link.hidden = true;
    link.download = filename;
    link.href = url;
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    // Allow the browser to acquire the blob after the click is dispatched.
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

async function renderPngDataUrl(dataUrl, flip) {
  const canvas = await renderCanvas(dataUrl, flip);
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
  const png = await renderPngDataUrl(image.dataUrl, flip);
  return { base64: png.split(',')[1], mimeType: PNG };
}

export async function readTranslatedImage(base64) {
  const mimeType = typeof base64 === 'string' && detectImageMimeType(decodeBase64(base64));
  if (!mimeType) throw new Error(UNREADABLE_IMAGE);

  const dataUrl = asDataUrl(mimeType, base64);
  await loadImage(dataUrl);
  return dataUrl;
}

export async function downloadComicPng({ translated, fileName, targetLanguage }) {
  const image = readImageDataUrl(translated);
  if (!image.mimeType) throw new Error(UNREADABLE_IMAGE);

  const blob = image.mimeType === PNG ? bytesToPng(image.bytes) : await encodeCanvasPng(await renderCanvas(image.dataUrl));
  const stem = (fileName || 'manga').replace(/\.[^.]+$/, '');
  const language = targetLanguage.toUpperCase().replace('-', '_');
  saveBlob(blob, `${stem}_${language}_${Date.now()}.png`);
}
