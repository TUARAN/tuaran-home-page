import assert from 'node:assert/strict';
import test from 'node:test';
import { pollOnce } from '../src/poller.mjs';

test('polls one cloud event, handles it locally, and acknowledges the outcome', async () => {
  const acknowledgements = [];
  const channel = {
    async next() { return { eventId: 'relay-event-1', senderId: 'self-hash', text: 'hello' }; },
    async acknowledge(eventId, outcome) { acknowledgements.push({ eventId, outcome }); },
  };
  const bridge = {
    async handle(event) { return { ok: true, handled: event.eventId }; },
  };
  assert.deepEqual(await pollOnce({ bridge, channel }), { ok: true, handled: 'relay-event-1' });
  assert.deepEqual(acknowledgements, [{ eventId: 'relay-event-1', outcome: 'completed' }]);
});

test('does not acknowledge when no queued event is available', async () => {
  const channel = { async next() { return null; } };
  assert.deepEqual(await pollOnce({ bridge: {}, channel }), { ok: true, idle: true });
});
