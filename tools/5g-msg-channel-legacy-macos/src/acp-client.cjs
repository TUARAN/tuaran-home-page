'use strict';

/**
 * acp-client.cjs — ACP 客户端（对接真实 WorkBuddy 引擎）
 *
 * 流程：connect → initialize → session(resume|new) → session/prompt(SSE 订阅)
 * 参考：5g-acp-sim 已全量实测的 ACP 帧细节。
 *
 * 关键经验：
 *  - connect 后所有请求需带请求头 acp-connection-id
 *  - initialize 的 Accept 必须 "application/json, text/event-stream"（只写 SSE 会 406）
 *  - sessionId 解析：--session-id > env CODEBUDDY_SESSION_ID > session/new(缓存复用)
 *  - prompt 是 SSE 长流；活动事件 session/update；结束帧 id 匹配 result{stopReason}
 */

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sessionStore = require('./session-store.cjs');
const VERSION = require('./version.cjs');

const H = { 'X-CodeBuddy-Request': '1', 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };

class AcpClient {
  /**
   * @param {object} cfg {
   *   port, sessionIdHint?, cwd, logger,
   *   onActivity: (type, detail) => void,   // thought/tool/usage/chunk 活动回调
   *   onText: (delta) => void,               // 文本增量
   * }
   */
  constructor(cfg) {
    this.port = cfg.port;
    this.cwd = cfg.cwd;
    this.log = cfg.logger || console;
    this.onActivity = cfg.onActivity || null;
    this.onText = cfg.onText || null;
    this.connectionId = null;
    this.activeSessionId = cfg.sessionIdHint || '';
    this._sessionHintSource = cfg.sessionHintSource || 'auto';  // arg|env|auto
    this._sessionSourceResume = false;   // 当前会话是否来自 resume
    this.sessionStore = cfg.sessionStore || sessionStore;
    this._seq = 0;
    this._pending = new Map();
  }

  /** 从日志/环境探测 ACP 端口（异步）：候选按可信度排序，返回第一个可连接的 */
  static detectPort(fallback = 16120) {
    return AcpClient.detectPortAsync(fallback);
  }

  /**
   * @returns {Promise<number|null>} 可用端口；全部不通时返回 null（由上层输出 FATAL 日志并决定是否降级）
   */
  static async detectPortAsync(fallback = 16120) {
    const candidates = [];
    const seen = new Set();
    const push = (p) => { p = parseInt(p, 10); if (p > 0 && !seen.has(p)) { seen.add(p); candidates.push(p); } };

    // 1) 环境变量显式指定（最高优先）
    if (process.env.ACP_PORT) push(process.env.ACP_PORT);
    if (process.env.CODEBUDDY_ACP_PORT) push(process.env.CODEBUDDY_ACP_PORT);

    // 2) WorkBuddy 注入给当前子进程的活跃会话相关端口（MCP 子进程最可信的来源）
    if (process.env.WORKBUDDY_ACP_PORT) push(process.env.WORKBUDDY_ACP_PORT);

    // 3) 日志：当前 daemon.log + 滚动 daemon.old.log（每条从新到旧）
    for (const logName of ['daemon.log', 'daemon.old.log']) {
      try {
        const s = fs.readFileSync(path.join(os.homedir(), '.workbuddy', 'logs', logName), 'utf-8');
        const m = [...s.matchAll(/acpEndpoint=http:\/\/127\.0\.0\.1:(\d+)\/api\/v1\/acp/g)];
        for (let i = m.length - 1; i >= 0; i--) push(m[i][1]);
      } catch (e) { /* 文件不存在则跳过 */ }
    }

    // 4) 常见默认端口兜底
    [16120, 16162, 38818, 47185, 58960].forEach(push);

    // 逐个 TCP 试连，返回第一个可用
    for (const port of candidates) {
      if (await AcpClient._portAlive(port)) return port;
    }
    // 最后 fallback 也做一遍 alive 检测：真的全不通就返回 null（上层做 FATAL）
    const fb = (parseInt(fallback, 10) > 0) ? parseInt(fallback, 10) : null;
    if (fb) {
      if (await AcpClient._portAlive(fb)) return fb;
    }
    return null;
  }

  /** 端口存活检测（异步 TCP connect，300ms 超时） */
  static _portAlive(port, timeoutMs = 300) {
    return new Promise((resolve) => {
      const net = require('net');
      const s = net.connect({ host: '127.0.0.1', port });
      const done = (ok) => { try { s.destroy(); } catch (e) {} resolve(ok); };
      s.on('connect', () => done(true));
      s.on('timeout', () => done(false));
      s.on('error', () => done(false));
      s.setTimeout(timeoutMs);
    });
  }

