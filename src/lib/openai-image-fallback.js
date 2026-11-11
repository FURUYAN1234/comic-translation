export const OPENAI_IMAGE_PRIMARY = Object.freeze({
  id: 'gpt-image-2.6-sunburst',
  quality: 'xhigh',
  label: 'GPT Image 2.6 Sunburst / xhigh',
});

// GPT Image 2.0 is retired from active routes; provider errors remain visible.
export const getOpenAIImageFallbackChain = () => [OPENAI_IMAGE_PRIMARY];
