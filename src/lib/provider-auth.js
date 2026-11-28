import { createApiWorkFetch, throwIfApiWorkCancelled } from './api-work.js';

const endpoints = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  openai: 'https://api.openai.com/v1/models',
};
const providerName = (engine) => engine === 'openai' ? 'OpenAI' : 'Gemini';

export const isApiKeyRejected = (error) => error?.code === 'API_KEY_REJECTED';

export function providerResponseError(engine, httpStatus, error) {
  if (!(httpStatus >= 400) && !error) return null;
  const name = providerName(engine);
  const status = httpStatus >= 400 ? httpStatus : error?.code;
  const reasons = Array.isArray(error?.details) ? error.details.map(detail => detail?.reason) : [];
  const invalid = error?.code === 'invalid_api_key'
    || reasons.includes('API_KEY_INVALID')
    || reasons.includes('API_KEY_EXPIRED')
    || /^API key not valid\b/i.test(error?.message || '');
  const permission = status === 403
    || error?.status === 'PERMISSION_DENIED'
    || error?.code === 'insufficient_permissions'
    || /\bmissing scopes?\b/i.test(error?.message || '');
  if (invalid || (!permission && (status === 401 || error?.status === 'UNAUTHENTICATED'))) {
    return Object.assign(new Error(`${name}がAPIキーを受け付けませんでした。${name}の有効なAPIキーを入力してください。 / API key rejected.`),
      { status, code: 'API_KEY_REJECTED', terminal: true });
  }
  if (permission && error?.code !== 'content_policy_violation') {
    return Object.assign(new Error(`${name} APIのアクセス権限がありません。プロジェクト、キーの制限、モデルの権限を確認してください。 / Permission denied.`),
      { status, code: 'PERMISSION_DENIED' });
  }
  if (status === 429 || error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 'insufficient_quota' || error?.code === 'billing_hard_limit_reached') {
    return Object.assign(new Error(`${name} APIの利用上限に達したか、利用枠がありません。課金設定、残高、レート制限を確認してください。 / API quota or rate limit.${error?.message ? ` ${error.message}` : ''}`),
      { status, code: 'RESOURCE_EXHAUSTED', terminal: error?.code === 'insufficient_quota' || error?.code === 'billing_hard_limit_reached' });
  }
  return Object.assign(new Error(error?.message || `${name} APIエラー（HTTP ${status}）`), { status, code: error?.code });
}

export async function checkProviderKey(engine, key) {
  const name = providerName(engine);
  const headers = engine === 'openai' ? { Authorization: `Bearer ${key}` } : { 'x-goog-api-key': key };
  const fetchForWork = createApiWorkFetch();
  const signal = AbortSignal.timeout(10000);
  let response;
  let body;
  try {
    response = await fetchForWork(endpoints[engine], { headers, signal });
    body = await response.json().catch(error => {
      throwIfApiWorkCancelled(error);
      if (signal.aborted) throw error;
      return null;
    });
  } catch (error) {
    throwIfApiWorkCancelled(error);
    throw new Error(`${name} APIに接続できませんでした。通信環境を確認して再試行してください。 / Could not reach the API.`, { cause: error });
  }

  const error = providerResponseError(engine, response.status, body?.error);
  if (error?.code === 'PERMISSION_DENIED') return false;
  if (error) throw error;
  if (!Array.isArray(engine === 'openai' ? body?.data : body?.models)) {
    throw new Error(`${name} APIの確認で予期しない応答を受け取りました。 / Unexpected API response.`);
  }
  return true;
}
