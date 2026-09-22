export const DEFAULT_CLAWBOT_BASE_URL = 'http://127.0.0.1:18789';

export async function probeClawbot(baseUrl = DEFAULT_CLAWBOT_BASE_URL, fetchImpl = fetch, timeoutMs = 1_200) {
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    return { ok: false, provider: 'clawbot', error: 'clawbotBaseUrl 不是有效 URL' };
  }
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    return { ok: false, provider: 'clawbot', error: 'clawbot 只允许本机回环地址' };
  }
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const response = await fetchImpl(new URL('/health', url).toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: abort.signal,
    });
    return {
      ok: response.status < 500,
      provider: 'clawbot',
      port: Number(url.port || 18789),
      status: response.status,
      listening: true,
    };
  } catch (error) {
    const refused = /ECONNREFUSED|fetch failed|AbortError/i.test(error.message) || error.name === 'AbortError';
    return {
      ok: false,
      provider: 'clawbot',
      port: Number(url.port || 18789),
      listening: false,
      error: refused ? '本机 18789 未在听' : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}
