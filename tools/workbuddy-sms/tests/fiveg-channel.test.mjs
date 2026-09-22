import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { MockAgent } from '../src/agent.mjs';
import { SmsBridge } from '../src/bridge.mjs';
import { FiveGChannel } from '../src/channel.mjs';
import { validateConfig, DEFAULTS } from '../src/config.mjs';
import { handleFiveGCallbackRequest, parseWorkBuddyFiveGInbound, probeFiveGHttp, toSenderId, WORKBUDDY_5G_HTTP } from '../src/workbuddy-5g-http.mjs';
import { callFiveGMcp } from '../src/fiveg-mcp.mjs';
import { SqliteStore } from '../src/store.mjs';

async function fakeMcp({ status, onSend }) {
  const directory = await mkdtemp(join(tmpdir(), 'fiveg-mcp-'));
  const socketPath = join(directory, 'bridge.sock');
  const server = createServer((socket) => {
    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk;
      const end = buffer.indexOf('\n');
      if (end < 0) return;
      const msg = JSON.parse(buffer.slice(0, end));
      const name = msg.params?.name;
      let result;
      if (name === 'bridge_status') {
        result = { content: [{ type: 'text', text: JSON.stringify(status) }] };
      } else if (name === 'send_5g') {
        onSend?.(msg.params.arguments);
        result = { content: [{ type: 'text', text: 'sent {"ok":true}' }] };
      } else {
        socket.write(`${JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { message: `unknown ${name}` } })}\n`);
        return;
      }
      socket.write(`${JSON.stringify({ jsonrpc: '2.0', id: msg.id, result })}\n`);
    });
  });
  await new Promise((resolve) => server.listen(socketPath, resolve));
  return {
    socketPath,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await rm(directory, { recursive: true, force: true });
    },
  };
}

test('parses official WorkBuddy 5G callback payloads and ignores control frames', () => {
  const parsed = parseWorkBuddyFiveGInbound({ type: 'text_message', from: 'user-a', content: '今天天气', id: 'msg-1' });
  assert.equal(parsed.from, 'user-a');
  assert.equal(parsed.text, '今天天气');
  assert.equal(parsed.messageId, 'msg-1');
  assert.equal(parseWorkBuddyFiveGInbound({ type: 'ping' }).ignored, true);
  assert.equal(toSenderId('user-a', ['user-a']), 'user-a');
});

