import { EventEmitter } from 'node:events';
import { readSse } from './sse.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isAbortError(error) {
  return error?.name === 'AbortError' || /aborted|AbortError/i.test(String(error?.message || ''));
}

export class AcpClient extends EventEmitter {
  constructor({
    fetchImpl = fetch,
    maxReconnectAttempts = 5,
    reconnectBaseMs = 400,
    sleepImpl = sleep,
  } = {}) {
    super();
    this.fetch = fetchImpl;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectBaseMs = reconnectBaseMs;
    this.sleep = sleepImpl;
    this.nextId = 1;
    this.pending = new Map();
    this.connected = false;
    this.generation = 0;
    this.intendedClose = true;
    this.reconnecting = false;
    this.refreshing = false;
    this.refreshCredentials = null;
  }

  async connect({ taskId, link, token, refreshCredentials } = {}) {
    this.taskId = taskId;
    this.refreshCredentials = refreshCredentials ?? this.refreshCredentials;
    await this.openSse({ link, token }, { allowRefresh: true });
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

  async openSse({ link, token }, { allowRefresh = false } = {}) {
    this.generation += 1;
    const generation = this.generation;
    this.intendedClose = true;
    this.abortStream();
    this.intendedClose = false;
    this.link = link;
    this.token = token;
    this.abort = new AbortController();
    let response = await this.fetch(link, {
      headers: { authorization: 'Bearer ' + token, accept: 'text/event-stream' },
      signal: this.abort.signal,
    });
    if (response.status === 401 && allowRefresh && this.refreshCredentials) {
      const creds = await this.refreshCredentials();
      if (!creds?.link || !creds?.token) throw new Error('刷新 ACP 凭据失败：缺少 link/token');
      this.link = creds.link;
      this.token = creds.token;
      response = await this.fetch(this.link, {
        headers: { authorization: 'Bearer ' + this.token, accept: 'text/event-stream' },
        signal: this.abort.signal,
      });
    }
    if (!response.ok || !response.body) throw new Error('ACP SSE 建连失败 (' + response.status + ')');
    this.connectionId = response.headers.get('acp-connection-id');
    if (!this.connectionId) throw new Error('ACP 响应缺少 Acp-Connection-Id');
    this.connected = true;
    this.reader = readSse(response.body, (data) => this.handle(data), this.abort.signal)
      .catch((error) => {
        if (!isAbortError(error) && !this.intendedClose && generation === this.generation) {
          this.emit('error', error);
        }
      })
      .finally(() => {
        if (generation === this.generation && !this.intendedClose) void this.scheduleReconnect();
      });
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

  async send(payload, retried = false) {
    if (!this.connected) throw new Error('ACP 尚未连接');
    const response = await this.fetch(this.link, {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + this.token,
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
        'acp-connection-id': this.connectionId,
      },
      body: JSON.stringify(payload),
    });
    if (response.status === 401 && !retried && this.refreshCredentials && !this.refreshing) {
      await this.refreshAndReconnect();
      return this.send(payload, true);
    }
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).trim().slice(0, 500);
      throw new Error('ACP POST 失败 (' + response.status + ')' + (detail ? '：' + detail : ''));
    }
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
      const body = await response.json().catch(() => null);
      const messages = Array.isArray(body) ? body : [body];
      for (const message of messages) {
        if (message) await this.handle(JSON.stringify(message));
      }
    } else if (contentType.includes('text/event-stream') && response.body) {
      await readSse(response.body, (data) => this.handle(data));
    }
  }

  async refreshAndReconnect() {
    if (!this.refreshCredentials) throw new Error('ACP token 已失效，且没有刷新回调');
    this.refreshing = true;
    try {
      const creds = await this.refreshCredentials();
      if (!creds?.link || !creds?.token) throw new Error('刷新 ACP 凭据失败：缺少 link/token');
      await this.connect({
        taskId: this.taskId,
        link: creds.link,
        token: creds.token,
        refreshCredentials: this.refreshCredentials,
      });
    } finally {
      this.refreshing = false;
    }
  }

  async scheduleReconnect() {
    if (this.intendedClose || this.reconnecting) return;
    const generation = this.generation;
    this.connected = false;
    this.emit('disconnected', { taskId: this.taskId });
    this.abortStream({ rejectPending: true, reason: 'ACP 连接已断开' });
    this.reconnecting = true;
    try {
      for (let attempt = 0; attempt < this.maxReconnectAttempts; attempt++) {
        if (this.intendedClose || generation !== this.generation) return;
        await this.sleep(this.reconnectBaseMs * (2 ** attempt));
        if (this.intendedClose || generation !== this.generation) return;
        try {
          let creds = { link: this.link, token: this.token };
          if (this.refreshCredentials) creds = await this.refreshCredentials();
          await this.connect({
            taskId: this.taskId,
            link: creds.link,
            token: creds.token,
            refreshCredentials: this.refreshCredentials,
          });
          this.emit('reconnected', { taskId: this.taskId, attempt: attempt + 1 });
          return;
        } catch (error) {
          this.emit('reconnect-failed', { attempt: attempt + 1, error: error.message });
        }
      }
      this.emit('error', new Error('ACP SSE 重连失败'));
    } finally {
      this.reconnecting = false;
    }
  }

  call(method, params, timeoutMs = 30_000) {
    const id = this.nextId++;
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(String(id)); reject(new Error('ACP ' + method + ' 等待响应超时'));
      }, timeoutMs);
      this.pending.set(String(id), { resolve, reject, timer });
    });
    return this.send({ jsonrpc: '2.0', id, method, params })
      .catch((error) => {
        const pending = this.pending.get(String(id));
        if (pending) {
          clearTimeout(pending.timer);
          this.pending.delete(String(id));
        }
        throw error;
      })
      .then(() => promise);
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

  abortStream({ rejectPending = false, reason = 'ACP 连接已关闭' } = {}) {
    if (this.abort) this.abort.abort();
    this.connected = false;
    if (rejectPending) {
      for (const item of this.pending.values()) {
        clearTimeout(item.timer); item.reject(new Error(reason));
      }
      this.pending.clear();
    }
  }

  async close() {
    this.generation += 1;
    this.intendedClose = true;
    this.abortStream({ rejectPending: true });
  }
}

export class MockAcpClient extends EventEmitter {
  constructor() { super(); this.connected = false; this.prompts = []; this.connectCount = 0; }
  async connect({ taskId, refreshCredentials } = {}) {
    this.taskId = taskId;
    this.refreshCredentials = refreshCredentials;
    this.connected = true;
    this.connectCount += 1;
    const state = { taskId, connectionId: 'mock-connection' };
    queueMicrotask(() => this.emit('connected', state));
    return state;
  }
  async prompt(text) {
    if (!this.connected) throw new Error('ACP 尚未连接');
    this.prompts.push(text);
    const reply = 'Mock 已收到：' + text;
    this.emit('message', {
      jsonrpc: '2.0', method: 'session/update',
      params: {
        sessionId: this.taskId,
        update: {
          sessionUpdate: 'agent_message_chunk',
          content: { type: 'text', text: reply },
        },
      },
    });
    return { stopReason: 'end_turn', text: reply };
  }
  async respond(requestId, result) {
    this.emit('message', { jsonrpc: '2.0', id: requestId, result });
  }
  async close() { this.connected = false; }
}
