import { resolve } from 'node:path';

const LOOPBACK = new Set(['127.0.0.1', '::1', 'localhost']);
const FIVEG_CALLBACKS = new Set([
  'https://5gvas01.cmicmaap.com/gtw-ai/workbuddy/api',
  'https://cmic-maap-ums.cmmaap.com:5443/gtw-ai/workbuddy/api',
]);

function envText(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

export function normalizePathname(pathname) {
  return String(pathname || '/').replace(/\/+$/, '') || '/';
}

export function isOfficialFiveGCallback(redirectUri) {
  try {
    const url = new URL(redirectUri);
    url.hash = '';
    const normalized = url.toString().replace(/\/+$/, '');
    return FIVEG_CALLBACKS.has(normalized);
  } catch {
    return false;
  }
}

export function parseRedirectListen(redirectUri) {
  const url = new URL(redirectUri);
  if (!LOOPBACK.has(url.hostname)) return null;
  if (url.protocol !== 'http:') throw new Error('本地 OAuth 回调只允许 http://localhost');
  const listenPort = Number(url.port || 80);
  if (!Number.isInteger(listenPort) || listenPort < 1 || listenPort > 65535) {
    throw new Error('OAuth redirect_uri 端口无效');
  }
  return {
    hostname: url.hostname,
    listenPort,
    pathname: normalizePathname(url.pathname),
    origin: url.origin,
  };
}

export function loadConfig(env = process.env, cwd = process.cwd()) {
  const port = Number(env.WORKBUDDY_BRIDGE_PORT || 8799);
  const config = {
    mode: env.WORKBUDDY_BRIDGE_MODE || 'mock',
    host: env.WORKBUDDY_BRIDGE_HOST || '127.0.0.1',
    port,
    clientId: envText(env.WORKBUDDY_CLIENT_ID),
    clientSecret: envText(env.WORKBUDDY_CLIENT_SECRET),
    redirectUri: envText(env.WORKBUDDY_REDIRECT_URI) || 'http://localhost:' + port + '/oauth/callback',
    bridgeKey: envText(env.WORKBUDDY_BRIDGE_KEY),
    scope: envText(env.WORKBUDDY_SCOPE) || 'user.task.readable user.task.invokable',
    testPhone: envText(env.WORKBUDDY_TEST_PHONE),
    tokenFile: resolve(cwd, env.WORKBUDDY_TOKEN_FILE || './var/workbuddy-token.json'),
    apiBaseUrl: envText(env.WORKBUDDY_API_BASE_URL) || 'https://www.workbuddy.cn/openapi/v2',
  };
  if (!['mock', 'real'].includes(config.mode)) throw new Error('WORKBUDDY_BRIDGE_MODE 只能是 mock 或 real');
  if (!LOOPBACK.has(config.host)) throw new Error('测试桥接仅允许监听回环地址');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('WORKBUDDY_BRIDGE_PORT 无效');
  config.oauthListen = parseRedirectListen(config.redirectUri);
  return config;
}

export function diagnoseConfig(config) {
  const real = config.mode === 'real';
  const redirectOk = !real || Boolean(config.oauthListen?.pathname) || isOfficialFiveGCallback(config.redirectUri);
  return {
    loopbackOnly: { ok: LOOPBACK.has(config.host) },
    clientId: { ok: !real || Boolean(config.clientId) },
    clientSecret: { ok: !real || Boolean(config.clientSecret) },
    bridgeKey: { ok: Boolean(config.bridgeKey) && config.bridgeKey.length >= 24 },
    redirectUri: {
      ok: redirectOk,
      value: config.redirectUri,
      localListen: Boolean(config.oauthListen),
    },
    scopes: { ok: config.scope.includes('user.task.readable') && config.scope.includes('user.task.invokable'), value: config.scope },
  };
}
