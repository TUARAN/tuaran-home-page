import { EventEmitter } from 'node:events';
import { readSse } from './sse.mjs';

export class AcpClient extends EventEmitter {
  constructor({ fetchImpl = fetch } = {}) {
    super(); this.fetch = fetchImpl; this.nextId = 1; this.pending = new Map(); this.connected = false;
  }
  async connect({ taskId, link, token }) {
    await this.close();
    this.taskId = taskId; this.link = link; this.token = token; this.abort = new AbortController();
    const response = await this.fetch(link, {
      headers: { authorization: 'Bearer ' + token, accept: 'text/event-stream' },
      signal: this.abort.signal,
    });
    if (!response.ok || !response.body) throw new Error('ACP SSE 建连失败 (' + response.status + ')');
    this.connectionId = response.headers.get('acp-connection-id');
    if (!this.connectionId) throw new Error('ACP 响应缺少 Acp-Connection-Id');
    this.connected = true;
    this.reader = readSse(response.body, (data) => this.handle(data), this.abort.signal)
      .catch((error) => { if (error.name !== 'AbortError') this.emit('error', error); });
    await this.call('initialize', {
      protocolVersion: 1,
      clientCapabilities: { fs: { readTextFile: false, writeTextFile: false } },
      clientInfo: { name: 'workbuddy-local-hardware-bridge', version: '0.1.0' },
    });
    await this.call('session/load', { sessionId: taskId, cwd: '/workspace', mcpServers: [] });
    const state = { taskId, connectionId: this.connectionId };
    this.emit('connected', state);
    return state;
  }
  async handle(data) {
    let message;
    try { message = JSON.parse(data); }
    catch { this.emit('protocol-error', { error: 'invalid_json', data }); return; }
    this.emit('message', message);
    if (message.id !== undefined && !message.method && this.pending.has(String(message.id))) {
      const pending = this.pending.get(String(message.id));
      this.pending.delete(String(message.id)); clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(message.error.message || 'ACP JSON-RPC 错误'));
      else pending.resolve(message.result);
    }
    if (message.id !== undefined && message.method) this.emit('permission', message);
  }
  async send(payload) {
    if (!this.connected) throw new Error('ACP 尚未连接');
    const response = await this.fetch(this.link, {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + this.token,
        'content-type': 'application/json',
        'acp-connection-id': this.connectionId,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('ACP POST 失败 (' + response.status + ')');
  }
  call(method, params, timeoutMs = 30_000) {
    const id = this.nextId++;
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(String(id)); reject(new Error('ACP ' + method + ' 等待响应超时'));
      }, timeoutMs);
      this.pending.set(String(id), { resolve, reject, timer });
    });
    return this.send({ jsonrpc: '2.0', id, method, params }).then(() => promise);
  }
  prompt(text) {
    return this.call('session/prompt', {
      sessionId: this.taskId,
      prompt: [{ type: 'text', text }],
    }, 10 * 60_000);
  }
  respond(requestId, result) {
    return this.send({ jsonrpc: '2.0', id: requestId, result });
  }
  async close() {
    if (this.abort) this.abort.abort();
    this.connected = false;
    for (const item of this.pending.values()) {
      clearTimeout(item.timer); item.reject(new Error('ACP 连接已关闭'));
    }
    this.pending.clear();
  }
}

export class MockAcpClient extends EventEmitter {
  constructor() { super(); this.connected = false; this.prompts = []; }
  async connect({ taskId }) {
    this.taskId = taskId; this.connected = true;
    const state = { taskId, connectionId: 'mock-connection' };
    queueMicrotask(() => this.emit('connected', state));
    return state;
  }
  async prompt(text) {
    if (!this.connected) throw new Error('ACP 尚未连接');
    this.prompts.push(text);
    this.emit('message', {
      jsonrpc: '2.0', method: 'session/update',
      params: {
        sessionId: this.taskId,
        update: {
          sessionUpdate: 'agent_message_chunk',
          content: { type: 'text', text: 'Mock 已收到：' + text },
        },
      },
    });
    return { stopReason: 'end_turn' };
  }
  async respond(requestId, result) {
    this.emit('message', { jsonrpc: '2.0', id: requestId, result });
  }
  async close() { this.connected = false; }
}
