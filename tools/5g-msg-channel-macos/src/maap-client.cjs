'use strict';

/**
 * maap-client.cjs — 5G MaaP WS 客户端（协议完全对齐 cmicmaap OpenClaw WS v2.0）
 *
 * 帧协议（参考 5g-cli-bridge-v3.5.0 maap-5g.cjs，行为保持一致）：
 *   握手头   : X-API-Key: <apiKey>
 *   client→ : {"type":"auth","apiKey","version":"2.0"} | {"type":"ping"}
 *           | {"type":"send","apiKey","content","to"}
 *   server→ : connected | auth_ok | auth_failed | auth_required | pong
 *           | disconnected | error | text_message{content,from} | media_message{payload,from}
 *   注意：send 成功不回帧；失败回 {"type":"error"}。ping 后 10s 无 pong 判假死重连。
 *
 * 用法：见 index.cjs / bridge.cjs
 */
const fs = require('fs');
const WebSocket = require('ws');

const RECONNECT_INITIAL_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const HEARTBEAT_MS = 15000;      // 心跳间隔
const PONG_WATCHDOG_MS = 10000;  // ping 后无 pong 判假死

class MaapClient {
  /**
   * @param {object} cfg { wsUrl, apiKey, tls:{rejectUnauthorized,caFile,clientCertFile,clientKeyFile}, logger }
   */
  constructor(cfg) {
    this.wsUrl = cfg.wsUrl;
    this.apiKey = cfg.apiKey;
    this.tls = cfg.tls || {};
    this.log = cfg.logger || console;
    this.ws = null;
    this.connected = false;          // 阶段标记：auth_ok 通过（与 authed 同步，用于状态展示/日志）
    this.authed = false;             // 真实判断条件：是否已认证通过
    this.mode = cfg.mode || 'cmicmaap';   // 连接模式标识（状态快照用）
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.pongWatchdog = null;
    this._authBlocked = false;       // key 错误/无效时禁止无限重连
    this._stopped = false;
    this._sendChain = Promise.resolve();
    this._sendQueued = 0;
    this._pendingSendReject = null;

    // 回调（由 bridge 设置）
    this.onMessage = null;           // (msg) => void  归一化后的上行用户消息
    this.onConnect = null;
    this.onDisconnect = null;
    this.onFrame = null;             // (rawFrame) => void 每帧日志钩子（调试/页面）
  }

  start() {
    this._stopped = false;
    if (!this.wsUrl) { this.log.warn('[maap] MAAP_WS_URL 未配置，无法连接'); return; }
    this.log.info(`[maap] 连接 ${this.wsUrl} (key=${this.apiKey ? '***' : '(无)'})`);
    this._connect();
  }

  stop() {
    this._stopped = true;
    this._pendingSendReject?.(new Error('服务停止，发送结果未确认'));
    this._clearTimers();
    if (this.ws) { try { this.ws.close(1000, 'shutdown'); } catch (e) {} this.ws = null; }
    this.connected = false;
    this.authed = false;
  }

  _buildTlsOptions() {
    const t = this.tls;
    const opts = {};
    if (t.rejectUnauthorized === false) opts.rejectUnauthorized = false;
    const readOpt = (label, file) => {
      try { return fs.readFileSync(file); }
      catch (e) { this.log.warn(`[maap] TLS ${label} 读取失败 ${file}: ${e.message.slice(0, 80)}`); return undefined; }
    };
    if (t.caFile) { const v = readOpt('CA', t.caFile); if (v !== undefined) opts.ca = v; }
    if (t.clientCertFile) { const v = readOpt('客户端证书', t.clientCertFile); if (v !== undefined) opts.cert = v; }
    if (t.clientKeyFile) { const v = readOpt('客户端私钥', t.clientKeyFile); if (v !== undefined) opts.key = v; }
    return Object.keys(opts).length ? opts : undefined;
  }

