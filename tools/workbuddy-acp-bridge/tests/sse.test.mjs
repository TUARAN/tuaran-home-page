import test from 'node:test';
import assert from 'node:assert/strict';
import { readSse } from '../src/sse.mjs';

test('解析跨 chunk 和多行 data 的 SSE', async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('event: message\r\ndata: {"a":'));
      controller.enqueue(encoder.encode('1}\r\n\r\ndata: line-1\ndata: line-2\n\n'));
      controller.close();
    },
  });
  const events = [];
  await readSse(stream, (data) => events.push(data));
  assert.deepEqual(events, ['{"a":1}', 'line-1\nline-2']);
});
