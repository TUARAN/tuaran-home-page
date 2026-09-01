import { hmacSha256, sha256Hex } from '../crypto.js';
import { resolveTencentTemplate } from './templates.js';

const HOST = 'sms.tencentcloudapi.com';
const SERVICE = 'sms';
const ACTION = 'SendSms';
const VERSION = '2021-01-11';

function utcDate(timestampSeconds) {
  return new Date(timestampSeconds * 1000).toISOString().slice(0, 10);
}

export async function buildTencentRequest(message, env, now = Date.now()) {
  const template = resolveTencentTemplate(message, env.TENCENT_TEMPLATE_MAP_JSON);
  const payload = JSON.stringify({
    PhoneNumberSet: [env.DOMESTIC_TO],
    SmsSdkAppId: env.TENCENT_SMS_SDK_APP_ID,
    SignName: env.TENCENT_SIGN_NAME,
    TemplateId: template.templateId,
    TemplateParamSet: template.params,
  });
  const timestamp = Math.floor(now / 1000);
  const date = utcDate(timestamp);
  const hashedPayload = await sha256Hex(payload);
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${HOST}\nx-tc-action:${ACTION.toLowerCase()}\n`;
  const signedHeaders = 'content-type;host;x-tc-action';
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;
  const secretDate = await hmacSha256(`TC3${env.TENCENT_SECRET_KEY}`, date);
  const secretService = await hmacSha256(secretDate, SERVICE);
  const secretSigning = await hmacSha256(secretService, 'tc3_request');
  const signature = await hmacSha256(secretSigning, stringToSign, 'hex');
  const authorization = `TC3-HMAC-SHA256 Credential=${env.TENCENT_SECRET_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return {
    url: `https://${HOST}`,
    options: {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json; charset=utf-8',
        Host: HOST,
        'X-TC-Action': ACTION,
        'X-TC-Version': VERSION,
        'X-TC-Timestamp': String(timestamp),
        'X-TC-Region': env.TENCENT_REGION,
        ...(env.TENCENT_SESSION_TOKEN ? { 'X-TC-Token': env.TENCENT_SESSION_TOKEN } : {}),
      },
      body: payload,
    },
  };
}

export async function sendTencent(message, env, fetchImpl = fetch) {
  const request = await buildTencentRequest(message, env);
  const upstream = await fetchImpl(request.url, request.options);
  const data = await upstream.json();
  const status = data?.Response?.SendStatusSet?.[0];
  const ok = upstream.ok && status?.Code === 'Ok';
  return {
    ok,
    provider: 'tencent',
    messageId: status?.SerialNo ?? data?.Response?.RequestId ?? null,
    status: status?.Code ?? data?.Response?.Error?.Code ?? (upstream.ok ? 'Unknown' : `HTTP_${upstream.status}`),
    providerRequestId: data?.Response?.RequestId ?? null,
  };
}