  _connect() {
    if (this._stopped) return;
    try {
      // 代理支持：HTTPS_PROXY / HTTP_PROXY / ALL_PROXY 环境变量（真实网关经代理/VPN访问时用）
      // 用法示例：HTTPS_PROXY=http://127.0.0.1:7890 node index.cjs
      let agent = undefined;
      const proxyUrl = this.wsUrl.startsWith('wss:') ? (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.ALL_PROXY || process.env.all_proxy) : '';
      if (proxyUrl) {
        try {
          const { HttpsProxyAgent } = require('https-proxy-agent');
          agent = new HttpsProxyAgent(proxyUrl);
          this.log.info(`[maap] 经代理连接: ${proxyUrl}`);
        } catch (e) {
          this.log.warn('[maap] 代理加载失败(https-proxy-agent 未安装?)，直连', e.message.slice(0, 60));
        }
      }
      const wsOpts = {
        maxPayload: 1024 * 1024,
        handshakeTimeout: 15000,
        headers: { 'X-API-Key': this.apiKey, 'Accept-Encoding': 'identity', 'Accept': 'application/json' },
      };
      if (agent) wsOpts.agent = agent;
      const tlsOpts = this._buildTlsOptions();
      if (tlsOpts) {
        this.log.info(`[maap] TLS 自定义选项: ${Object.keys(tlsOpts).join(',')}`);
        Object.assign(wsOpts, tlsOpts);
      }
      this.ws = new WebSocket(this.wsUrl, wsOpts);
    } catch (e) {
      this.log.error('[maap] WS 创建失败', e.message);
      this._scheduleReconnect();
      return;
    }

    this.ws.on('open', () => {
      this.log.info('[maap] WS open，发送 auth');
      try { this.ws.send(JSON.stringify({ type: 'auth', apiKey: this.apiKey, version: '2.0' })); } catch (e) {}
    });

    this.ws.on('message', (raw) => this._handleFrame(raw));

    this.ws.on('close', (code, reason) => {
      this._pendingSendReject?.(new Error('网关连接断开，发送结果未确认'));
      this.connected = false;
      this.authed = false;
      this._clearHeartbeat();
      const reasonStr = reason ? reason.toString() : '';
      this.log.warn(`[maap] WS 关闭 code=${code} ${reasonStr.slice(0, 100)}`);
      if (this.onDisconnect) this.onDisconnect(`ws closed: ${code} ${reasonStr}`);
      this._scheduleReconnect();
    });
    this.ws.on('error', (err) => this.log.error('[maap] WS error', err.message));
  }

  _scheduleReconnect() {
    if (this._stopped) return;
    if (this.authed === false && this._authBlocked) {
      this.log.warn('[maap] auth 无效（key 错误），停止自动重连');
      return;
    }
    const delay = Math.min(RECONNECT_INITIAL_MS * Math.pow(2, this.reconnectAttempts), RECONNECT_MAX_MS);
    this.reconnectAttempts++;
    this.log.info(`[maap] ${delay}ms 后重连 (第${this.reconnectAttempts}次)`);
    this.reconnectTimer = setTimeout(() => this._connect(), delay);
  }

  _handleFrame(raw) {
    let j;
    try { j = JSON.parse(raw.toString()); } catch (e) {
      this.log.debug('[maap] 非 JSON 帧', raw.toString().slice(0, 200));
      return;
    }
    if (this.onFrame) this.onFrame(j);

    switch (j.type) {
      case 'connected':
        this.log.info('[maap] 收到 connected（等待 auth_ok）');
        return;
      case 'auth_ok':
        this.connected = true;
        this.authed = true;
        this.reconnectAttempts = 0;
        this.log.info('[maap] ✅ auth_ok，开始心跳');
        // 立即 ping 一次 + 启动心跳循环
        try { this.ws.send(JSON.stringify({ type: 'ping' })); } catch (e) {}
        this._startHeartbeat();
        if (this.onConnect) this.onConnect();
        return;
      case 'auth_failed':
        this.connected = false;
        this._clearHeartbeat();
        const msg = j.message || '';
        if (/无效|为空|invalid/i.test(msg)) this._authBlocked = true;
        this.log.error('[maap] ❌ auth_failed:', msg);
        try { this.ws.close(4001, 'auth_failed'); } catch (e) {}
        return;
      case 'auth_required':
        this.log.warn('[maap] auth_required：未认证收到消息');
        return;
      case 'pong':
        this._clearPongWatchdog();
        this.log.debug('[maap] pong');
        return;
      case 'disconnected':
        this.log.warn('[maap] ⚡ disconnected:', j.message);
        this.connected = false;
        this.authed = false;
        this._clearHeartbeat();
        try { this.ws.close(4001, 'disconnected'); } catch (e) {}
        return;
      case 'error':
        this._pendingSendReject?.(new Error('网关拒绝下发: ' + String(j.message || 'unknown').replaceAll(this.apiKey, '[redacted]').slice(0, 200)));
        this.log.warn('[maap] error 帧:', j.message);
        return;
      default:
        // 用户消息：*_message
        if (typeof j.type === 'string' && j.type.endsWith('_message')) {
          if (!this.authed) return;
          const m = this._normalize(j);
          if (!m) { this.log.warn('[maap] 无法解析消息帧', raw.toString().slice(0, 200)); return; }
          if (this.onMessage) this.onMessage(m);
          return;
        }
        this.log.debug('[maap] 未处理帧', raw.toString().slice(0, 150));
    }
  }