test('local identity probe does not recursively run channel health', async () => {
  let healthCalls = 0;
  const response = await handleFiveGCallbackRequest({
    method: 'GET',
    url: '/workbuddy/api',
    headers: { 'x-workbuddy-probe': '1' },
    bridge: { channel: { health: async () => { healthCalls += 1; return { ok: true }; } } },
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.service, 'workbuddy-5g-callback');
  assert.equal(response.body.probe, true);
  assert.equal(healthCalls, 0);
});

test('fiveg channel health requires live authed WS and send_5g goes through the unix socket', async () => {
  const sent = [];
  const fake = await fakeMcp({
    status: { wsConnected: true, wsAuthed: true, runtimeReady: true, dry: false, wsMode: 'cmicmaap', version: '1.1.0' },
    onSend: (args) => sent.push(args),
  });
  try {
    const channel = new FiveGChannel({
      socketPath: fake.socketPath,
      fivegEnv: 'production',
      clawbotBaseUrl: 'http://127.0.0.1:18789',
      senderMap: { 'self-demo': 'user-a' },
    }, {
      fetchImpl: async () => ({ status: 404 }),
      probeHttp: async () => [{ env: 'production', ok: true, status: 404, reachable: true, url: WORKBUDDY_5G_HTTP.production }],
      probeGateway: async () => ({ ok: false, listening: false, port: 18789 }),
    });
    const health = await channel.health();
    assert.equal(health.ok, true);
    assert.equal(health.simulator, false);
    assert.equal(health.socket.wsAuthed, true);
    const result = await channel.send({ recipient: 'self-demo', text: '真实回复' });
    assert.equal(result.ok, true);
    assert.deepEqual(sent, [{ to: 'user-a', text: '真实回复' }]);
  } finally {
    await fake.close();
  }
});

test('local /workbuddy/api callback injects a real 5G send after the agent run', async () => {
  const sent = [];
  const fake = await fakeMcp({
    status: { wsConnected: true, wsAuthed: true, runtimeReady: true, dry: false },
    onSend: (args) => sent.push(args),
  });
  const directory = await mkdtemp(join(tmpdir(), 'fiveg-cb-'));
  try {
    const config = {
      policy: {
        allowedSenders: ['self-demo'],
        maxInboundChars: 500,
        maxOutboundChars: 80,
        maxEventsPerHour: 20,
        stopWords: ['STOP'],
      },
    };
    const store = await new SqliteStore(join(directory, 'state.sqlite')).open();
    const channel = new FiveGChannel({
      socketPath: fake.socketPath,
      senderMap: { 'self-demo': 'user-a' },
    }, {
      fetchImpl: async () => ({ status: 404 }),
      probeHttp: async () => [],
      probeGateway: async () => ({ ok: false }),
    });
    const bridge = new SmsBridge({ config, store, agent: new MockAgent(), channel });
    const denied = await handleFiveGCallbackRequest({
      method: 'POST',
      url: '/workbuddy/api',
      headers: { 'x-api-key': 'wrong' },
      rawBody: JSON.stringify({ type: 'text_message', from: 'self-demo', content: '查日程', id: 'evt-live-1' }),
      bridge,
      callbackKey: 'callback-secret',
    });
    assert.equal(denied.status, 401);
    const accepted = await handleFiveGCallbackRequest({
      method: 'POST',
      url: '/workbuddy/api',
      headers: { 'x-api-key': 'callback-secret' },
      rawBody: JSON.stringify({ type: 'text_message', from: 'self-demo', content: '查日程', id: 'evt-live-1' }),
      bridge,
      callbackKey: 'callback-secret',
    });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.ok, true);
    assert.equal(sent.length, 2);
    assert.equal(sent[0].to, 'user-a');
    assert.match(sent[0].text, /已收到/);
    assert.match(sent[1].text, /模拟专家已处理/);
  } finally {
    await fake.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('validateConfig accepts the official fiveg callback catalog and rejects public binds', () => {
  const config = validateConfig({
    ...DEFAULTS,
    channel: {
      ...DEFAULTS.channel,
      provider: 'fiveg',
      fivegEnv: 'local',
      callbackHost: '127.0.0.1',
      callbackPort: 8080,
      clawbotBaseUrl: 'http://127.0.0.1:18789',
    },
  });
  assert.equal(config.channel.provider, 'fiveg');
  assert.equal(WORKBUDDY_5G_HTTP.production, 'https://5gvas01.cmicmaap.com/gtw-ai/workbuddy/api');
  assert.throws(() => validateConfig({
    ...DEFAULTS,
    channel: { ...DEFAULTS.channel, callbackHost: '0.0.0.0' },
  }), /callbackHost/);
});

test('local callback probe rejects another service that happens to return HTTP 200', async () => {
  const oauth = await probeFiveGHttp('local', async () => new Response(JSON.stringify({
    ok: true,
    service: 'workbuddy-oauth-callback',
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  }));
  assert.equal(oauth.reachable, true);
  assert.equal(oauth.ok, false);
  assert.equal(oauth.serviceMatch, false);
  assert.match(oauth.error, /不是 workbuddy-sms/);

  const callback = await probeFiveGHttp('local', async () => new Response(JSON.stringify({
    ok: true,
    service: 'workbuddy-5g-callback',
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  }));
  assert.equal(callback.ok, true);
  assert.equal(callback.serviceMatch, true);
});

test('callFiveGMcp talks newline JSON-RPC to the unix socket', async () => {
  const fake = await fakeMcp({
    status: { wsAuthed: true, runtimeReady: true, dry: false },
  });
  try {
    const status = await callFiveGMcp({ socketPath: fake.socketPath, name: 'bridge_status' });
    assert.equal(status.wsAuthed, true);
  } finally {
    await fake.close();
  }
});
