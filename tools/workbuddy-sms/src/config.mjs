import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';

const DEFAULTS = Object.freeze({
  listen: { host: '127.0.0.1', port: 8789 },
  agent: {
    mode: 'local-acp',
    baseUrl: 'http://127.0.0.1:50072',
    timeoutMs: 120_000,
    deviceId: 'sms-channel',
    bridgeBaseUrl: 'http://127.0.0.1:8080',
    localAcpBaseUrl: 'http://127.0.0.1:50072',
  },
  channel: {
    provider: 'fiveg',
    from: null,
    relayBaseUrl: null,
    pollIntervalMs: 2_000,
    fivegEnv: 'production',
    socketPath: join(homedir(), '.workbuddy', '5g-legacy-macos.sock'),
    callbackHost: '127.0.0.1',
    callbackPort: 8080,
    clawbotBaseUrl: 'http://127.0.0.1:18789',
    senderMap: {},
    dry: false,
  },
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

const AGENT_MODES = ['mock', 'codebuddy', 'workbuddy-acp', 'local-acp'];

function assertLoopbackUrl(value, field) {
  try {
    const url = new URL(value);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
      return `${field} 必须指向本机回环地址`;
    }
  } catch {
    return `${field} 不是有效 URL`;
  }
  return null;
}

export function validateConfig(config) {
  const errors = [];
  if (config.listen.host !== '127.0.0.1' && config.listen.host !== '::1') {
    errors.push('listen.host 必须是 127.0.0.1 或 ::1；本地桥不允许直接暴露到公网');
  }
  if (!Number.isInteger(config.listen.port) || config.listen.port < 1 || config.listen.port > 65535) {
    errors.push('listen.port 必须是有效端口');
  }
  if (!AGENT_MODES.includes(config.agent.mode)) {
    errors.push('agent.mode 只支持 mock、codebuddy、workbuddy-acp 或 local-acp');
  }
  const baseUrlError = assertLoopbackUrl(config.agent.baseUrl, 'agent.baseUrl');
  if (baseUrlError) errors.push(baseUrlError);
  if (config.agent.bridgeBaseUrl) {
    const error = assertLoopbackUrl(config.agent.bridgeBaseUrl, 'agent.bridgeBaseUrl');
    if (error) errors.push(error);
  }
  if (config.agent.localAcpBaseUrl) {
    const error = assertLoopbackUrl(config.agent.localAcpBaseUrl, 'agent.localAcpBaseUrl');
    if (error) errors.push(error);
  }
  if (!Array.isArray(config.policy.allowedSenders) || config.policy.allowedSenders.some((item) => !/^[a-zA-Z0-9:_-]{3,128}$/.test(item))) {
    errors.push('policy.allowedSenders 只能包含脱敏后的 sender ID');
  }
  if (!['mock', 'relay', 'twilio', 'fiveg'].includes(config.channel.provider)) {
    errors.push('channel.provider 当前只支持 mock、relay、twilio 或 fiveg');
  }
  if (config.channel.provider === 'fiveg') {
    if (!['production', 'test', 'local'].includes(config.channel.fivegEnv)) {
      errors.push('channel.fivegEnv 只支持 production、test 或 local');
    }
    if (config.channel.callbackHost !== '127.0.0.1' && config.channel.callbackHost !== '::1') {
      errors.push('channel.callbackHost 必须是 127.0.0.1 或 ::1');
    }
    if (!Number.isInteger(config.channel.callbackPort) || config.channel.callbackPort < 1 || config.channel.callbackPort > 65535) {
      errors.push('channel.callbackPort 必须是有效端口');
    }
    const clawbotError = assertLoopbackUrl(config.channel.clawbotBaseUrl, 'channel.clawbotBaseUrl');
    if (clawbotError) errors.push(clawbotError);
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
  if (config.channel.socketPath) {
    config.channel.socketPath = String(config.channel.socketPath).replace(/^~(?=\/|$)/, homedir());
  }
  return { config, path };
}

export { DEFAULTS };
