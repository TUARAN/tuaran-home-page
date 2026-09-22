import assert from 'node:assert/strict';
import test from 'node:test';
import { WorkBuddyAcpAgent } from '../src/workbuddy-acp-agent.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('official ACP adapter creates a session then waits for device.completed text', async () => {
  const previous = process.env.WORKBUDDY_BRIDGE_KEY;
  process.env.WORKBUDDY_BRIDGE_KEY = 'test-bridge-key-123456789012';
  let eventController;
  const requests = [];
  const fetchImpl = async (url, init = {}) => {
    requests.push({ url, method: init.method || 'GET', body: init.body });
    if (url.endsWith('/health')) return json({ ok: true, activeTaskId: null, acpConnected: false });
    if (url.endsWith('/v1/sessions')) return json({ task_id: 'task-1' }, 201);
    if (url.endsWith('/connect')) return json({ taskId: 'task-1', connectionId: 'conn-1' });
    if (url.endsWith('/v1/events')) {
      const stream = new ReadableStream({ start(controller) { eventController = controller; } });
      return new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
    }
    if (url.endsWith('/v1/device/events')) {
      const body = JSON.parse(init.body);
      queueMicrotask(() => {
        eventController.enqueue(new TextEncoder().encode('data: ' + JSON.stringify({
          type: 'device.completed',
          data: { eventId: body.eventId, result: { stopReason: 'end_turn', text: 'PING' } },
        }) + '\n\n'));
      });
      return json({ accepted: true, eventId: body.eventId, taskId: 'task-1' }, 202);
    }
    throw new Error(`unexpected ${url}`);
  };
  try {
    const agent = new WorkBuddyAcpAgent({
      mode: 'workbuddy-acp',
      baseUrl: 'http://127.0.0.1:8799',
      timeoutMs: 2000,
    }, fetchImpl);
    const result = await agent.run({ eventId: 'evt-1', senderId: 'self-demo', text: '请只回复 PING' });
    assert.equal(result.text, 'PING');
    assert.equal(result.runId, 'task-1');
    assert.equal(requests.some((item) => item.url.endsWith('/v1/device/events')), true);
  } finally {
    if (previous === undefined) delete process.env.WORKBUDDY_BRIDGE_KEY;
    else process.env.WORKBUDDY_BRIDGE_KEY = previous;
  }
});
