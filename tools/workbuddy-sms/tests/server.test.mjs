import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { MockAgent } from '../src/agent.mjs';
import { SmsBridge } from '../src/bridge.mjs';
import { MockChannel } from '../src/channel.mjs';
import { handleBridgeRequest } from '../src/server.mjs';
import { signRelayEvent } from '../src/security.mjs';
import { SqliteStore } from '../src/store.mjs';

test('accepts only signed relay events through the HTTP request handler', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'workbuddy-sms-server-'));
  const config = {
    policy: {
      allowedSenders: ['self-hash'],
      maxInboundChars: 500,
      maxOutboundChars: 240,
      maxEventsPerHour: 20,
      stopWords: ['STOP'],
    },
  };
  const store = await new SqliteStore(join(directory, 'state.sqlite')).open();
  const bridge = new SmsBridge({ config, store, agent: new MockAgent(), channel: new MockChannel() });
  const secret = 'integration-test-secret';
  const rawBody = JSON.stringify({ eventId: 'signed-event-1', senderId: 'self-hash', text: 'hello' });
  const unsigned = await handleBridgeRequest({ method: 'POST', url: '/v1/events', rawBody, bridge, relaySecret: secret });
  assert.equal(unsigned.status, 401);

  const timestamp = String(Date.now());
  const signed = await handleBridgeRequest({
    method: 'POST', url: '/v1/events', rawBody, bridge, relaySecret: secret,
    headers: {
      'x-workbuddy-timestamp': timestamp,
      'x-workbuddy-signature': signRelayEvent(secret, timestamp, rawBody),
    },
  });
  assert.equal(signed.status, 200);
  assert.equal(signed.body.ok, true);
  assert.equal(store.getEvent('signed-event-1').status, 'completed');
});
