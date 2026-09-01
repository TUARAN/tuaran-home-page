import assert from 'node:assert/strict';
import test from 'node:test';
import { CodeBuddyAgent, readSse } from '../src/agent.mjs';

test('reads visible text from CodeBuddy SSE without exposing unrelated fields', async () => {
  const response = new Response([
    'event: progress\n',
    'data: {"data":{"text":"正在检索"}}\n\n',
    'event: completed\n',
    'data: {"result":{"text":"最终答案"}}\n\n',
  ].join(''), { headers: { 'Content-Type': 'text/event-stream' } });
  const events = [];
  assert.equal(await readSse(response, (event) => events.push(event)), '最终答案');
  assert.equal(events.length, 2);
});

test('uses the public Runs API and stable Gateway Protocol fields', async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    if (url.endsWith('/api/v1/runs')) {
      return new Response(JSON.stringify({ data: { runId: 'run-123', status: 'accepted' } }), { status: 200 });
    }
    return new Response('event: completed\ndata: {"data":{"text":"ok"}}\n\n', { status: 200 });
  };
  const agent = new CodeBuddyAgent({ baseUrl: 'http://127.0.0.1:8080', timeoutMs: 1000 }, fetchImpl);
  const result = await agent.run({ eventId: 'event-123', senderId: 'self-hash', conversationId: 'sms-self-hash', text: 'hello' });
  assert.deepEqual(result, { runId: 'run-123', text: 'ok' });
  const body = JSON.parse(requests[0].options.body);
  assert.equal(body.id, 'event-123');
  assert.equal(body.type, 'message');
  assert.equal(body.source.platform, 'sms');
  assert.equal(body.source.sender.id, 'self-hash');
  assert.equal(requests[0].options.headers['X-CodeBuddy-Request'], '1');
});
