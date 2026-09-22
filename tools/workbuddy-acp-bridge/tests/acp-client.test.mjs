import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { AcpClient } from '../src/acp-client.mjs';

function sseHandle(connectionId) {
  let controller;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(current) { controller = current; },
  });
  return {
    response: new Response(stream, {
      status: 200,
      headers: {
        'acp-connection-id': connectionId,
        'content-type': 'text/event-stream',
      },
    }),
    push(message) {
      controller.enqueue(encoder.encode('data: ' + JSON.stringify(message) + '\n\n'));
    },
    close() {
      controller.close();
    },
  };
}

test('ACP POST 401 后重新查询任务 token 并完成 prompt', async () => {
  const streams = [];
  const tokensSeen = [];
  const postBodies = [];
  const client = new AcpClient({
    fetchImpl: async (url, init = {}) => {
      if (!init.method || init.method === 'GET') {
        const auth = init.headers.authorization;
        tokensSeen.push(auth);
        const handle = sseHandle(auth.includes('rotated') ? 'conn-2' : 'conn-1');
        streams.push(handle);
        return handle.response;
      }
      postBodies.push(JSON.parse(init.body));
      if (init.headers.authorization.includes('expired') && JSON.parse(init.body).method === 'session/prompt') {
        return new Response('', { status: 401 });
      }
      const message = JSON.parse(init.body);
      queueMicrotask(() => {
        const stream = streams.at(-1);
        if (message.method === 'session/prompt') {
          stream.push({ jsonrpc: '2.0', id: message.id, result: { stopReason: 'end_turn', text: 'PROBE_OK' } });
        } else {
          stream.push({ jsonrpc: '2.0', id: message.id, result: { ok: true } });
        }
      });
      return new Response('', { status: 200 });
    },
  });

  let refreshCount = 0;
  await client.connect({
    taskId: 'task-1',
    link: 'https://acp.example/session',
    token: 'expired-token',
    refreshCredentials: async () => {
      refreshCount += 1;
      return { link: 'https://acp.example/session', token: 'rotated-token' };
    },
  });
  const result = await client.prompt('请只回复 PROBE_OK');
  assert.equal(result.stopReason, 'end_turn');
  assert.equal(refreshCount, 1);
  assert.ok(tokensSeen.some((value) => value.includes('rotated-token')));
  assert.equal(postBodies.filter((item) => item.method === 'session/prompt').length, 2);
  await client.close();
});

test('SSE 断开后按退避重连并刷新凭据', async () => {
  const streams = [];
  let connectGets = 0;
  const client = new AcpClient({
    maxReconnectAttempts: 2,
    reconnectBaseMs: 1,
    sleepImpl: async () => {},
    fetchImpl: async (_url, init = {}) => {
      if (!init.method || init.method === 'GET') {
        connectGets += 1;
        const handle = sseHandle('conn-' + connectGets);
        streams.push(handle);
        return handle.response;
      }
      const message = JSON.parse(init.body);
      queueMicrotask(() => streams.at(-1).push({ jsonrpc: '2.0', id: message.id, result: { ok: true } }));
      return new Response('', { status: 200 });
    },
  });

  let refreshCount = 0;
  await client.connect({
    taskId: 'task-2',
    link: 'https://acp.example/session',
    token: 'token-1',
    refreshCredentials: async () => {
      refreshCount += 1;
      return { link: 'https://acp.example/session', token: 'token-' + (refreshCount + 1) };
    },
  });
  const reconnected = once(client, 'reconnected');
  streams[0].close();
  const [payload] = await reconnected;
  assert.equal(payload.taskId, 'task-2');
  assert.ok(connectGets >= 2);
  assert.ok(refreshCount >= 1);
  await client.close();
});

test('ACP POST 声明 JSON 响应并在发送失败时清理 pending', async () => {
  const stream = sseHandle('conn-406');
  let postHeaders = null;
  const client = new AcpClient({
    fetchImpl: async (_url, init = {}) => {
      if (!init.method || init.method === 'GET') return stream.response;
      postHeaders = init.headers;
      return new Response('not acceptable', { status: 406 });
    },
  });
  await assert.rejects(
    client.connect({ taskId: 'task-406', link: 'https://acp.example/session', token: 'token' }),
    /406.*not acceptable/,
  );
  assert.equal(postHeaders.accept, 'application/json, text/event-stream');
  assert.equal(client.pending.size, 0);
  await client.close();
});

test('ACP POST 的 application/json 响应可完成 JSON-RPC 调用', async () => {
  const stream = sseHandle('conn-json');
  const client = new AcpClient({
    fetchImpl: async (_url, init = {}) => {
      if (!init.method || init.method === 'GET') return stream.response;
      const message = JSON.parse(init.body);
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        result: message.method === 'session/prompt'
          ? { stopReason: 'end_turn', text: 'PROBE_OK' }
          : { ok: true },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });
  await client.connect({ taskId: 'task-json', link: 'https://acp.example/session', token: 'token' });
  const result = await client.prompt('请只回复 PROBE_OK');
  assert.equal(result.text, 'PROBE_OK');
  await client.close();
});
