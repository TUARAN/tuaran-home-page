import assert from 'node:assert/strict';
import test from 'node:test';
import { LocalAcpAgent } from '../src/local-acp-agent.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('local ACP adapter loads a new session and returns prompt text', async () => {
  const methods = [];
  const fetchImpl = async (url, init = {}) => {
    if (url.endsWith('/api/v1/acp/connect')) return json({ connectionId: 'conn-1' });
    if (init.method === 'DELETE') return new Response('', { status: 200 });
    const message = JSON.parse(init.body);
    methods.push(message.method);
    if (message.method === 'initialize') return json({ jsonrpc: '2.0', id: message.id, result: { protocolVersion: 1 } });
    if (message.method === 'session/new') return json({ jsonrpc: '2.0', id: message.id, result: { sessionId: 'sess-1' } });
    if (message.method === 'session/prompt') {
      return json({ jsonrpc: '2.0', id: message.id, result: { stopReason: 'end_turn', text: 'PING' } });
    }
    throw new Error(`unexpected ${message.method}`);
  };
  const agent = new LocalAcpAgent({
    mode: 'local-acp',
    baseUrl: 'http://127.0.0.1:50072',
    timeoutMs: 2000,
  }, fetchImpl);
  const health = await agent.health();
  assert.equal(health.data.mode, 'local-acp');
  const result = await agent.run({ eventId: 'evt-2', text: '请只回复 PING' });
  assert.equal(result.runId, 'sess-1');
  assert.equal(result.text, 'PING');
  assert.deepEqual(methods.filter(Boolean).slice(0, 3), ['initialize', 'session/new', 'session/prompt']);
});

test('local ACP adapter cancels permission requests instead of auto-approving', async () => {
  const replies = [];
  const fetchImpl = async (url, init = {}) => {
    if (url.endsWith('/api/v1/acp/connect')) return json({ connectionId: 'conn-2' });
    if (init.method === 'DELETE') return new Response('', { status: 200 });
    const message = JSON.parse(init.body || '{}');
    if (message.result || message.error) {
      replies.push(message);
      return json({ ok: true });
    }
    if (message.method === 'initialize') return json({ jsonrpc: '2.0', id: message.id, result: {} });
    if (message.method === 'session/new') return json({ jsonrpc: '2.0', id: message.id, result: { sessionId: 'sess-2' } });
    if (message.method === 'session/prompt') {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: ' + JSON.stringify({
            jsonrpc: '2.0',
            id: 'perm-1',
            method: 'session/request_permission',
            params: { options: [{ optionId: 'allow', kind: 'allow_once' }] },
          }) + '\n\n'));
          controller.enqueue(encoder.encode('data: ' + JSON.stringify({
            jsonrpc: '2.0',
            id: message.id,
            result: { stopReason: 'end_turn', text: 'cancelled-ok' },
          }) + '\n\n'));
          controller.close();
        },
      });
      return new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
    }
    return json({});
  };
  const agent = new LocalAcpAgent({ baseUrl: 'http://127.0.0.1:50072', timeoutMs: 2000 }, fetchImpl);
  const result = await agent.run({ eventId: 'evt-3', text: '需要权限吗' });
  assert.equal(result.text, 'cancelled-ok');
  assert.equal(replies[0].result.outcome.outcome, 'cancelled');
});
