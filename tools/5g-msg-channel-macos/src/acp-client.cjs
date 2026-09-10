'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const HEADERS = { 'X-CodeBuddy-Request': '1', 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
class AcpClient {
  constructor({ port, discoverPorts, cwd, onEvent = () => {}, onPermission = async () => null, timeoutMs = 15000, persona = null, preferredSessionId = null }) {
    this.port = port; this.discoverPorts = discoverPorts; this.cwd = cwd; this.onEvent = onEvent; this.onPermission = onPermission; this.timeoutMs = timeoutMs;
    this.persona = persona; this.preferredSessionId = preferredSessionId; this.personaInjected = false;
    this.connectionId = null; this.sessionId = null; this.ready = false; this.seq = 0;
    this.phase = 'disconnected'; this.eventCounts = {}; this.lastEventAt = null; this.lastMethod = null;
    this.controllers = new Set(); this.permissionsDenied = 0; this.lastError = null;
  }
  record(kind) {
    this.eventCounts[kind] = (this.eventCounts[kind] || 0) + 1;
    this.lastEventAt = new Date().toISOString();
    if (this.eventCounts[kind] === 1) this.onEvent({ type: 'acp_event', kind });
  }
  static ports(env = process.env, home = os.homedir()) {
    const found = [];
    for (const key of ['ACP_PORT', 'WORKBUDDY_ACP_PORT', 'CODEBUDDY_ACP_PORT']) if (env[key]) found.push(Number(env[key]));
    if (env.ACP_PORT) return found.slice(0, 1);
    for (const name of ['daemon.log', 'daemon.old.log']) {
      try { const text = fs.readFileSync(path.join(home, '.workbuddy/logs', name), 'utf8');
        found.push(...[...text.matchAll(/acpEndpoint=http:\/\/127\.0\.0\.1:(\d+)\/api\/v1\/acp/g)].reverse().map(m => Number(m[1])));
      } catch {}
    }
    return [...new Set(found)].filter(p => Number.isInteger(p) && p > 0 && p < 65536);
  }
  headers() { return { ...HEADERS, ...(this.connectionId ? { 'acp-connection-id': this.connectionId } : {}) }; }
  async connect() {
    const ports = this.discoverPorts ? [...new Set(this.discoverPorts())].slice(0, 10) : [this.port];
    const errors = [];
    for (const port of ports) {
      this.port = port;
      try { return await this.connectAtPort(); }
      catch (e) {
        errors.push(`${port}: ${e.cause?.code || e.message}`);
        await this.close();
      }
    }
    throw new Error('ACP 连接失败: ' + (errors.join('; ') || '未发现候选端口'));
  }
  async connectAtPort() {
    this.phase = 'connecting';
    const res = await fetch(`http://127.0.0.1:${this.port}/api/v1/acp/connect`, { method: 'POST', headers: this.headers(), body: '{}', signal: AbortSignal.timeout(this.timeoutMs) });
    if (!res.ok) throw new Error(`ACP connect HTTP ${res.status}`);
    const body = await res.json();
    if (!body.connectionId) throw new Error('ACP 缺少 connectionId');
    this.connectionId = body.connectionId;
    // sessionToken is deliberately not logged or treated as an official OAuth token.
    this.initializeResult = await this.request('initialize', {
      protocolVersion: 1, clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
      capabilities: {}, clientInfo: { name: '5g-msg-channel-macos', version: '2.0.0' },
    });
    this.phase = 'initialized'; this.record('initialized');
    return this.initializeResult;
  }
  async ensureSession() {
    if (this.ready) return this.sessionId;
    try {
      if (!this.connectionId) await this.connect();
      let result;
      // 有历史会话则优先 session/load 恢复上下文；失败（会话不存在/方法不支持）回退 session/new
      if (this.preferredSessionId) {
        try {
          result = await this.request('session/load', { cwd: this.cwd, mcpServers: [], sessionId: this.preferredSessionId });
          this.sessionId = this.preferredSessionId; // load 响应不重复返回 sessionId
          this.onEvent({ type: 'session_loaded', session: this.sessionId.slice(0, 8) });
        } catch (e) {
          result = await this.request('session/new', { cwd: this.cwd, mcpServers: [] });
          this.sessionId = result.sessionId;
          this.onEvent({ type: 'session_new_after_load_failed', reason: e.message });
        }
      } else {
        result = await this.request('session/new', { cwd: this.cwd, mcpServers: [] });
        this.sessionId = result.sessionId;
      }
      if (!this.sessionId) throw new Error('ACP 缺少 sessionId');
      if (result.modes?.currentModeId && result.modes.currentModeId !== 'default') {
        if (!result.modes.availableModes?.some(mode => mode.id === 'default')) throw new Error('ACP 会话必须处于 default 权限确认模式');
        await this.request('session/set_mode', { sessionId: this.sessionId, modeId: 'default' });
        result.modes.currentModeId = 'default'; this.record('permission_mode_default');
      }
      this.permissionMode = result.modes?.currentModeId || 'unreported';
      this.sessionResult = result; this.ready = true; this.phase = 'session_ready'; this.record('session_ready'); this.personaInjected = false; this.lastError = null;
      return this.sessionId;
    } catch (e) { this.lastError = e.message; await this.close(); throw e; }
  }
  async request(method, params, { timeoutMs = this.timeoutMs, onText = () => {}, onHistory = () => {} } = {}) {
    this.lastMethod = method; this.record(method);
    const id = ++this.seq;
    const controller = new AbortController(); this.controllers.add(controller);
    const timer = setTimeout(() => controller.abort(new Error(`ACP ${method} timeout`)), timeoutMs);
    let result, seen = false;
    const receive = async msg => {
      if (msg.method && msg.id !== undefined) {
        // No auto-approval or proxy file/shell implementation. Unsupported requests fail closed.
        let response;
        if (msg.method === 'session/request_permission') {
          this.phase = 'awaiting_permission'; this.record('permission_requested');
          const choice = await this.onPermission(msg.params, { signal: controller.signal });
          this.phase = 'processing';
          const option = msg.params?.options?.find(o => o.optionId === choice && o.kind === 'allow_once');
          if (option) {
            this.onEvent({ type: 'permission_allowed_once', method: msg.method });
            response = { result: { outcome: { outcome: 'selected', optionId: option.optionId } } };
          } else {
            this.permissionsDenied++;
            this.onEvent({ type: 'permission_denied', method: msg.method });
            response = { result: { outcome: { outcome: 'cancelled' } } };
          }
        } else response = { error: { code: -32601, message: 'Client capability not supported' } };
        await fetch(`http://127.0.0.1:${this.port}/api/v1/acp`, { method: 'POST', headers: this.headers(), body: JSON.stringify({ jsonrpc: '2.0', id: msg.id, ...response }), signal: controller.signal }).then(async r => { await r.body?.cancel(); if (!r.ok) throw new Error(`ACP response HTTP ${r.status}`); });
        return;
      }
      if (msg.id === id && !msg.method) {
        if (msg.error) throw new Error(`ACP ${method}: ${msg.error.message || 'RPC error'}`);
        seen = true; result = msg.result; return;
      }
      if (msg.method === 'session/update' && (!msg.params.sessionId || msg.params.sessionId === this.sessionId)) {
        const u = msg.params.update || {};
        const kind = u.sessionUpdate || u.kind;
        const history = msg.params._meta?.['codebuddy.ai']?.mode === 'history';
        if (history) {
          if (kind === 'user_message_chunk' || kind === 'agent_message_chunk') {
            const text = u.textDelta || u.text || (u.content?.type === 'text' ? u.content.text : '');
            if (typeof text === 'string' && text) onHistory({ role: kind === 'user_message_chunk' ? 'user' : 'assistant', text });
          }
          return;
        }
        const safeKinds = ['agent_message_chunk', 'agent_thought_chunk', 'tool_call', 'tool_call_update', 'plan', 'current_mode_update', 'usage_update'];
        if (safeKinds.includes(kind)) {
          this.record(kind);
          if (kind === 'agent_thought_chunk') this.phase = 'thinking';
          else if (kind === 'agent_message_chunk') this.phase = 'responding';
          else if (kind === 'tool_call' || kind === 'tool_call_update') this.phase = 'tool_activity';
        }
        if (kind === 'agent_message_chunk') {
          const text = u.textDelta || u.text || (u.content?.type === 'text' ? u.content.text : '');
          if (typeof text === 'string') onText(text);
        }
        // Never expose thought text, tool arguments, or history in diagnostics.
      }
    };
    try {
      const res = await fetch(`http://127.0.0.1:${this.port}/api/v1/acp`, { method: 'POST', headers: this.headers(), body: JSON.stringify({ jsonrpc: '2.0', id, method, params }), signal: controller.signal });
      if (!res.ok) { await res.body?.cancel(); throw new Error(`ACP ${method} HTTP ${res.status}`); }
      if ((res.headers.get('content-type') || '').includes('application/json')) await receive(await res.json());
      else {
        const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf = '', data = [];
        const dispatch = async () => { if (data.length) { const raw = data.join('\n'); data = []; await receive(JSON.parse(raw)); } };
        try {
          while (!seen) {
            const { value, done } = await reader.read();
            buf += done ? decoder.decode() : decoder.decode(value, { stream: true });
            if (buf.length > 1024 * 1024) throw new Error('ACP SSE frame too large');
            let end;
            while ((end = buf.indexOf('\n')) >= 0) {
              const line = buf.slice(0, end).replace(/\r$/, ''); buf = buf.slice(end + 1);
              if (!line) await dispatch();
              else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
              if (seen) break;
            }
            if (done) { if (buf.startsWith('data:')) data.push(buf.slice(5).trim()); await dispatch(); break; }
          }
        } finally { await reader.cancel().catch(() => {}); }
      }
      if (!seen) throw new Error(`ACP ${method} stream ended without result`);
      return result;
    } finally { clearTimeout(timer); this.controllers.delete(controller); }
  }
  async prompt(text, options = {}) {
    await this.ensureSession();
    this.eventCounts = {}; this.phase = 'processing';
    const prompt = [];
    // 人格注入：仅会话内首次 prompt 前置一条（后续依赖会话历史自然保留）
    if (this.persona && !this.personaInjected) {
      prompt.push({ type: 'text', text: this.persona });
      this.personaInjected = true;
    }
    prompt.push({ type: 'text', text });
    try {
      const result = await this.request('session/prompt', { sessionId: this.sessionId, prompt }, { timeoutMs: 120000, ...options });
      this.phase = result.stopReason === 'end_turn' ? 'completed' : 'stopped'; this.record('prompt_result');
      return result;
    }
    catch (e) { this.lastError = e.message; await this.close(); throw e; } // Never replay a possibly executed task.
  }
  status() { return { backend: 'workbuddy-local-acp', transport: 'http-sse', permissionMode: this.permissionMode || null, phase: this.phase, lastMethod: this.lastMethod, eventCounts: { ...this.eventCounts }, lastEventAt: this.lastEventAt, sessionBinding: 'channel-session', ready: this.ready, port: this.port, session: this.sessionId?.slice(0, 8) || null, permissionsDenied: this.permissionsDenied, error: this.lastError }; }
  async close() {
    for (const c of this.controllers) c.abort(); this.controllers.clear();
    const cid = this.connectionId; this.connectionId = null; this.ready = false; this.sessionId = null; this.phase = this.lastError ? 'failed' : 'disconnected';
    if (cid) await fetch(`http://127.0.0.1:${this.port}/api/v1/acp`, { method: 'DELETE', headers: { ...HEADERS, 'acp-connection-id': cid }, signal: AbortSignal.timeout(3000) }).then(r => r.body?.cancel()).catch(() => {});
  }
}
module.exports = AcpClient;