  /** 判定是否属于「连接层失效」错误（端口漂移 / 引擎重启 / socket 中断） */
  static isConnectionError(e) {
    const m = (e && e.message) ? String(e.message) : '';
    return /ECONNREFUSED|ECONNRESET|ECONNABORTED|EPIPE|socket hang up|not connected/i.test(m);
  }

  /**
   * 端口漂移自愈（v1.1.0-hotfix）：当前 ACP 端口不可达时重新探测。
   * WorkBuddy 每次重启 / 换会话都会给引擎换一个 ACP 端口，而连接器只在启动时探测一次，
   * 导致「WS 正常但消息处理必然失败（ECONNREFUSED 旧端口）」——本方法让连接器按需重探。
   * @returns {Promise<boolean>} 是否发生了端口切换（true 表示 connectionId 已被作废，需重建）
   */
  async refreshPortIfDead() {
    if (await AcpClient._portAlive(this.port)) return false;
    let found = null;
    try { found = await AcpClient.detectPortAsync(); } catch (e) { /* ignore */ }
    if (!found) {
      this.log.warn(`[acp] 端口 :${this.port} 不可达，且未能探测到其它可用 ACP 端口`);
      return false;
    }
    if (found === this.port) return false;
    this.log.mark('🔄', 'acp.port-drift-healed', `:${this.port} → :${found}`);
    this.port = found;
    this.connectionId = null;   // 旧连接属于已消失的引擎实例，必须重建
    return true;
  }

  static resolveSessionIdHint() {
    // 优先级：环境变量（引擎注入当前活跃桌面会话）> 持久化文件（上次成功 new 的）
    for (const k of ['CODEBUDDY_SESSION_ID', 'CLAUDE_SESSION_ID']) {
      if (process.env[k]) return process.env[k];
    }
    const stored = sessionStore.load();
    if (stored) return stored.sessionId;
    return '';
  }

  _headers() { return { ...H, ...(this.connectionId ? { 'acp-connection-id': this.connectionId } : {}) }; }

