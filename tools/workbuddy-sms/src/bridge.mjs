import { randomUUID } from 'node:crypto';
import { classifyInbound, summarizeForSms, validateInbound } from './policy.mjs';

export class SmsBridge {
  constructor({ config, store, agent, channel, now = () => Date.now() }) {
    this.config = config;
    this.store = store;
    this.agent = agent;
    this.channel = channel;
    this.now = now;
  }

  async send(senderId, messageType, text, taskId) {
    const summary = summarizeForSms(text, this.config.policy.maxOutboundChars);
    return this.channel.send({ recipient: senderId, messageType, text: summary, taskId });
  }

  async handle(event) {
    const error = validateInbound(event, this.config);
    if (error) return { ok: false, status: 403, error };
    if (this.store.getEvent(event.eventId)) return { ok: true, duplicate: true, eventId: event.eventId };

    const command = classifyInbound(event.text, this.config.policy.stopWords);
    if (command.type === 'stop') {
      await this.store.acceptEvent({ eventId: event.eventId, senderId: event.senderId, receivedAt: event.receivedAt ?? this.now() });
      await this.store.setStopped(event.senderId, true);
      const outbound = await this.send(event.senderId, 'service-paused', '短信助理已暂停。回复“恢复服务”可重新启用。');
      await this.store.updateEvent(event.eventId, { status: 'completed', command: 'stop' });
      return { ok: true, command: 'stop', outbound };
    }
    if (command.type === 'resume') {
      await this.store.acceptEvent({ eventId: event.eventId, senderId: event.senderId, receivedAt: event.receivedAt ?? this.now() });
      await this.store.setStopped(event.senderId, false);
      const outbound = await this.send(event.senderId, 'service-resumed', '短信助理已恢复。');
      await this.store.updateEvent(event.eventId, { status: 'completed', command: 'resume' });
      return { ok: true, command: 'resume', outbound };
    }
    if (this.store.isStopped(event.senderId)) return { ok: false, status: 423, error: '服务已暂停；回复“恢复服务”重新启用' };
    if (!await this.store.consumeRate(event.senderId, this.now(), this.config.policy.maxEventsPerHour)) {
      return { ok: false, status: 429, error: '一小时内请求次数已达到上限' };
    }
    if (!await this.store.acceptEvent({ eventId: event.eventId, senderId: event.senderId, receivedAt: event.receivedAt ?? this.now() })) {
      return { ok: true, duplicate: true, eventId: event.eventId };
    }

    const taskId = event.taskId ?? randomUUID().slice(0, 8).toUpperCase();
    const conversationId = command.type === 'new_session'
      ? `sms-${event.senderId}-${randomUUID()}`
      : `sms-${event.senderId}`;
    await this.store.updateEvent(event.eventId, { status: 'running', taskId, conversationId, command: command.type });

    let accepted = null;
    try {
      accepted = await this.send(event.senderId, 'task-accepted', `任务 ${taskId} 已收到，正在处理。`, taskId);
      const result = await this.agent.run({
        eventId: event.eventId,
        senderId: event.senderId,
        conversationId,
        text: command.type === 'new_session' ? command.argument || '开始新对话' : command.text,
      });
      const completed = await this.send(event.senderId, 'task-completed', `任务 ${taskId} 已完成：${result.text}`, taskId);
      await this.store.updateEvent(event.eventId, { status: 'completed', runId: result.runId, completedAt: this.now() });
      return { ok: true, taskId, runId: result.runId, outbound: [accepted, completed] };
    } catch (runError) {
      await this.store.updateEvent(event.eventId, { status: 'failed', errorCode: 'AGENT_OR_CHANNEL_FAILED', completedAt: this.now() });
      let failed = null;
      try {
        failed = await this.send(event.senderId, 'task-failed', `任务 ${taskId} 未完成，请在本机检查 Agent 与短信通道状态。`, taskId);
      } catch {}
      return {
        ok: false,
        status: 502,
        taskId,
        error: 'Agent 或短信通道执行失败；详细错误仅保留在本机进程中',
        outbound: [accepted, failed].filter(Boolean),
      };
    }
  }
}
