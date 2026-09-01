import { constantTimeEqual, decryptText, encryptText, sha256Base64Url, verifyTwilioSignature } from './crypto.js';
import { sendAliyun } from './providers/aliyun.js';
import { sendTencent } from './providers/tencent.js';
import { validateOutboundMessage } from './providers/templates.js';

const MAX_WEBHOOK_BYTES = 16_384;
const MAX_SMS_CHARS = 240;
const MAX_INBOUND_CHARS = 500;
const MESSAGE_TYPES = ['task-accepted', 'task-completed', 'task-failed', 'service-paused', 'service-resumed'];

function response(body, status = 200, headers = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

function twiml(status = 200) {
  return new Response('<Response></Response>', { status, headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

function authorized(request, env) {
  const value = request.headers.get('Authorization') ?? '';
  return strongSecret(env.DEVICE_TOKEN) && value.startsWith('Bearer ') && constantTimeEqual(value.slice(7), env.DEVICE_TOKEN);
}

function strongSecret(value) {
  return typeof value === 'string' && value.length >= 32;
}

function present(env, names) {
  return Object.fromEntries(names.map((name) => [name, Boolean(env[name])]));
}

function templateCoverage(raw) {
  try {
    const parsed = JSON.parse(raw ?? '{}');
    return Object.fromEntries(MESSAGE_TYPES.map((name) => [name, Boolean(parsed?.[name]?.id)]));
  } catch {
    return Object.fromEntries(MESSAGE_TYPES.map((name) => [name, false]));
  }
}

function doctor(env) {
  const provider = env.SMS_PROVIDER ?? 'twilio';
  const common = present(env, ['DEVICE_TOKEN', 'QUEUE_ENCRYPTION_KEY', 'ALLOWED_FROM_SHA256', 'SENDER_ALIAS']);
  common.DEVICE_TOKEN = strongSecret(env.DEVICE_TOKEN);
  let providerBindings;
  let templates = {};
  if (provider === 'tencent') {
    providerBindings = present(env, [
      'DOMESTIC_TO', 'TENCENT_WEBHOOK_TOKEN', 'TENCENT_SECRET_ID', 'TENCENT_SECRET_KEY',
      'TENCENT_SMS_SDK_APP_ID', 'TENCENT_SIGN_NAME', 'TENCENT_REGION', 'TENCENT_TEMPLATE_MAP_JSON',
    ]);
    providerBindings.TENCENT_WEBHOOK_TOKEN = strongSecret(env.TENCENT_WEBHOOK_TOKEN);
    templates = templateCoverage(env.TENCENT_TEMPLATE_MAP_JSON);
  } else if (provider === 'aliyun') {
    providerBindings = present(env, [
      'DOMESTIC_TO', 'ALIYUN_WEBHOOK_TOKEN', 'ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET',
      'ALIYUN_SIGN_NAME', 'ALIYUN_TEMPLATE_MAP_JSON',
    ]);
    providerBindings.ALIYUN_WEBHOOK_TOKEN = strongSecret(env.ALIYUN_WEBHOOK_TOKEN);
    templates = templateCoverage(env.ALIYUN_TEMPLATE_MAP_JSON);
  } else if (provider === 'twilio') {
    providerBindings = present(env, [
      'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM', 'TWILIO_TO', 'TWILIO_WEBHOOK_URL',
    ]);
  } else {
    providerBindings = { supportedProvider: false };
  }
  const checks = { ...common, ...providerBindings };
  return { ok: Object.values(checks).every(Boolean) && Object.values(templates).every(Boolean), provider, checks, templates };
}

async function readLimitedText(request) {
  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > MAX_WEBHOOK_BYTES) throw new Error('request too large');
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > MAX_WEBHOOK_BYTES) throw new Error('request too large');
  return new TextDecoder().decode(bytes);
}

async function receiveTwilio(request, env) {
  const raw = await readLimitedText(request);
  const params = new URLSearchParams(raw);
  const valid = await verifyTwilioSignature({
    authToken: env.TWILIO_AUTH_TOKEN,
    url: env.TWILIO_WEBHOOK_URL,
    params,
    signature: request.headers.get('X-Twilio-Signature'),
  });
  if (!valid) return twiml(403);

  const providerEventId = params.get('MessageSid') ?? '';
  const from = params.get('From') ?? '';
  const text = params.get('Body')?.trim() ?? '';
  if (!providerEventId || !text || !constantTimeEqual(await sha256Base64Url(from), env.ALLOWED_FROM_SHA256 ?? '')) {
    return twiml(403);
  }
  const now = Date.now();
  const encrypted = await encryptText(text, env.QUEUE_ENCRYPTION_KEY);
  await env.DB.prepare(`
    INSERT OR IGNORE INTO sms_inbound_events
      (id, provider, provider_event_id, sender_id, ciphertext, iv, received_at, expires_at)
    VALUES (?, 'twilio', ?, ?, ?, ?, ?, ?)
  `).bind(crypto.randomUUID(), providerEventId, env.SENDER_ALIAS, encrypted.ciphertext, encrypted.iv, now, now + 86_400_000).run();
  return twiml();
}

function domesticPhone(phone, countryCode = '86') {
  const value = String(phone ?? '').replace(/[^\d+]/g, '');
  if (value.startsWith('+')) return value;
  if (value.startsWith('86') && value.length > 11) return `+${value}`;
  return `+${countryCode}${value}`;
}

async function queueDomesticEvents(provider, events, env) {
  const statements = [];
  const now = Date.now();
  for (const event of events) {
    const text = String(event.text ?? '').trim();
    if (!text || [...text].length > MAX_INBOUND_CHARS) throw new Error('invalid inbound text');
    if (!constantTimeEqual(await sha256Base64Url(event.phone), env.ALLOWED_FROM_SHA256 ?? '')) {
      throw new Error('unbound sender');
    }
    const encrypted = await encryptText(text, env.QUEUE_ENCRYPTION_KEY);
    statements.push(env.DB.prepare(`
      INSERT OR IGNORE INTO sms_inbound_events
        (id, provider, provider_event_id, sender_id, ciphertext, iv, received_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), provider, event.providerEventId, env.SENDER_ALIAS, encrypted.ciphertext, encrypted.iv, now, now + 86_400_000));
  }
  if (statements.length) await env.DB.batch(statements);
}

async function receiveTencent(request, env, token) {
  if (!strongSecret(env.TENCENT_WEBHOOK_TOKEN) || !constantTimeEqual(token, env.TENCENT_WEBHOOK_TOKEN)) return response({ result: 1, errmsg: 'unauthorized' }, 403);
  const raw = await readLimitedText(request);
  const parsed = JSON.parse(raw);
  const callbacks = Array.isArray(parsed) ? parsed : [parsed];
  const events = await Promise.all(callbacks.map(async (item) => {
    const phone = domesticPhone(item.mobile, item.nationcode ?? '86');
    const providerEventId = `tencent:${await sha256Base64Url(`${phone}|${item.time ?? ''}|${item.extend ?? ''}|${item.text ?? ''}`)}`;
    return { phone, providerEventId, text: item.text };
  }));
  await queueDomesticEvents('tencent', events, env);
  return response({ result: 0, errmsg: 'OK' });
}

async function receiveAliyun(request, env, token) {
  if (!strongSecret(env.ALIYUN_WEBHOOK_TOKEN) || !constantTimeEqual(token, env.ALIYUN_WEBHOOK_TOKEN)) return response({ code: 1, msg: 'unauthorized' }, 403);
  const raw = await readLimitedText(request);
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return response({ code: 1, msg: 'invalid payload' }, 400);
  const events = parsed.map((item) => ({
    phone: domesticPhone(item.phone_number),
    providerEventId: `aliyun:${String(item.sequence_id ?? '')}`,
    text: item.content,
  }));
  if (events.some((event) => event.providerEventId === 'aliyun:')) return response({ code: 1, msg: 'missing sequence_id' }, 400);
  await queueDomesticEvents('aliyun', events, env);
  return response({ code: 0, msg: '接收成功' });
}

async function nextEvent(env) {
  const now = Date.now();
  await env.DB.prepare('DELETE FROM sms_inbound_events WHERE expires_at <= ?').bind(now).run();
  const row = await env.DB.prepare(`
    UPDATE sms_inbound_events
    SET claimed_at = ?
    WHERE id = (
      SELECT id FROM sms_inbound_events
      WHERE acked_at IS NULL AND expires_at > ? AND (claimed_at IS NULL OR claimed_at < ?)
      ORDER BY received_at ASC
      LIMIT 1
    )
    RETURNING id, sender_id, ciphertext, iv, received_at
  `).bind(now, now, now - 120_000).first();
  if (!row) return response(null, 204);
  const text = await decryptText(row.ciphertext, row.iv, env.QUEUE_ENCRYPTION_KEY);
  return response({ eventId: row.id, senderId: row.sender_id, text, receivedAt: row.received_at });
}

async function acknowledge(request, env, eventId) {
  const body = await request.json();
  const outcome = ['completed', 'rejected'].includes(body?.outcome) ? body.outcome : 'rejected';
  const result = await env.DB.prepare(`
    UPDATE sms_inbound_events
    SET acked_at = ?, outcome = ?, ciphertext = '', iv = ''
    WHERE id = ? AND acked_at IS NULL
  `).bind(Date.now(), outcome, eventId).run();
  return response({ ok: true, changed: result.meta.changes > 0 });
}

async function sendTwilio(message, env, fetchImpl) {
  const form = new URLSearchParams({ To: env.TWILIO_TO, From: env.TWILIO_FROM, Body: message.text });
  const upstream = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: form,
  });
  const data = await upstream.json();
  return {
    ok: upstream.ok,
    provider: 'twilio',
    messageId: data.sid ?? null,
    status: data.status ?? (upstream.ok ? 'Unknown' : `HTTP_${upstream.status}`),
    providerRequestId: null,
  };
}

async function sendMessage(request, env, fetchImpl) {
  let message;
  try {
    message = validateOutboundMessage(await request.json(), MAX_SMS_CHARS);
  } catch (error) {
    return response({ ok: false, error: error.message }, 400);
  }
  const provider = env.SMS_PROVIDER ?? 'twilio';
  let result;
  if (provider === 'tencent') result = await sendTencent(message, env, fetchImpl);
  else if (provider === 'aliyun') result = await sendAliyun(message, env, fetchImpl);
  else if (provider === 'twilio') result = await sendTwilio(message, env, fetchImpl);
  else return response({ ok: false, error: 'unsupported SMS_PROVIDER' }, 503);

  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO sms_outbound_events
      (id, provider, task_id, message_type, body_sha256, provider_message_id, provider_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, result.provider, message.taskId, message.messageType, await sha256Base64Url(message.text), result.messageId, result.status, Date.now()).run();
  if (!result.ok) return response({ ok: false, provider: result.provider, error: 'provider rejected message', status: result.status }, 502);
  return response({ ...result, taskId: message.taskId });
}

export async function handleRequest(request, env, fetchImpl = fetch) {
  try {
    const url = new URL(request.url);
    const activeProvider = env.SMS_PROVIDER ?? 'twilio';
    if (request.method === 'GET' && url.pathname === '/health') return response({ ok: true, service: 'workbuddy-sms-relay' });
    if (request.method === 'POST' && url.pathname === '/webhooks/twilio/inbound' && activeProvider === 'twilio') return receiveTwilio(request, env);
    const tencent = url.pathname.match(/^\/webhooks\/tencent\/([^/]+)\/inbound$/);
    if (request.method === 'POST' && tencent && activeProvider === 'tencent') return receiveTencent(request, env, decodeURIComponent(tencent[1]));
    const aliyun = url.pathname.match(/^\/webhooks\/aliyun\/([^/]+)\/inbound$/);
    if (request.method === 'POST' && aliyun && activeProvider === 'aliyun') return receiveAliyun(request, env, decodeURIComponent(aliyun[1]));
    if (!authorized(request, env)) return response({ ok: false, error: 'unauthorized' }, 401);
    if (request.method === 'GET' && url.pathname === '/v1/doctor') return response(doctor(env));
    if (request.method === 'GET' && url.pathname === '/v1/events/next') return nextEvent(env);
    const ack = url.pathname.match(/^\/v1\/events\/([^/]+)\/ack$/);
    if (request.method === 'POST' && ack) return acknowledge(request, env, decodeURIComponent(ack[1]));
    if (request.method === 'POST' && url.pathname === '/v1/messages') return sendMessage(request, env, fetchImpl);
    return response({ ok: false, error: 'not found' }, 404);
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', code: 'RELAY_REQUEST_FAILED', message: error.message }));
    return response({ ok: false, error: 'request failed' }, 400);
  }
}

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};
