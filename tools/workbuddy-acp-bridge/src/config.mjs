import { resolve } from 'node:path';

const LOOPBACK = new Set(['127.0.0.1', '::1', 'localhost']);

export function loadConfig(env = process.env, cwd = process.cwd()) {
  const port = Number(env.WORKBUDDY_BRIDGE_PORT || 8799);
  const config = {
    mode: env.WORKBUDDY_BRIDGE_MODE || 'mock',
    host: env.WORKBUDDY_BRIDGE_HOST || '127.0.0.1',
    port,
    clientId: env.WORKBUDDY_CLIENT_ID || '',
    clientSecret: env.WORKBUDDY_CLIENT_SECRET || '',
    redirectUri: env.WORKBUDDY_REDIRECT_URI || 'http://localhost:' + port + '/oauth/callback',
    bridgeKey: env.WORKBUDDY_BRIDGE_KEY || '',
    scope: env.WORKBUDDY_SCOPE || 'user.task.readable user.task.invokable',
    tokenFile: resolve(cwd, env.WORKBUDDY_TOKEN_FILE || './var/workbuddy-token.json'),
    apiBaseUrl: env.WORKBUDDY_API_BASE_URL || 'https://www.workbuddy.cn/openapi/v2',
  };
  if (!['mock', 'real'].includes(config.mode)) throw new Error('WORKBUDDY_BRIDGE_MODE 只能是 mock 或 real');
  if (!LOOPBACK.has(config.host)) throw new Error('测试桥接仅允许监听回环地址');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('WORKBUDDY_BRIDGE_PORT 无效');
  return config;
}

export function diagnoseConfig(config) {
  const real = config.mode === 'real';
  return {
    loopbackOnly: { ok: LOOPBACK.has(config.host) },
    clientId: { ok: !real || Boolean(config.clientId) },
    clientSecret: { ok: !real || Boolean(config.clientSecret) },
    bridgeKey: { ok: Boolean(config.bridgeKey) && config.bridgeKey.length >= 24 },
    redirectUri: { ok: !real || Boolean(config.redirectUri), value: config.redirectUri },
    scopes: { ok: config.scope.includes('user.task.readable') && config.scope.includes('user.task.invokable'), value: config.scope },
  };
}