  /** 归一化（对齐参考包 _normalizeCmicMessage） */
  _normalize(j) {
    const from = j.from || j.sender || (j.phone && j.phone.number) || '';
    let text = j.content || j.text || '';
    let mediaUrl = '';
    if (!text && j.payload != null) {
      if (typeof j.payload === 'string') {
        try {
          const pj = JSON.parse(j.payload);
          text = pj.description || pj.text || pj.content || '';
          mediaUrl = pj.mediaUrl || pj.url || '';
        } catch (e) { text = j.payload; }
      } else {
        text = j.payload.description || j.payload.text || j.payload.content || '';
        mediaUrl = j.payload.mediaUrl || j.payload.url || '';
      }
    }
    const sub = String(j.type).replace(/_message$/, '');
    const type = sub === 'text' ? 'text' : (sub === 'media' ? (mediaUrl ? 'media' : 'image') : sub);
    const sender = String(from || 'system');
    if (sender === 'system' && !text) return null;  // 系统确认帧
    return {
      id: j.messageId || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender,
      type,
      text: String(text),
      mediaUrl,
      replyTarget: String(from),     // 透传，send.to 原样使用
      timestamp: new Date().toISOString(),
      raw: j,
    };
  }

  /** 回复：WS send 帧（真实网关 send 无 ack，以 ws.send 回调结果为准） */
  sendReply(recipient, text) {
    if (this._sendQueued >= 100) return Promise.reject(new Error('下发队列已满'));
    this._sendQueued++;
    const result = this._sendChain.then(() => this._sendOne(recipient, text));
    this._sendChain = result.catch(() => {});
    return result.finally(() => { this._sendQueued--; });
  }

  _sendOne(recipient, text) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.authed) return reject(new Error('5G WS 未连接/未认证'));
      let timer, settled = false;
      const finish = (error) => {
        if (settled) return; settled = true; clearTimeout(timer); this._pendingSendReject = null;
        if (error) reject(error);
        else resolve({ status: 'ws_sent', to: recipient, gatewayAccepted: null, delivered: null, errorObservationMs: 2000 });
      };
      // TEXT has no positive business ACK. Serialise sends so an error can be
      // associated with the sole observed send; later errors stay in bridge_status.
      this._pendingSendReject = finish;
      timer = setTimeout(() => finish(new Error('WebSocket 写入超时，结果未知')), 10000);
      try {
        this.ws.send(JSON.stringify({ type: 'send', apiKey: this.apiKey, content: text, to: recipient }), err => {
          if (settled) return;
          if (err) return finish(err);
          clearTimeout(timer); timer = setTimeout(() => finish(), 2000);
        });
      } catch (e) { finish(e); }
    });
  }

  _startHeartbeat() {
    this._clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
          // 武装看门狗
          this._clearPongWatchdog();
          this.pongWatchdog = setTimeout(() => {
            this.log.warn('[maap] ⚠️ ping 后 10s 无 pong，判假死 → 强制重连');
            try { this.ws.terminate(); } catch (e) {}
          }, PONG_WATCHDOG_MS);
        } catch (e) { /* ignore */ }
      }
    }, HEARTBEAT_MS);
  }

  _clearHeartbeat() {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
    this._clearPongWatchdog();
  }
  _clearPongWatchdog() {
    if (this.pongWatchdog) { clearTimeout(this.pongWatchdog); this.pongWatchdog = null; }
  }
  _clearTimers() {
    this._clearHeartbeat();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }
}

module.exports = MaapClient;
