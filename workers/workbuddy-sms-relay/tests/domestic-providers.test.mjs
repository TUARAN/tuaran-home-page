import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import test from 'node:test';
import { buildAliyunRequest } from '../src/providers/aliyun.js';
import { buildTencentRequest } from '../src/providers/tencent.js';
import { resolveAliyunTemplate, resolveTencentTemplate } from '../src/providers/templates.js';

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(secret, value, encoding) {
  return createHmac('sha256', secret).update(value).digest(encoding);
}

test('maps domestic message types only to explicitly approved template parameters', () => {
  const message = { messageType: 'task-completed', taskId: 'A17', text: '资料整理完成' };
  assert.deepEqual(resolveTencentTemplate(message, JSON.stringify({
    'task-completed': { id: '123456', params: ['taskId', 'text'] },
  })), { templateId: '123456', params: ['A17', '资料整理完成'] });
  assert.deepEqual(resolveAliyunTemplate(message, JSON.stringify({
    'task-completed': { id: 'SMS_123456', params: { task: 'taskId', summary: 'text' } },
  })), { templateCode: 'SMS_123456', params: { task: 'A17', summary: '资料整理完成' } });
  assert.throws(() => resolveTencentTemplate(message, '{}'), /没有配置/);
});

test('builds a Tencent SendSms request with an independently verified TC3 signature', async () => {
  const env = {
    DOMESTIC_TO: '+8613811112222',
    TENCENT_SMS_SDK_APP_ID: '1400000000',
    TENCENT_SIGN_NAME: '测试企业',
    TENCENT_REGION: 'ap-guangzhou',
    TENCENT_SECRET_ID: 'AKIDEXAMPLE',
    TENCENT_SECRET_KEY: 'SECRETKEYEXAMPLE',
    TENCENT_TEMPLATE_MAP_JSON: JSON.stringify({ 'task-accepted': { id: '123456', params: ['taskId'] } }),
  };
  const request = await buildTencentRequest({ messageType: 'task-accepted', taskId: 'A17', text: 'ignored' }, env, 1_700_000_000_000);
  const payload = request.options.body;
  const timestamp = '1700000000';
  const date = '2023-11-14';
  const canonicalHeaders = 'content-type:application/json; charset=utf-8\nhost:sms.tencentcloudapi.com\nx-tc-action:sendsms\n';
  const canonical = `POST\n/\n\n${canonicalHeaders}\ncontent-type;host;x-tc-action\n${hash(payload)}`;
  const scope = `${date}/sms/tc3_request`;
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${scope}\n${hash(canonical)}`;
  const secretDate = hmac(`TC3${env.TENCENT_SECRET_KEY}`, date);
  const secretService = hmac(secretDate, 'sms');
  const secretSigning = hmac(secretService, 'tc3_request');
  const signature = hmac(secretSigning, stringToSign, 'hex');
  assert.match(request.options.headers.Authorization, new RegExp(`Signature=${signature}$`));
  assert.deepEqual(JSON.parse(payload).TemplateParamSet, ['A17']);
});

test('builds an Aliyun SendSms request with an independently verified ACS3 signature', async () => {
  const env = {
    DOMESTIC_TO: '13811112222',
    ALIYUN_SIGN_NAME: '测试企业',
    ALIYUN_ACCESS_KEY_ID: 'AKIDEXAMPLE',
    ALIYUN_ACCESS_KEY_SECRET: 'SECRETKEYEXAMPLE',
    ALIYUN_TEMPLATE_MAP_JSON: JSON.stringify({ 'task-failed': { id: 'SMS_123456', params: { task: 'taskId' } } }),
  };
  const request = await buildAliyunRequest(
    { messageType: 'task-failed', taskId: 'A17', text: 'ignored' },
    env,
    Date.parse('2026-09-01T08:00:00Z'),
    'fixed-nonce',
  );
  const url = new URL(request.url);
  const headers = Object.fromEntries(Object.entries(request.options.headers).filter(([key]) => key !== 'Authorization'));
  const keys = Object.keys(headers).sort();
  const canonicalHeaders = `${keys.map((key) => `${key}:${headers[key]}`).join('\n')}\n`;
  const payloadHash = hash('');
  const canonical = `POST\n/\n${url.search.slice(1)}\n${canonicalHeaders}\n${keys.join(';')}\n${payloadHash}`;
  const signature = hmac(env.ALIYUN_ACCESS_KEY_SECRET, `ACS3-HMAC-SHA256\n${hash(canonical)}`, 'hex');
  assert.match(request.options.headers.Authorization, new RegExp(`Signature=${signature}$`));
  assert.equal(url.searchParams.get('TemplateCode'), 'SMS_123456');
  assert.equal(url.searchParams.get('TemplateParam'), '{"task":"A17"}');
});
