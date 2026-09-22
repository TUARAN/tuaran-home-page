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

test('没有活动会话时第一条设备消息自动创建并连接云任务', async () => {
  const workbuddy = new MockWorkBuddyClient();
  const acp = new MockAcpClient();
  const bridge = new HardwareBridge({ workbuddy, acp });
  const result = await bridge.handleDeviceEvent({ eventId: 'evt-2', deviceId: 'device-1', text: '你好' });
  assert.equal(result.accepted, true);
  assert.equal(result.createdSession, true);
  assert.equal(bridge.activeTaskId, result.taskId);
  assert.equal(workbuddy.tasks.length, 1);
  assert.deepEqual(acp.prompts, []);
});

test('没有活动会话但已有任务时自动恢复最近会话并发送消息', async () => {
  const workbuddy = new MockWorkBuddyClient();
  const existing = await workbuddy.createTask({ prompt: '已有任务', name: '最近会话' });
  const acp = new MockAcpClient();
  const bridge = new HardwareBridge({ workbuddy, acp });
  const result = await bridge.handleDeviceEvent({ eventId: 'evt-3', deviceId: 'device-1', text: '继续问' });
  assert.equal(result.createdSession, false);
  assert.equal(result.taskId, existing.task_id);
  assert.deepEqual(acp.prompts, ['继续问']);
});

test('退出时关闭 ACP 并清除活动会话', async () => {
  const workbuddy = new MockWorkBuddyClient();
  const acp = new MockAcpClient();
  const bridge = new HardwareBridge({ workbuddy, acp });
  const task = await bridge.createSession({ prompt: '测试退出' });
  await bridge.connectSession(task.task_id);
  await bridge.disconnect();
  assert.equal(acp.connected, false);
  assert.equal(bridge.activeTaskId, null);
});

test('本地助理路由发送消息并增量发布回复', async () => {
  const workbuddy = new MockWorkBuddyClient({
    scopes: ['user.localassistant.readable', 'user.localassistant.invokable'],
    localAssistantOnline: true,
  });
  workbuddy.listLocalAssistantMessages = async () => ({
    messages: [{ message_id: 'reply-1', role: 'assistant', content: ['LOCAL_OK'] }],
  });
  const bridge = new HardwareBridge({ workbuddy, acp: new MockAcpClient(), sleep: async () => {}, localPollAttempts: 1 });
  const seen = [];
  bridge.on('event', (event) => seen.push(event));
  const result = await bridge.handleDeviceEvent({
    eventId: 'evt-local', deviceId: 'device-1', text: '测试本地助理', route: 'localassistant',
  });
  await bridge.localQueue;
  assert.equal(result.route, 'localassistant');
  assert.ok(seen.some((event) => event.type === 'localassistant.message'));
  assert.equal(bridge.getLocalAssistantJob('evt-local').status, 'completed');
  assert.deepEqual(workbuddy.localAssistantMessages.map((item) => item.content), ['测试本地助理']);
});

test('本地助理请求串行处理且每次只发布第一条回复', async () => {
  const workbuddy = new MockWorkBuddyClient({
    scopes: ['user.localassistant.readable', 'user.localassistant.invokable'],
    localAssistantOnline: true,
  });
  let active = 0; let maxActive = 0;
  workbuddy.listLocalAssistantMessages = async () => {
    active += 1; maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setImmediate(resolve));
    active -= 1;
    return { messages: [
      { message_id: 'reply-first', role: 'assistant', content: ['FIRST'] },
      { message_id: 'reply-old', role: 'assistant', content: ['OLD'] },
    ] };
  };
  const bridge = new HardwareBridge({ workbuddy, acp: new MockAcpClient(), sleep: async () => {}, localPollAttempts: 1 });
  const replies = [];
  bridge.on('event', (event) => { if (event.type === 'localassistant.message') replies.push(event.data.message); });
  await Promise.all([
    bridge.handleDeviceEvent({ eventId: 'evt-a', deviceId: 'device-1', text: 'A', route: 'localassistant' }),
    bridge.handleDeviceEvent({ eventId: 'evt-b', deviceId: 'device-1', text: 'B', route: 'localassistant' }),
  ]);
  await bridge.localQueue;
  assert.equal(maxActive, 1);
  assert.deepEqual(replies.map((item) => item.message_id), ['reply-first', 'reply-first']);
  assert.equal(bridge.getLocalAssistantJob('evt-a').status, 'completed');
  assert.equal(bridge.getLocalAssistantJob('evt-b').status, 'completed');
});
