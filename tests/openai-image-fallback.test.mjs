import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getOpenAIImageFallbackChain,
  shouldFallbackOpenAIImage,
} from '../src/lib/openai-image-fallback.js';

test('OpenAI image chain prefers GPT Image 2.5 and retains GPT Image 2.0 as fallback', () => {
  assert.deepEqual(
    getOpenAIImageFallbackChain().map(({ id, quality }) => ({ id, quality })),
    [
      { id: 'gpt-image-2.5-sunburst', quality: 'xhigh' },
      { id: 'gpt-image-2', quality: 'high' },
    ],
  );
});

test('OpenAI image fallback does not bypass timeout or content policy failures', () => {
  assert.equal(shouldFallbackOpenAIImage({ name: 'AbortError' }), false);
  assert.equal(shouldFallbackOpenAIImage(new Error('Timeout (600s)')), false);
  assert.equal(shouldFallbackOpenAIImage({ code: 'content_policy_violation' }), false);
  assert.equal(shouldFallbackOpenAIImage({ status: 401, message: 'invalid API key' }), false);
  assert.equal(shouldFallbackOpenAIImage({ status: 404, message: 'model not found' }), true);
  assert.equal(shouldFallbackOpenAIImage(new Error('model unavailable')), true);
});
