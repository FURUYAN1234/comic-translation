export const OPENAI_IMAGE_PRIMARY = Object.freeze({
  id: 'gpt-image-2.5-sunburst',
  quality: 'xhigh',
  label: 'GPT Image 2.5 Sunburst / xhigh',
});

export const OPENAI_IMAGE_FALLBACK = Object.freeze({
  id: 'gpt-image-2',
  quality: 'high',
  label: 'GPT Image 2.0 / high',
});

export const getOpenAIImageFallbackChain = () => [
  OPENAI_IMAGE_PRIMARY,
  OPENAI_IMAGE_FALLBACK,
];

export const shouldFallbackOpenAIImage = (error) => {
  const message = String(error?.message || '');
  if (error?.name === 'AbortError' || error?.code === 'content_policy_violation' || /timeout|タイムアウト/i.test(message)) {
    return false;
  }

  const status = Number(error?.status || 0);
  if (!status) return true; // Network failures do not include an HTTP response.
  if ([404, 408, 409, 429].includes(status) || status >= 500) return true;
  return status === 400 && /model|quality|unsupported|not supported/i.test(message);
};
