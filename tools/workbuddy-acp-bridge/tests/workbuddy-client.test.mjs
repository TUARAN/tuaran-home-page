import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkBuddyClient } from '../src/workbuddy-client.mjs';

test('OAuth URL 使用登记的回调和最小任务 scope', () => {
  const client = new WorkBuddyClient({
    config: {
      apiBaseUrl: 'https://www.workbuddy.cn/openapi/v2',
      clientId: 'app_test',
      clientSecret: 'secret',
      redirectUri: 'http://localhost:8799/oauth/callback',
      scope: 'user.task.readable user.task.invokable',
    },
    tokenStore: { read: async () => null, write: async () => {} },
  });
  const url = new URL(client.authorizationUrl('csrf-state'));
  assert.equal(url.pathname, '/openapi/v2/authorize');
  assert.equal(url.searchParams.get('state'), 'csrf-state');
  assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:8799/oauth/callback');
  assert.equal(url.searchParams.get('code_challenge'), null);
});

test('换 token 使用官方表单体，不带 Basic 和 PKCE', async () => {
  const calls = [];
  const client = new WorkBuddyClient({
    config: {
      apiBaseUrl: 'https://www.workbuddy.cn/openapi/v2',
      clientId: 'cb_test', clientSecret: 'official-secret',
      redirectUri: 'http://localhost:8080/workbuddy/api', scope: '',
    },
    tokenStore: { read: async () => null, write: async () => {} },
    fetchImpl: async (url, init) => {
      const body = init.body.toString();
      calls.push({
        url,
        body,
        authorization: init.headers.authorization || '',
        hasClientId: /(?:^|&)client_id=/.test(body),
        hasSecret: /(?:^|&)client_secret=/.test(body),
        hasVerifier: /code_verifier=/.test(body),
      });
      return new Response(JSON.stringify({ access_token: 'live', expires_in: 3600 }), { status: 200 });
    },
  });
  const token = await client.exchangeCode('auth-code');
  assert.equal(token.access_token, 'live');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].authorization, '');
  assert.equal(calls[0].hasClientId, true);
  assert.equal(calls[0].hasSecret, true);
  assert.equal(calls[0].hasVerifier, false);
  assert.match(calls[0].body, /grant_type=authorization_code/);
  assert.match(calls[0].body, /redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fworkbuddy%2Fapi/);
});

test('doctor 用假授权码探测时凭据被接受则记为 ok', async () => {
  const { probeTokenCredentials } = await import('../src/workbuddy-client.mjs');
  let calls = 0;
  const report = await probeTokenCredentials({
    apiBaseUrl: 'https://www.workbuddy.cn/openapi/v2',
    clientId: 'cb_test',
    clientSecret: 'official-secret',
    redirectUri: 'http://localhost:8080/workbuddy/api',
  }, async () => {
    calls += 1;
    return new Response(JSON.stringify({
      error: 'invalid_grant',
      error_description: 'code not found, expired or already used',
    }), { status: 400 });
  });
  assert.equal(report.ok, true);
  assert.equal(report.error, 'invalid_grant');
  assert.equal(calls, 1);
});

test('doctor 不调用文档未公开的 client_credentials grant', async () => {
  const { probeTokenCredentials } = await import('../src/workbuddy-client.mjs');
  const grants = [];
  const report = await probeTokenCredentials({
    apiBaseUrl: 'https://www.workbuddy.cn/openapi/v2',
    clientId: 'cb_test',
    clientSecret: 'official-secret',
    redirectUri: 'http://localhost:8080/workbuddy/api',
  }, async (_url, init) => {
    const body = String(init.body);
    grants.push(new URLSearchParams(body).get('grant_type'));
    return new Response(JSON.stringify({
      error: 'invalid_grant',
      error_description: 'code not found, expired or already used',
    }), { status: 400 });
  });
  assert.equal(report.ok, true);
  assert.deepEqual(grants, ['authorization_code']);
});

test('优先使用 token 响应里的 scope', async () => {
  const client = new WorkBuddyClient({
    config: {
      apiBaseUrl: 'https://www.workbuddy.cn/openapi/v2',
      clientId: 'app_test', clientSecret: 'secret',
      redirectUri: 'http://localhost:8799/oauth/callback',
      scope: 'user.task.readable user.task.invokable',
    },
    tokenStore: {
      read: async () => ({
        access_token: 'live',
        scope: 'user.task.readable user.task.invokable user.localassistant.readable',
      }),
      write: async () => {},
    },
  });
  assert.deepEqual(await client.grantedScopes(), [
    'user.task.readable',
    'user.task.invokable',
    'user.localassistant.readable',
  ]);
});

test('token 即将过期时使用 refresh_token 刷新', async () => {
  let saved = { access_token: 'old', refresh_token: 'refresh', expires_at: Date.now() - 1 };
  const calls = [];
  const client = new WorkBuddyClient({
    config: {
      apiBaseUrl: 'https://www.workbuddy.cn/openapi/v2',
      clientId: 'app_test', clientSecret: 'secret',
      redirectUri: 'http://localhost:8799/oauth/callback', scope: '',
    },
    tokenStore: { read: async () => saved, write: async (value) => { saved = value; } },
    fetchImpl: async (url, init) => {
      calls.push({ url, body: init.body.toString() });
      return new Response(JSON.stringify({ access_token: 'new', expires_in: 3600 }), { status: 200 });
    },
  });
  assert.equal(await client.accessToken(), 'new');
  assert.match(calls[0].body, /grant_type=refresh_token/);
  assert.equal(saved.refresh_token, 'refresh');
});

test('手机号验证调用官方 phoneverification 且只提交 phone_number', async () => {
  let request = null;
  const client = new WorkBuddyClient({
    config: {
      apiBaseUrl: 'https://www.workbuddy.cn/openapi/v2',
      clientId: 'app_test', clientSecret: 'secret',
      redirectUri: 'http://localhost:8080/workbuddy/api', scope: 'user.contact.readable',
    },
    tokenStore: { read: async () => ({ access_token: 'live' }), write: async () => {} },
    fetchImpl: async (url, init) => {
      request = { url, init, body: JSON.parse(init.body) };
      return new Response(JSON.stringify({ matched: true }), { status: 200 });
    },
  });
  assert.deepEqual(await client.verifyPhone('+8613812345678'), { matched: true });
  assert.match(request.url, /\/user\/phoneverification$/);
  assert.deepEqual(request.body, { phone_number: '+8613812345678' });
  assert.equal(request.init.headers.authorization, 'Bearer live');
});

test('本地助理历史支持分页和 message_id 增量查询', async () => {
  const urls = [];
  const client = new WorkBuddyClient({
    config: { apiBaseUrl: 'https://www.workbuddy.cn/openapi/v2' },
    tokenStore: { read: async () => ({ access_token: 'live' }), write: async () => {} },
    fetchImpl: async (url) => {
      urls.push(url);
      return new Response(JSON.stringify({ data: { messages: [] } }), { status: 200 });
    },
  });
  await client.listLocalAssistantMessages({ limit: 10, offset: 5 });
  await client.listLocalAssistantMessages({ messageId: 'msg-001' });
  assert.match(urls[0], /localassistant\/message\?limit=10&offset=5$/);
  assert.match(urls[1], /localassistant\/message\?message_id=msg-001$/);
});
