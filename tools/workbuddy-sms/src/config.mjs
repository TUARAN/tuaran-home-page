import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULTS = Object.freeze({
  listen: { host: '127.0.0.1', port: 8789 },
  agent: {
    mode: 'codebuddy',
    baseUrl: 'http://127.0.0.1:8080',
    timeoutMs: 120_000,
  },
  channel: { provider: 'mock', from: null, relayBaseUrl: null, pollIntervalMs: 2_000 },
  policy: {
    allowedSenders: [],
    maxInboundChars: 500,
    maxOutboundChars: 240,
    maxEventsPerHour: 20,
    stopWords: ['STOP', 'TD', 'T', 'N', '退订', '暂停服务'],
  },
  storage: { path: './var/workbuddy-sms.sqlite' },
});

function merge(base, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base;
  const result = { ...base };
  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry && typeof entry === 'object' && !Array.isArray(entry)
      ? merge(base[key] ?? {}, entry)
      : entry;
  }
  return result;
}

export function validateConfig(config) {
  const errors = [];
  if (config.listen.host !== '127.0.0.1' && config.listen.host !== '::1') {
    errors.push('listen.host 必须是 127.0.0.1 或 ::1；本地桥不允许直接暴露到公网');
  }
  if (!Number.isInteger(config.listen.port) || config.listen.port < 1 || config.listen.port > 65535) {
    errors.push('listen.port 必须是有效端口');
  }
  try {
    const url = new URL(config.agent.baseUrl);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
      errors.push('agent.baseUrl 必须指向本机回环地址');
    }
  } catch {
    errors.push('agent.baseUrl 不是有效 URL');
  }
  if (!Array.isArray(config.policy.allowedSenders) || config.policy.allowedSenders.some((item) => !/^[a-zA-Z0-9:_-]{3,128}$/.test(item))) {
    errors.push('policy.allowedSenders 只能包含脱敏后的 sender ID');
  }
  if (!['mock', 'relay', 'twilio'].includes(config.channel.provider)) {
    errors.push('channel.provider 当前只支持 mock、relay 或 twilio');
  }
  if (config.channel.provider === 'relay') {
    try {
      const relayUrl = new URL(config.channel.relayBaseUrl);
      if (relayUrl.protocol !== 'https:' && relayUrl.hostname !== '127.0.0.1' && relayUrl.hostname !== 'localhost') {
        errors.push('channel.relayBaseUrl 正式环境必须使用 HTTPS');
      }
    } catch {
      errors.push('channel.relayBaseUrl 不是有效 URL');
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return config;
}

export async function loadConfig(file = process.env.WORKBUDDY_SMS_CONFIG ?? './workbuddy-sms.config.json') {
  const path = resolve(file);
  let user = {};
  try {
    user = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const config = validateConfig(merge(DEFAULTS, user));
  config.storage.path = resolve(path, '..', config.storage.path);
  return { config, path };
}

export { DEFAULTS };
