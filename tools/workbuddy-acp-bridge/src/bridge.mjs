import { EventEmitter } from 'node:events';

export class HardwareBridge extends EventEmitter {
  constructor({ workbuddy, acp, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), localPollAttempts = 400 }) {
    super(); this.workbuddy = workbuddy; this.acp = acp;
    this.sleep = sleep; this.localPollAttempts = localPollAttempts;
    this.activeTaskId = null; this.seenEvents = new Set();
    this.localJobs = new Map(); this.localQueue = Promise.resolve();
    for (const type of ['message', 'connected', 'permission', 'protocol-error', 'error']) {
      acp.on(type, (data) => this.publish('acp.' + type, data));
    }
  }
  getLocalAssistantJob(eventId) {
    return this.localJobs.get(eventId) || null;
  }
  rememberLocalJob(eventId, value) {
    if (this.localJobs.size >= 500) this.localJobs.delete(this.localJobs.keys().next().value);
    const job = { ...(this.localJobs.get(eventId) || {}), ...value, eventId };
    this.localJobs.set(eventId, job);
    return job;
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
  async refreshAcpCredentials(taskId) {
    const task = await this.workbuddy.getTask(taskId);
    if (!task.link || !task.token) throw new Error('刷新 ACP 凭据失败：缺少 link/token');
    return { link: task.link, token: task.token };
  }

  async connectSession(taskId) {
    const task = await this.workbuddy.getTask(taskId);
    if (!task.link || !task.token) throw new Error('会话暂未返回 ACP link/token，请稍后重试');
    const result = await this.acp.connect({
      taskId,
      link: task.link,
      token: task.token,
      refreshCredentials: () => this.refreshAcpCredentials(taskId),
    });
    this.activeTaskId = taskId;
    return result;
  }
  async disconnect() {
    await this.acp.close?.();
    this.activeTaskId = null;
    this.publish('session.disconnected', { reason: 'user_logout' });
  }
  async ensureDeviceSession(text) {
    if (this.activeTaskId) return { taskId: this.activeTaskId, created: false };
    const listed = await this.workbuddy.listTasks(1, 1);
    const latest = listed?.tasks?.[0] || listed?.data?.tasks?.[0];
    if (latest?.task_id) {
      await this.connectSession(latest.task_id);
      return { taskId: latest.task_id, created: false };
    }
    const task = await this.createSession({ prompt: text, name: '短信对话' });
    await this.connectSession(task.task_id);
    return { taskId: task.task_id, created: true };
  }
  async pollLocalAssistantReply({ eventId, deviceId, messageId }) {
    for (let attempt = 0; attempt < this.localPollAttempts; attempt++) {
      const history = await this.workbuddy.listLocalAssistantMessages({ messageId });
      const messages = Array.isArray(history?.messages) ? history.messages : [];
      const reply = messages.find((item) => item?.role === 'assistant');
      if (reply) {
        this.publish('localassistant.message', { eventId, message: reply });
        this.publish('device.completed', { eventId, deviceId, route: 'localassistant', replyCount: 1 });
        return reply;
      }
      await this.sleep(1500);
    }
    throw new Error('本地助理回复等待超时');
  }
  async processLocalAssistantJob({ eventId, deviceId, text }) {
    try {
      this.rememberLocalJob(eventId, { status: 'processing' });
      const status = await this.workbuddy.getLocalAssistant();
      if (!status?.online) throw new Error('WorkBuddy 本地助理当前不在线');
      const sent = await this.workbuddy.sendLocalAssistantMessage({ content: text, msg_type: 'text' });
      if (!sent?.message_id) throw new Error('本地助理没有返回 message_id');
      this.rememberLocalJob(eventId, { status: 'processing', messageId: sent.message_id });
      this.publish('device.input', { eventId, deviceId, route: 'localassistant', text });
      const reply = await this.pollLocalAssistantReply({ eventId, deviceId, messageId: sent.message_id });
      this.rememberLocalJob(eventId, { status: 'completed', reply });
    } catch (error) {
      this.rememberLocalJob(eventId, { status: 'failed', error: error.message });
      this.publish('device.failed', { eventId, deviceId, route: 'localassistant', error: error.message });
    }
  }
  async handleDeviceEvent(input) {
    const eventId = String(input?.eventId || '').trim();
    const deviceId = String(input?.deviceId || '').trim();
    const text = String(input?.text || '').trim();
    if (!eventId || !deviceId || !text) throw new Error('eventId、deviceId、text 均为必填');
    if (this.seenEvents.has(eventId)) return { accepted: true, duplicate: true, eventId };
    if (this.seenEvents.size >= 5000) this.seenEvents.clear();
    this.seenEvents.add(eventId);
    if (input.route === 'localassistant') {
      this.rememberLocalJob(eventId, { status: 'queued', deviceId });
      this.localQueue = this.localQueue
        .catch(() => {})
        .then(() => this.processLocalAssistantJob({ eventId, deviceId, text }));
      return { accepted: true, duplicate: false, eventId, route: 'localassistant', status: 'queued' };
    }
    let taskId = input.taskId || this.activeTaskId;
    let createdSession = false;
    if (!taskId) {
      const ensured = await this.ensureDeviceSession(text);
      taskId = ensured.taskId;
      createdSession = ensured.created;
    }
    if (!this.acp.connected || this.acp.taskId !== taskId) await this.connectSession(taskId);
    this.publish('device.input', { eventId, deviceId, taskId, text, createdSession });
    if (!createdSession) {
      this.acp.prompt(text).then(
        (result) => this.publish('device.completed', { eventId, deviceId, taskId, result }),
        (error) => this.publish('device.failed', { eventId, deviceId, taskId, error: error.message }),
      );
    }
    return { accepted: true, duplicate: false, eventId, taskId, createdSession };
  }
}