  _rawPost(p, body) {
    return new Promise((resolve, reject) => {
      const r = http.request({ hostname: '127.0.0.1', port: this.port, path: p, method: 'POST', headers: this._headers() }, (res) => {
        let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => resolve({ status: res.statusCode, body: d }));
      });
      r.on('error', reject);
      r.setTimeout(8000, () => r.destroy(new Error('timeout')));
      r.write(JSON.stringify(body)); r.end();
    });
  }

  _streamPost(body, onEvent) {
    return new Promise((resolve, reject) => {
      const r = http.request({ hostname: '127.0.0.1', port: this.port, path: '/api/v1/acp', method: 'POST', headers: this._headers() }, (res) => {
        let buf = '', ev = '', ld = null;
        const flushBuf = () => {
          if (buf) {
            const line = buf.replace(/\r$/, '');
            buf = '';
            if (line === '') {
              if (ev && ld) { try { onEvent(JSON.parse(ld)); } catch (e) {} }
              ev = ''; ld = null;
            } else if (!line.startsWith(':')) {
              if (line.startsWith('event:')) ev = line.slice(6).trim();
              else if (line.startsWith('data:')) ld = (ld || '') + line.slice(5).trim();
            }
            if (ev && ld) { try { onEvent(JSON.parse(ld)); } catch (e) {} }
          }
        };
        res.on('data', (chunk) => {
          buf += chunk.toString();
          let nl;
          while ((nl = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, nl).replace(/\r$/, ''); buf = buf.slice(nl + 1);
            if (line === '') {
              if (ev && ld) { try { onEvent(JSON.parse(ld)); } catch (e) {} }
              ev = ''; ld = null;
            } else if (line.startsWith(':')) {}
            else if (line.startsWith('event:')) ev = line.slice(6).trim();
            else if (line.startsWith('data:')) ld = (ld || '') + line.slice(5).trim();
          }
        });
        res.on('end', () => { flushBuf(); resolve(); });
        res.on('error', reject);
      });
      r.on('error', reject);
      r.setTimeout(120000, () => r.destroy(new Error('stream timeout')));
      r.write(JSON.stringify(body)); r.end();
    });
  }

  _request(method, params, timeoutMs = 30000) {
    const id = ++this._seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this._pending.delete(id); reject(new Error(`timeout: ${method}`)); }, timeoutMs);
      this._pending.set(id, { resolve, reject, timer });
      this._streamPost({ jsonrpc: '2.0', id, method, params }, (msg) => {
        if (msg.id !== undefined) {
          const p = this._pending.get(msg.id);
          if (!p) return;
          clearTimeout(p.timer); this._pending.delete(msg.id);
          msg.error ? p.reject(new Error(`${method}: ${JSON.stringify(msg.error).slice(0, 200)}`)) : p.resolve(msg.result);
        }
      });
    });
  }

  /** 完整握手一次：connect → initialize → 确保会话可用（幂等：已连接则跳过） */
  async ensureConnection() {
    if (this.connectionId) {
      // 端口漂移自愈（hotfix）：持有的连接可能指向已被回收的引擎端口
      if (await AcpClient._portAlive(this.port)) return;
      this.log.warn(`[acp] 持有的 ACP 连接已失效（端口 :${this.port} 不可达）→ 重新探测并重建`);
      this.connectionId = null;
    }
    await this.refreshPortIfDead();

    let c;
    try {
      c = await this._rawPost('/api/v1/acp/connect', {});
    } catch (e) {
      // 探测与连接之间引擎再次换端口（冷启动竞态）→ 再探一次并重试
      if (!AcpClient.isConnectionError(e)) throw e;
      if (!(await this.refreshPortIfDead())) throw e;
      c = await this._rawPost('/api/v1/acp/connect', {});
    }
    if (c.status !== 200) throw new Error('ACP connect HTTP ' + c.status + ' ' + c.body.slice(0, 150));
    this.connectionId = JSON.parse(c.body).connectionId;
    this.log.info(`[acp] ① connect ✓ ${this.connectionId}`);

    await this._request('initialize', {
      protocolVersion: 1, capabilities: {},
      clientInfo: { name: '5g-msg-channel', version: VERSION },
    });
    this.log.info('[acp] ② initialize ✓');
  }

  async ensureSession() {
    if (this.connectionId && this.activeSessionId) return this.activeSessionId;
    await this.ensureConnection();

    // 会话：优先 resume（hint 来自 --session-id > env > 持久化文件）；失败则 session/new 并持久化
    if (this.activeSessionId) {
      try {
        await this._request('session/resume', { cwd: this.cwd, sessionId: this.activeSessionId }, 30000);
        this._sessionSourceResume = true;    // 标记：当前会话来自 resume
        this.log.mark('✅', 'acp.session/resume', `${this.activeSessionId} (${this._sessionHintSource || 'auto'})`);
      } catch (e) {
        // 配置/持久化的会话不可用 → 自动新建（不会反复尝试坏 id；new 后持久化覆盖）
        this.log.warn(`[acp] session/resume 失败(${e.message.slice(0, 80)}) → 自动 session/new`);
        if (this._sessionHintSource !== 'auto') {
          // 显式配置(参数/env)的会话失效：提示用户可在日志确认后修改配置
          this.log.warn(`[acp] 注意: 显式配置的 sessionId(${this._sessionHintSource}) 已失效，本次改用新建会话并持久化`);
        }
        this.activeSessionId = '';
        this._sessionSourceResume = false;
      }
    }
    if (!this.activeSessionId) {
      const ns = await this._request('session/new', { cwd: this.cwd, mcpServers: [] }, 30000);
      this.activeSessionId = ns.sessionId;
      this._sessionSourceResume = false;     // 标记：当前会话来自 new
      // 持久化保存，重启后复用（新 id 覆盖旧的失效 id）
      this.sessionStore.save(this.activeSessionId, { cwd: this.cwd, source: 'new' });
      this.log.mark('✅', 'acp.session/new(已持久化)', `${this.activeSessionId} → ${this.sessionStore.STORE_FILE}`);
      const initWaitMs = parseInt(process.env.ACP_SESSION_NEW_WAIT_MS || '500', 10);
      if (initWaitMs > 0) await new Promise((r) => setTimeout(r, initWaitMs));
    }
    return this.activeSessionId;
  }

  /** 强制释放连接（任务结束后调用，避免僵尸连接堆积） */
  forceReconnect() {
    this.disconnect();
  }

  /**
   * 注入 prompt 并订阅活动事件（对外入口）。
   * 端口漂移自愈（hotfix）：连接层失效时重探 ACP 端口并整体重试一次，
   * 使「WorkBuddy 重启换了 ACP 端口」不再表现为一条必然失败的消息。
   */
  async prompt(text, opts = {}) {
    try {
      return await this._runPrompt(text, opts);
    } catch (e) {
      if (!AcpClient.isConnectionError(e)) throw e;
      this.log.warn(`[acp] 连接失效(${String(e.message).slice(0, 60)}) → 重探端口并重试一次`);
      this.connectionId = null;
      if (!(await this.refreshPortIfDead())) throw e;
      return await this._runPrompt(text, opts);
    }
  }

  /**
   * 注入 prompt 并订阅活动事件。
   * resolve 时机：收到匹配 id 的 result（end_turn）或超时。
   * 超时自动降级：若当前会话是 resume 的（可能排队），自动 session/new 重试一次。
   * @returns {Promise<{stopReason, userMessageId, typeHist, textLength, sessionId}>}
   */
  async _runPrompt(text, { timeoutMs = 90000, activity = true, allowNewRetry = false, onText, onActivity } = {}) {
    if (!this.connectionId) await this.ensureSession();
    const wasResumedSession = !!this._sessionSourceResume;

    const result = await this._promptOnce(text, { timeoutMs, activity, onText, onActivity });
    // 超时 且 用的是 resume 会话 且 允许降级 → session/new 重试一次
    if (result.timedOut && allowNewRetry && wasResumedSession) {
      this.log.warn(`[acp] resume 会话 prompt 超时 → 降级 session/new 重试`);
      try {
        this.disconnect();               // 释放旧连接
        this.activeSessionId = '';       // 强制下次 new
        await this.ensureSession();      // session/new（内部持久化）
        const retry = await this._promptOnce(text, { timeoutMs: Math.min(timeoutMs, 60000), activity, onText, onActivity });
        retry.sessionId = this.activeSessionId;
        retry.retriedOnNewSession = true;
        return retry;
      } catch (e) {
        this.log.error('[acp] session/new 重试失败:', e.message);
      }
    }
    result.sessionId = this.activeSessionId;
    return result;
  }

  /** 单次 session/prompt 发送（内部） */
  _promptOnce(text, { timeoutMs = 90000, activity = true, onText, onActivity } = {}) {
    const sid = this.activeSessionId;
    const pid = ++this._seq;
    const typeHist = {};
    let textLength = 0;
    let stopReason = null;
    let userMessageId = null;
    const textCb = onText || this.onText || null;
    const actCb = onActivity || this.onActivity || null;

    this.log.info(`[acp] ④ session/prompt 注入 textLength=${String(text).length}`);

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn, val) => { if (!settled) { settled = true; clearTimeout(timer); fn(val); } };
      const timer = setTimeout(() => {
        this.log.warn('[acp] prompt 流超时（引擎可能异步处理中，按超时返回）');
        finish(resolve, { stopReason, userMessageId, typeHist, textLength, timedOut: true });
      }, timeoutMs);

      this._streamPost(
        { jsonrpc: '2.0', id: pid, method: 'session/prompt', params: { sessionId: sid, prompt: [{ type: 'text', text }] } },
        (msg) => {
          if (msg.id === pid) {
            if (msg.result) {
              stopReason = msg.result.stopReason || null;
              userMessageId = msg.result.userMessageId || null;
              this.log.info(`[acp] ✅ prompt result: stopReason=${stopReason} msgId=${userMessageId || '-'}`);
              finish(resolve, { stopReason, userMessageId, typeHist, textLength });
            } else if (msg.error) {
              finish(reject, new Error('prompt error: ' + JSON.stringify(msg.error).slice(0, 200)));
            }
            return;
          }
          if (msg.method === 'session/update' && msg.params) {
            const u = msg.params.update || {};
            const t = u.sessionUpdate || u.kind || '?';
            typeHist[t] = (typeHist[t] || 0) + 1;
            // 文本提取：兼容多种形态 —— textDelta / text / content{type:'text',text} / content:'string'
            let cand = u.textDelta || u.text || '';
            if (!cand && u.content) {
              cand = typeof u.content === 'string' ? u.content
                   : (u.content.text || u.content.content || '');
            }
            const hist = msg.params && msg.params._meta && msg.params._meta['codebuddy.ai'] && msg.params._meta['codebuddy.ai'].mode === 'history';
            if (cand && String(cand).trim()) {
              textLength += String(cand).length;
              if (!hist && textCb) textCb(String(cand));
            }
            if (activity && actCb) actCb(t, u);
          }
        },
      ).catch((e) => finish(reject, e));
    });
  }

  /** 断开 ACP 连接 */
  disconnect() {
    for (const [id, p] of this._pending.entries()) {
      try { clearTimeout(p.timer); } catch (e) {}
      try { p.reject(new Error('acp disconnected')); } catch (e) {}
    }
    this._pending.clear();
    if (!this.connectionId) return;
    const del = http.request({ hostname: '127.0.0.1', port: this.port, path: '/api/v1/acp', method: 'DELETE', headers: this._headers() });
    del.on('error', () => {});
    del.end();
    this.connectionId = null;
  }
}

module.exports = AcpClient;
