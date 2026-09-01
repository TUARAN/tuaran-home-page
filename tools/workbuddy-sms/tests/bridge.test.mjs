import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { MockAgent } from '../src/agent.mjs';
import { SmsBridge } from '../src/bridge.mjs';
import { MockChannel } from '../src/channel.mjs';
import { SqliteStore } from '../src/store.mjs';

async function setup(overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'workbuddy-sms-'));
  const config = {
    policy: {
      allowedSenders: ['self-hash'],
      maxInboundChars: 30,
      maxOutboundChars: 80,
      maxEventsPerHour: 2,
      stopWords: ['STOP', '退订'],
      ...overrides.policy,
    },
  };
  const store = await new SqliteStore(join(directory, 'state.sqlite')).open();
  const channel = new MockChannel();
  const bridge = new SmsBridge({ config, store, agent: overrides.agent ?? new MockAgent(), channel, now: () => 1_800_000_000_000 });
  return { bridge, channel, store };
}

test('runs a bound sender through the agent and sends accepted/completed summaries', async () => {
  const { bridge, channel, store } = await setup();
  const result = await bridge.handle({ eventId: 'event-001', senderId: 'self-hash', text: '查询今天的日程' });
  assert.equal(result.ok, true);
  assert.equal(channel.messages.length, 2);
  assert.match(channel.messages[0].text, /已收到/);
  assert.match(channel.messages[1].text, /模拟专家已处理/);
  assert.equal(store.getEvent('event-001').status, 'completed');
  assert.equal(store.getEvent('event-001').text, undefined, 'store must not retain inbound message text');
});

test('deduplicates provider events before another agent run', async () => {
  const { bridge, channel } = await setup();
  const event = { eventId: 'event-002', senderId: 'self-hash', text: '继续' };
  assert.equal((await bridge.handle(event)).ok, true);
  assert.deepEqual(await bridge.handle(event), { ok: true, duplicate: true, eventId: 'event-002' });
  assert.equal(channel.messages.length, 2);
});

test('rejects unbound senders and enforces an hourly rate limit', async () => {
  const { bridge } = await setup();
  const denied = await bridge.handle({ eventId: 'event-003', senderId: 'stranger', text: 'hello' });
  assert.equal(denied.status, 403);
  await bridge.handle({ eventId: 'event-004', senderId: 'self-hash', text: 'one' });
  await bridge.handle({ eventId: 'event-005', senderId: 'self-hash', text: 'two' });
  const limited = await bridge.handle({ eventId: 'event-006', senderId: 'self-hash', text: 'three' });
  assert.equal(limited.status, 429);
});

test('handles stop and resume before the agent', async () => {
  const { bridge, store } = await setup();
  assert.equal((await bridge.handle({ eventId: 'event-007', senderId: 'self-hash', text: 'STOP' })).command, 'stop');
  assert.equal(store.isStopped('self-hash'), true);
  assert.equal((await bridge.handle({ eventId: 'event-008', senderId: 'self-hash', text: '普通任务' })).status, 423);
  assert.equal((await bridge.handle({ eventId: 'event-009', senderId: 'self-hash', text: '恢复服务' })).command, 'resume');
  assert.equal(store.isStopped('self-hash'), false);
});

test('records failures and returns a safe failure notification', async () => {
  const agent = { async run() { throw new Error('/private/contracts/secret.txt: token=abc'); } };
  const { bridge, channel, store } = await setup({ agent });
  const result = await bridge.handle({ eventId: 'event-010', senderId: 'self-hash', text: '查询资料' });
  assert.equal(result.status, 502);
  assert.match(channel.messages.at(-1).text, /本机检查/);
  assert.doesNotMatch(JSON.stringify(result), /secret|token=abc/);
  assert.equal(store.getEvent('event-010').status, 'failed');
  assert.equal(store.getEvent('event-010').error, undefined);
});
