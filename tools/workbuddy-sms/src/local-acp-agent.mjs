import { readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';

function chunkText(update = {}) {
  return update.textDelta || update.text || (update.content?.type === 'text' ? update.content.text : '') || '';
}

function portAlive(port, timeoutMs = 300) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port: Number(port) });
    const done = (ok) => {
      try { socket.destroy(); } catch {}
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

export async function detectLocalAcpBaseUrl(preferred = 'http://127.0.0.1:50072') {
  const ports = [];
  const seen = new Set();
  const push = (value) => {
    const port = Number.parseInt(value, 10);
    if (port > 0 && !seen.has(port)) {
      seen.add(port);
      ports.push(port);
    }
  };
  try { push(new URL(preferred).port); } catch {}
  for (const name of ['ACP_PORT', 'WORKBUDDY_ACP_PORT', 'CODEBUDDY_ACP_PORT']) {
    if (process.env[name]) push(process.env[name]);
  }
  for (const logName of ['daemon.log', 'daemon.old.log']) {
    try {
      const text = readFileSync(join(homedir(), '.workbuddy', 'logs', logName), 'utf8');
      const matches = [...text.matchAll(/acpEndpoint=http:\/\/127\.0\.0\.1:(\d+)\/api\/v1\/acp/g)];
      for (let i = matches.length - 1; i >= 0; i -= 1) push(matches[i][1]);
    } catch {}
  }
  [16120, 16162, 38818, 47185, 50072, 58960].forEach(push);
  for (const port of ports) {
    if (await portAlive(port)) return `http://127.0.0.1:${port}`;
  }
  return String(preferred).replace(/\/$/, '');
}

async function readSseJson(response, { onMessage, isDone, timeoutMs, abort }) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    while (!abort.signal.aborted) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        const data = block.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        let parsed;
        try { parsed = JSON.parse(data); } catch { continue; }
        await onMessage(parsed);
        if (isDone()) return;
      }
      if (done) return;
    }
  } finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => {});
  }
}

export class LocalAcpAgent {
  constructor(config, fetchImpl = fetch) {
    this.config = config;
    this.fetch = fetchImpl;
    this.baseUrl = String(config.baseUrl || 'http://127.0.0.1:50072').replace(/\/$/, '');
    this.preferredSessionId = config.sessionId || process.env.WORKBUDDY_ACP_SESSION_ID || '';
    this.seq = 0;
    this.connectionId = '';
  }

  headers(extra = {}) {
    return {
      'X-CodeBuddy-Request': '1',
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(this.connectionId ? { 'acp-connection-id': this.connectionId } : {}),
      ...extra,
    };
  }

  async healthOnce() {
    const response = await this.fetch(`${this.baseUrl}/api/v1/acp/connect`, {
      method: 'POST',
      headers: this.headers(),
      body: '{}',
    });
    if (!response.ok) throw new Error(`本机 ACP 不可用：HTTP ${response.status}`);
    const body = await response.json();
    if (body.connectionId) {
      await this.fetch(`${this.baseUrl}/api/v1/acp`, {
        method: 'DELETE',
        headers: { ...this.headers(), 'acp-connection-id': body.connectionId },
      }).catch(() => {});
    }
    return { data: { status: 'ok', mode: 'local-acp', connected: Boolean(body.connectionId), baseUrl: this.baseUrl } };
  }

  async recoverBaseUrl(error) {
    if (!/fetch failed|ECONNREFUSED|不可用/i.test(error.message)) throw error;
    const detected = await detectLocalAcpBaseUrl(this.baseUrl);
    if (detected === this.baseUrl) throw error;
    this.baseUrl = detected;
  }

  async health() {
    try {
      return await this.healthOnce();
    } catch (error) {
      await this.recoverBaseUrl(error);
      return this.healthOnce();
    }
  }

  async connect() {
    let response;
    try {
      response = await this.fetch(`${this.baseUrl}/api/v1/acp/connect`, {
        method: 'POST',
        headers: this.headers(),
        body: '{}',
      });
    } catch (error) {
      await this.recoverBaseUrl(error);
      response = await this.fetch(`${this.baseUrl}/api/v1/acp/connect`, {
        method: 'POST',
        headers: this.headers(),
        body: '{}',
      });
    }
    if (!response.ok) throw new Error(`本机 ACP 建连失败：HTTP ${response.status}`);
    const body = await response.json();
    if (!body.connectionId) throw new Error('本机 ACP 缺少 connectionId');
    this.connectionId = body.connectionId;
    await this.request('initialize', {
      protocolVersion: 1,
      clientCapabilities: { fs: { readTextFile: false, writeTextFile: false } },
      clientInfo: { name: 'workbuddy-sms-local-acp', version: '0.1.0' },
    });
    let sessionId = this.preferredSessionId;
    if (sessionId) {
      try {
        await this.request('session/load', { sessionId, cwd: '/tmp', mcpServers: [] });
        return sessionId;
      } catch {
        sessionId = '';
      }
    }
    const created = await this.request('session/new', { cwd: '/tmp', mcpServers: [] });
    if (!created?.sessionId) throw new Error('本机 ACP 未返回 sessionId');
    return created.sessionId;
  }

  async request(method, params, { onText = () => {}, timeoutMs = this.config.timeoutMs || 120_000 } = {}) {
    const id = ++this.seq;
    const abort = new AbortController();
    let result;
    let seen = false;
    let text = '';
    const response = await this.fetch(`${this.baseUrl}/api/v1/acp`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
      signal: abort.signal,
    });
    if (!response.ok) throw new Error(`本机 ACP ${method} HTTP ${response.status}`);
    const handle = async (msg) => {
      if (msg.method && msg.id !== undefined) {
        const denied = msg.method === 'session/request_permission'
          ? { result: { outcome: { outcome: 'cancelled' } } }
          : { error: { code: -32601, message: 'Client capability not supported' } };
        await this.fetch(`${this.baseUrl}/api/v1/acp`, {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({ jsonrpc: '2.0', id: msg.id, ...denied }),
        });
        return;
      }
      if (msg.id === id && !msg.method) {
        if (msg.error) throw new Error(msg.error.message || `ACP ${method} 错误`);
        seen = true;
        result = msg.result;
        return;
      }
      if (msg.method === 'session/update') {
        const update = msg.params?.update || {};
        if (update.sessionUpdate === 'agent_message_chunk') {
          const chunk = chunkText(update);
          if (chunk) { text += chunk; onText(chunk); }
        }
      }
    };
    if ((response.headers.get('content-type') || '').includes('application/json')) {
      await handle(await response.json());
    } else {
      await readSseJson(response, {
        onMessage: handle,
        isDone: () => seen,
        timeoutMs,
        abort,
      });
    }
    if (!seen) throw new Error(`本机 ACP ${method} 未返回结果`);
    if (result && typeof result === 'object' && text && !result.text) result = { ...result, text };
    return result;
  }

  async run({ eventId, text, onEvent }) {
    const sessionId = await this.connect();
    onEvent?.({ event: 'accepted', data: { sessionId, eventId } });
    const result = await this.request('session/prompt', {
      sessionId,
      prompt: [{ type: 'text', text }],
    });
    const finalText = result?.text || '';
    if (!finalText) throw new Error('本机 ACP 执行结束，但没有可见结果');
    await this.fetch(`${this.baseUrl}/api/v1/acp`, {
      method: 'DELETE',
      headers: this.headers(),
    }).catch(() => {});
    return { runId: sessionId, text: finalText };
  }
}
