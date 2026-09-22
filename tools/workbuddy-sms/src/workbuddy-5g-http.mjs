import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const WORKBUDDY_5G_HTTP = Object.freeze({
  production: 'https://5gvas01.cmicmaap.com/gtw-ai/workbuddy/api',
  test: 'https://cmic-maap-ums.cmmaap.com:5443/gtw-ai/workbuddy/api',
  local: 'http://127.0.0.1:8080/workbuddy/api',
});

export function fiveGHttpBase(env = 'production') {
  return WORKBUDDY_5G_HTTP[env] || WORKBUDDY_5G_HTTP.production;
}

export function loadFiveGCallbackKey() {
  if (process.env.WORKBUDDY_5G_CALLBACK_KEY) return process.env.WORKBUDDY_5G_CALLBACK_KEY;
  const file = process.env.MAAP_API_KEY_FILE || join(homedir(), '.workbuddy', '5g-macos-key');
  try {
    return readFileSync(file, 'utf8').trim();
  } catch {
    return '';
  }
}

export function hashSender(value) {
  return createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
}

export function toSenderId(from, allowedSenders = []) {
  const raw = String(from || '').trim();
  if (allowedSenders.includes(raw)) return raw;
  const hashed = hashSender(raw);
  if (allowedSenders.includes(hashed)) return hashed;
  return /^[a-zA-Z0-9:_-]{3,128}$/.test(raw) ? raw : hashed;
}

export function parseWorkBuddyFiveGInbound(body = {}) {
  const payload = body.data && typeof body.data === 'object' ? { ...body, ...body.data } : body;
  const from = payload.from
    || payload.sender
    || payload.originationAddress
    || payload.userId
    || payload.to
    || '';
  const text = payload.content
    || payload.text
    || payload.message
    || payload.body
    || '';
  const messageId = payload.messageId || payload.msgId || payload.id || '';
  if (payload.type && payload.type !== 'text_message' && payload.type !== 'message' && payload.type !== 'inbound') {
    return { ignored: true, type: payload.type };
  }
  if (!String(from).trim() || !String(text).trim()) {
    return { error: '缺少发送者或正文' };
  }
  return {
    from: String(from).trim(),
    text: String(text),
    messageId: String(messageId || `fiveg-${Date.now()}`).replace(/[^a-zA-Z0-9:_-]/g, '-').slice(0, 160),
  };
}

function headerValue(headers, name) {
  const found = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return found ? String(found[1] || '') : '';
}

export function verifyFiveGCallbackKey(headers = {}, expectedKey = '') {
  if (!expectedKey) return false;
  const apiKey = headerValue(headers, 'x-api-key');
  const bearer = headerValue(headers, 'authorization').replace(/^Bearer\s+/i, '');
  return apiKey === expectedKey || bearer === expectedKey;
}

export async function probeFiveGHttp(env, fetchImpl = fetch, timeoutMs = 4_000) {
  const url = fiveGHttpBase(env);
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(env === 'local' ? { 'X-WorkBuddy-Probe': '1' } : {}),
      },
      signal: abort.signal,
    });
    let service = null;
    if (env === 'local') {
      try {
        const body = await response.clone().json();
        service = body?.service || null;
      } catch {}
    }
    const serviceMatch = env !== 'local' || service === 'workbuddy-5g-callback';
    return {
      env,
      url,
      ok: response.status < 500 && serviceMatch,
      reachable: true,
      status: response.status,
      ...(env === 'local' ? {
        service,
        serviceMatch,
        ...(serviceMatch ? {} : { error: '8080 可达，但不是 workbuddy-sms 的 5G 回调服务' }),
      } : {}),
    };
  } catch (error) {
    return {
      env,
      url,
      ok: false,
      reachable: false,
      error: error.name === 'AbortError' ? '超时' : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeAllFiveGHttp(fetchImpl = fetch) {
  const envs = ['production', 'test', 'local'];
  const results = [];
  for (const env of envs) {
    results.push(await probeFiveGHttp(env, fetchImpl));
  }
  return results;
}

export async function handleFiveGCallbackRequest({
  method,
  url,
  headers = {},
  rawBody = '',
  bridge,
  callbackKey,
}) {
  const parsedUrl = new URL(url, `http://${headers.host ?? '127.0.0.1'}`);
  const path = parsedUrl.pathname.replace(/\/+$/, '') || '/';
  const isApi = path === '/workbuddy/api' || path.startsWith('/workbuddy/api/');
  if (!isApi) return { status: 404, body: { ok: false, error: 'not found' } };
  if (method === 'GET') {
    if (headerValue(headers, 'x-workbuddy-probe') === '1') {
      return {
        status: 200,
        body: { ok: true, service: 'workbuddy-5g-callback', probe: true },
      };
    }
    return {
      status: 200,
      body: {
        ok: true,
        service: 'workbuddy-5g-callback',
        channel: await bridge.channel.health(),
      },
    };
  }
  if (method !== 'POST') return { status: 405, body: { ok: false, error: 'method not allowed' } };
  if (!verifyFiveGCallbackKey(headers, callbackKey)) {
    return { status: 401, body: { ok: false, error: 'invalid 5G callback key' } };
  }
  let payload;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return { status: 400, body: { ok: false, error: '请求体必须是 JSON' } };
  }
  const inbound = parseWorkBuddyFiveGInbound(payload);
  if (inbound.ignored) return { status: 202, body: { ok: true, ignored: true, type: inbound.type } };
  if (inbound.error) return { status: 400, body: { ok: false, error: inbound.error } };
  const allowedSenders = bridge.config.policy.allowedSenders;
  const result = await bridge.handle({
    eventId: inbound.messageId,
    senderId: toSenderId(inbound.from, allowedSenders),
    text: inbound.text,
    receivedAt: Date.now(),
  });
  return { status: result.status ?? (result.ok ? 200 : 400), body: result };
}
