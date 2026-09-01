import { hmacSha256, sha256Hex } from '../crypto.js';
import { resolveAliyunTemplate } from './templates.js';

const HOST = 'dysmsapi.aliyuncs.com';
const ACTION = 'SendSms';
const VERSION = '2017-05-25';
const ALGORITHM = 'ACS3-HMAC-SHA256';

function rfc3986(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

export async function buildAliyunRequest(message, env, now = Date.now(), nonce = crypto.randomUUID()) {
  const template = resolveAliyunTemplate(message, env.ALIYUN_TEMPLATE_MAP_JSON);
  const query = new URLSearchParams({
    PhoneNumbers: env.DOMESTIC_TO,
    SignName: env.ALIYUN_SIGN_NAME,
    TemplateCode: template.templateCode,
    TemplateParam: JSON.stringify(template.params),
  });
  const canonicalQuery = [...query.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${rfc3986(key)}=${rfc3986(value)}`)
    .join('&');
  const payloadHash = await sha256Hex('');
  const date = new Date(now).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const headers = {
    host: HOST,
    'x-acs-action': ACTION,
    'x-acs-content-sha256': payloadHash,
    'x-acs-date': date,
    'x-acs-signature-nonce': nonce,
    'x-acs-version': VERSION,
    ...(env.ALIYUN_SECURITY_TOKEN ? { 'x-acs-security-token': env.ALIYUN_SECURITY_TOKEN } : {}),
  };
  const signedKeys = Object.keys(headers).sort();
  const signedHeaders = signedKeys.join(';');
  const canonicalHeaders = `${signedKeys.map((key) => `${key}:${headers[key].trim()}`).join('\n')}\n`;
  const canonicalRequest = `POST\n/\n${canonicalQuery}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const stringToSign = `${ALGORITHM}\n${await sha256Hex(canonicalRequest)}`;
  const signature = await hmacSha256(env.ALIYUN_ACCESS_KEY_SECRET, stringToSign, 'hex');
  const authorization = `${ALGORITHM} Credential=${env.ALIYUN_ACCESS_KEY_ID},SignedHeaders=${signedHeaders},Signature=${signature}`;
  return {
    url: `https://${HOST}/?${canonicalQuery}`,
    options: { method: 'POST', headers: { ...headers, Authorization: authorization } },
  };
}

export async function sendAliyun(message, env, fetchImpl = fetch) {
  const request = await buildAliyunRequest(message, env);
  const upstream = await fetchImpl(request.url, request.options);
  const data = await upstream.json();
  const ok = upstream.ok && data?.Code === 'OK';
  return {
    ok,
    provider: 'aliyun',
    messageId: data?.BizId ?? data?.RequestId ?? null,
    status: data?.Code ?? (upstream.ok ? 'Unknown' : `HTTP_${upstream.status}`),
    providerRequestId: data?.RequestId ?? null,
  };
}
