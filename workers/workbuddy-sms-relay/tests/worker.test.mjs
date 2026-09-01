import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRequest } from '../src/index.js';
import { sha256Base64Url } from '../src/crypto.js';

async function twilioSignature(authToken, url, params) {
  const payload = `${url}${[...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}${value}`).join('')}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  return Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))).toString('base64');
}

class CaptureDb {
  constructor() { this.calls = []; }
  async batch(statements) {
    this.batchStatements = statements;
    return statements.map(() => ({ success: true, meta: { changes: 1 } }));
  }
  prepare(query) {
    const call = { query, values: [] };
    this.calls.push(call);
    return {
      bind: (...values) => {
        call.values = values;
        return { run: async () => ({ success: true, meta: { changes: 1 } }), first: async () => null };
      },
    };
  }
}

test('accepts authenticated Tencent and Aliyun upstream callbacks in their official payload shapes', async () => {
  const tencentToken = 'tencent-hook-secret-at-least-32-bytes';
  const aliyunToken = 'aliyun-hook-secret-at-least-32-bytes';
  const phone = '+8613811112222';
  const common = {
    QUEUE_ENCRYPTION_KEY: Buffer.alloc(32, 5).toString('base64url'),
    ALLOWED_FROM_SHA256: await sha256Base64Url(phone),
    SENDER_ALIAS: 'self-cn',
  };

  const tencentDb = new CaptureDb();
  const tencent = await handleRequest(new Request(`https://sms.example.com/webhooks/tencent/${tencentToken}/inbound`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '13811112222', nationcode: '86', text: '查询日程', time: 1788249600, extend: '' }),
  }), { ...common, DB: tencentDb, SMS_PROVIDER: 'tencent', TENCENT_WEBHOOK_TOKEN: tencentToken });
  assert.equal(tencent.status, 200);
  assert.equal((await tencent.json()).result, 0);
  assert.equal(tencentDb.batchStatements.length, 1);
  assert.equal(tencentDb.calls[0].values[1], 'tencent');
  assert.notEqual(tencentDb.calls[0].values[4], '查询日程');

  const aliyunDb = new CaptureDb();
  const aliyun = await handleRequest(new Request(`https://sms.example.com/webhooks/aliyun/${aliyunToken}/inbound`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ phone_number: '13811112222', content: '继续', send_time: '2026-09-01 16:00:00', dest_code: '1234', sequence_id: '9988' }]),
  }), { ...common, DB: aliyunDb, SMS_PROVIDER: 'aliyun', ALIYUN_WEBHOOK_TOKEN: aliyunToken });
  assert.equal(aliyun.status, 200);
  assert.equal((await aliyun.json()).code, 0);
  assert.equal(aliyunDb.calls[0].values[1], 'aliyun');
  assert.equal(aliyunDb.calls[0].values[2], 'aliyun:9988');
});

test('validates a Twilio webhook and queues only encrypted text with an opaque sender alias', async () => {
  const url = 'https://sms.example.com/webhooks/twilio/inbound';
  const authToken = 'twilio-test-token';
  const from = '+15551234567';
  const params = new URLSearchParams({ MessageSid: 'SM123', From: from, Body: '私人任务正文' });
  const db = new CaptureDb();
  const env = {
    DB: db,
    TWILIO_AUTH_TOKEN: authToken,
    TWILIO_WEBHOOK_URL: url,
    ALLOWED_FROM_SHA256: await sha256Base64Url(from),
    SENDER_ALIAS: 'self-hash',
    QUEUE_ENCRYPTION_KEY: Buffer.alloc(32, 4).toString('base64url'),
  };
  const request = new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Twilio-Signature': await twilioSignature(authToken, url, params),
    },
    body: params,
  });
  const result = await handleRequest(request, env);
  assert.equal(result.status, 200);
  const values = db.calls[0].values;
  assert.equal(values[2], 'self-hash');
  assert.notEqual(values[3], '私人任务正文');
  assert.equal(JSON.stringify(values).includes(from), false);
});

test('requires the device token and rejects arbitrary outbound message types', async () => {
  const url = 'https://sms.example.com/v1/messages';
  const deviceToken = 'device-secret-at-least-32-bytes-long';
  const env = { DEVICE_TOKEN: deviceToken };
  const unauthorized = await handleRequest(new Request(url, { method: 'POST', body: '{}' }), env);
  assert.equal(unauthorized.status, 401);
  const rejected = await handleRequest(new Request(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${deviceToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageType: 'arbitrary-send', text: 'hello' }),
  }), env);
  assert.equal(rejected.status, 400);
});

test('routes an approved outbound message through the selected domestic provider and audits only its hash', async () => {
  const deviceToken = 'device-secret-at-least-32-bytes-long';
  const db = new CaptureDb();
  const env = {
    DB: db,
    DEVICE_TOKEN: deviceToken,
    SMS_PROVIDER: 'tencent',
    DOMESTIC_TO: '+8613811112222',
    TENCENT_SMS_SDK_APP_ID: '1400000000',
    TENCENT_SIGN_NAME: '测试企业',
    TENCENT_REGION: 'ap-guangzhou',
    TENCENT_SECRET_ID: 'AKIDEXAMPLE',
    TENCENT_SECRET_KEY: 'SECRETKEYEXAMPLE',
    TENCENT_TEMPLATE_MAP_JSON: JSON.stringify({ 'task-accepted': { id: '123456', params: ['taskId'] } }),
  };
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ Response: { RequestId: 'request-1', SendStatusSet: [{ Code: 'Ok', SerialNo: 'serial-1' }] } }));
  };
  const result = await handleRequest(new Request('https://sms.example.com/v1/messages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${deviceToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageType: 'task-accepted', taskId: 'A17', text: '任务 A17 已收到' }),
  }), env, fetchImpl);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).provider, 'tencent');
  assert.equal(requests[0].url, 'https://sms.tencentcloudapi.com');
  const audit = db.calls.at(-1).values;
  assert.equal(audit[1], 'tencent');
  assert.equal(JSON.stringify(audit).includes('任务 A17 已收到'), false);
});

test('reports missing domestic bindings and template coverage without returning secret values', async () => {
  const deviceToken = 'device-secret-at-least-32-bytes-long';
  const env = {
    DEVICE_TOKEN: deviceToken,
    SMS_PROVIDER: 'aliyun',
    QUEUE_ENCRYPTION_KEY: 'queue-secret',
    ALLOWED_FROM_SHA256: 'phone-hash',
    SENDER_ALIAS: 'self-cn',
    DOMESTIC_TO: '13811112222',
    ALIYUN_WEBHOOK_TOKEN: 'hook-secret-at-least-32-bytes-long',
    ALIYUN_ACCESS_KEY_ID: 'access-id',
    ALIYUN_ACCESS_KEY_SECRET: 'access-secret',
    ALIYUN_SIGN_NAME: '测试企业',
    ALIYUN_TEMPLATE_MAP_JSON: JSON.stringify({ 'task-accepted': { id: 'SMS_1', params: {} } }),
  };
  const result = await handleRequest(new Request('https://sms.example.com/v1/doctor', {
    headers: { Authorization: `Bearer ${deviceToken}` },
  }), env);
  const body = await result.json();
  assert.equal(body.ok, false);
  assert.equal(body.provider, 'aliyun');
  assert.equal(body.checks.ALIYUN_ACCESS_KEY_SECRET, true);
  assert.equal(body.templates['task-completed'], false);
  assert.equal(JSON.stringify(body).includes('access-secret'), false);
});
