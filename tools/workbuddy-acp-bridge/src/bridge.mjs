import { EventEmitter } from 'node:events';

export class HardwareBridge extends EventEmitter {
  constructor({ workbuddy, acp }) {
    super(); this.workbuddy = workbuddy; this.acp = acp;
    this.activeTaskId = null; this.seenEvents = new Set();
    for (const type of ['message', 'connected', 'permission', 'protocol-error', 'error']) {
      acp.on(type, (data) => this.publish('acp.' + type, data));
    }
  }
  publish(type, data) {
    const event = { type, at: new Date().toISOString(), data };
    this.emit('event', event);
    return event;
  }
  async createSession(input) {
    if (!input?.prompt?.trim()) throw new Error('prompt 不能为空');
    const task = await this.workbuddy.createTask({ prompt: input.prompt.trim(), name: input.name?.trim() });
    this.publish('session.created', { ...task, token: task.token ? '[redacted]' : undefined });
    return task;
  }
  async connectSession(taskId) {
    const task = await this.workbuddy.getTask(taskId);
    if (!task.link || !task.token) throw new Error('会话暂未返回 ACP link/token，请稍后重试');
    const result = await this.acp.connect({ taskId, link: task.link, token: task.token });
    this.activeTaskId = taskId;
    return result;
  }
  async handleDeviceEvent(input) {
    const eventId = String(input?.eventId || '').trim();
    const deviceId = String(input?.deviceId || '').trim();
    const text = String(input?.text || '').trim();
    if (!eventId || !deviceId || !text) throw new Error('eventId、deviceId、text 均为必填');
    if (this.seenEvents.has(eventId)) return { accepted: true, duplicate: true, eventId };
    if (this.seenEvents.size >= 5000) this.seenEvents.clear();
    this.seenEvents.add(eventId);
    const taskId = input.taskId || this.activeTaskId;
    if (!taskId) throw new Error('没有活动会话，请先创建并连接会话，或传入 taskId');
    if (!this.acp.connected || this.acp.taskId !== taskId) await this.connectSession(taskId);
    this.publish('device.input', { eventId, deviceId, taskId, text });
    this.acp.prompt(text).then(
      (result) => this.publish('device.completed', { eventId, deviceId, taskId, result }),
      (error) => this.publish('device.failed', { eventId, deviceId, taskId, error: error.message }),
    );
    return { accepted: true, duplicate: false, eventId, taskId };
  }
}
