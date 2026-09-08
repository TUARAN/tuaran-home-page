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
