import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { HardwareBridge } from '../src/bridge.mjs';
import { MockAcpClient } from '../src/acp-client.mjs';
import { MockWorkBuddyClient } from '../src/workbuddy-client.mjs';

test('设备事件接入活动 ACP 会话且按 eventId 去重', async () => {
  const workbuddy = new MockWorkBuddyClient();
  const acp = new MockAcpClient();
  const bridge = new HardwareBridge({ workbuddy, acp });
  const task = await bridge.createSession({ prompt: '建立测试会话', name: '测试' });
  await bridge.connectSession(task.task_id);

  const completed = once(bridge, 'event');
  const first = await bridge.handleDeviceEvent({
    eventId: 'evt-1', deviceId: 'device-1', text: '你好',
  });
  assert.equal(first.accepted, true);
  assert.equal(first.taskId, task.task_id);
  assert.deepEqual(acp.prompts, ['你好']);
  await completed;

  const duplicate = await bridge.handleDeviceEvent({
    eventId: 'evt-1', deviceId: 'device-1', text: '不应再次发送',
  });
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(acp.prompts, ['你好']);
});

test('没有活动会话时拒绝设备事件', async () => {
  const bridge = new HardwareBridge({
    workbuddy: new MockWorkBuddyClient(),
    acp: new MockAcpClient(),
  });
  await assert.rejects(
    bridge.handleDeviceEvent({ eventId: 'evt-2', deviceId: 'device-1', text: '你好' }),
    /没有活动会话/,
  );
});
