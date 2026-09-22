import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { normalizePathname } from './config.mjs';

const PUBLIC = fileURLToPath(new URL('../public', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};
const json = (res, status, value) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
};
const safeEqual = (a, b) => {
  const x = Buffer.from(a || ''); const y = Buffer.from(b || '');
  return x.length === y.length && timingSafeEqual(x, y);
};

async function readBody(req, limit = 64 * 1024) {
  let size = 0; let data = '';
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('请求体过大');
    data += chunk;
  }
  try { return data ? JSON.parse(data) : {}; }
  catch { throw new Error('请求体必须是 JSON'); }
}

export function createBridgeHandler({ config, bridge, workbuddy, tokenStore }) {
  const states = new Map(); const clients = new Set(); const exchangingCodes = new Set();
  bridge.on('event', (event) => {
    const line = 'data: ' + JSON.stringify(event) + '\n\n';
    for (const res of clients) res.write(line);
  });
  return async function handler(req, res) {
    const url = new URL(req.url, 'http://' + (req.headers.host || (config.host + ':' + config.port)));
    try {
      const allowedOrigins = [
        'http://' + config.host + ':' + config.port,
        'http://localhost:' + config.port,
        'http://127.0.0.1:' + config.port,
        config.oauthListen?.origin,
        config.oauthListen ? 'http://127.0.0.1:' + config.oauthListen.listenPort : null,
        config.oauthListen ? 'http://localhost:' + config.oauthListen.listenPort : null,
      ].filter(Boolean);
      if (req.headers.origin && !allowedOrigins.includes(req.headers.origin)) {
        return json(res, 403, { ok: false, error: 'Origin 不允许' });
      }
      if (url.pathname === '/health') {
        const token = await tokenStore.read();
        return json(res, 200, {
          ok: true, mode: config.mode,
          authorized: config.mode === 'mock' || Boolean(token?.access_token),
          activeTaskId: bridge.activeTaskId,
          acpConnected: bridge.acp.connected,
        });
      }
      if (url.pathname === '/oauth/start') {
        if (config.mode === 'mock') { res.writeHead(302, { location: '/' }); return res.end(); }
        if (!config.oauthListen) {
          return json(res, 409, {
            ok: false,
            error: '当前入口是 5G 新消息 / Clawbot。OAuth 回调登记在云端网关，这台电脑收不到授权码。',
            callback: config.redirectUri,
          });
        }
        const request = workbuddy.createAuthorizationRequest();
        states.set(request.state, { expires: Date.now() + 10 * 60_000 });
        res.writeHead(302, { location: request.url, 'cache-control': 'no-store' });
        return res.end();
      }
      if (url.pathname === '/oauth/logout' && req.method === 'POST') {
        await bridge.disconnect();
        await tokenStore.clear();
        states.clear();
        return json(res, 200, { ok: true, authorized: false });
      }
      const oauthPath = config.oauthListen?.pathname || '/oauth/callback';
      const isOauthPath = normalizePathname(url.pathname) === oauthPath
        || normalizePathname(url.pathname) === '/oauth/callback';
      if (req.method === 'GET' && isOauthPath && (url.searchParams.get('code') || url.searchParams.get('error') || url.searchParams.get('state'))) {
        const state = url.searchParams.get('state');
        const code = url.searchParams.get('code');
        const pending = states.get(state); states.delete(state);
        const expires = typeof pending === 'number' ? pending : pending?.expires;
        if (!expires || expires < Date.now()) return json(res, 400, { ok: false, error: 'OAuth state 无效或已过期' });
        if (url.searchParams.get('error')) return json(res, 400, { ok: false, error: url.searchParams.get('error') });
        if (!code) return json(res, 400, { ok: false, error: 'OAuth 回调缺少授权码' });
        if (exchangingCodes.has(code)) {
          return json(res, 409, { ok: false, error: '授权码正在处理，请不要刷新回调页' });
        }
        exchangingCodes.add(code);
        try {
          await workbuddy.exchangeCode(code);
        } catch (error) {
          if (error?.body?.error === 'invalid_grant') {
            return json(res, 400, {
              ok: false,
              error: '授权码无效：已使用、过期，或与本次授权参数不一致。请回到本机界面重新点「连接 WorkBuddy」，不要刷新这个错误页。',
              details: error.body,
            });
          }
          if (error?.body?.error === 'unauthorized_client' || error?.body?.error === 'invalid_client') {
            return json(res, 400, {
              ok: false,
              error: '开放平台拒绝用真授权码换 token。官方返回码表将 unauthorized_client / invalid_client 指向应用状态或凭据。请平台核对应用 active 状态、Client ID/Secret 与授权码所属应用是否一致；这不是通过修改回调端口或增加 OAuth 请求参数能够解决的错误。',
              details: error.body,
            });
          }
          throw error;
        } finally {
          exchangingCodes.delete(code);
        }
        res.writeHead(302, { location: 'http://localhost:' + config.port + '/?authorized=1' });
        return res.end();
      }
      if (req.method === 'GET' && isOauthPath && normalizePathname(url.pathname) !== '/') {
        const token = await tokenStore.read();
        return json(res, 200, {
          ok: true,
          service: 'workbuddy-oauth-callback',
          authorized: config.mode === 'mock' || Boolean(token?.access_token),
        });
      }
      if (url.pathname === '/v1/events' && req.method === 'GET') {
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache, no-store',
          connection: 'keep-alive',
        });
        res.write(': connected\n\n'); clients.add(res);
        req.on('close', () => clients.delete(res)); return;
      }
      if (url.pathname === '/v1/tasks' && req.method === 'GET') {
        return json(res, 200, await workbuddy.listTasks(
          Number(url.searchParams.get('page') || 1),
          Number(url.searchParams.get('size') || 20),
        ));
      }
      if (url.pathname === '/v1/sessions' && req.method === 'POST') {
        return json(res, 201, await bridge.createSession(await readBody(req)));
      }
      const connect = url.pathname.match(/^\/v1\/sessions\/([^/]+)\/connect$/);
      if (connect && req.method === 'POST') {
        return json(res, 200, await bridge.connectSession(decodeURIComponent(connect[1])));
      }
      if (url.pathname === '/v1/device/events' && req.method === 'POST') {
        if (!safeEqual(req.headers['x-bridge-key'], config.bridgeKey)) {
          return json(res, 401, { ok: false, error: 'X-Bridge-Key 无效' });
        }
        return json(res, 202, await bridge.handleDeviceEvent(await readBody(req)));
      }
      if (url.pathname === '/v1/ui/messages' && req.method === 'POST') {
        return json(res, 202, await bridge.handleDeviceEvent(await readBody(req)));
      }
      const localJob = url.pathname.match(/^\/v1\/localassistant\/jobs\/([^/]+)$/);
      if (localJob && req.method === 'GET') {
        const job = bridge.getLocalAssistantJob(decodeURIComponent(localJob[1]));
        return job
          ? json(res, 200, job)
          : json(res, 404, { ok: false, error: '本地助理请求不存在或已过期' });
      }
      if (url.pathname === '/v1/permissions/respond' && req.method === 'POST') {
        const input = await readBody(req);
        if (input.requestId === undefined || !input.result) throw new Error('requestId 和 result 必填');
        await bridge.acp.respond(input.requestId, input.result);
        return json(res, 200, { ok: true });
      }
      if (req.method === 'GET') {
        const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        if (relative.includes('..')) return json(res, 404, { ok: false });
        const path = join(PUBLIC, relative);
        const info = await stat(path).catch(() => null);
        if (info?.isFile()) {
          res.writeHead(200, {
            'content-type': TYPES[extname(path)] || 'application/octet-stream',
            'cache-control': 'no-store',
          });
          return createReadStream(path).pipe(res);
        }
      }
      return json(res, 404, { ok: false, error: 'Not found' });
    } catch (error) {
      return json(res, error.status || 400, { ok: false, error: error.message, details: error.body });
    }
  };
}
