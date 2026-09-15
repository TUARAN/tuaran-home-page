'use strict';

/**
 * index.cjs — 5g-msg-channel 连接器入口 v2.1
 *
 * 变更 (v2.1 WorkBuddy MCP 视角):
 *   - MCP stdio 监听器在同步阶段立即 attach({ deferred: true })，
 *     不会错过 WorkBuddy 第一时间发送的 initialize/tools/list 握手帧。
 *   - ACP 端口探测失败（全部端口不通）时记 FATAL，不启动 MAAP WS，
 *     MCP bridge_status 返回 runtimeReady=false + acpError 结构化说明，
 *     避免无意义消耗网关连接配额。
 *   - sessionId resume 失败：显式配置（arg/env）打 warn，auto（持久化/CODEBUDDY）打 info。
 *   - 日志文件 banner 永远同步输出，方便用户找 "connector\logs\channel-YYYY-MM-DD.log"。
 *
 * 用法：
 *   # 对接模拟器联调（本地验证闭环）
 *   node index.cjs --mock
 *
 *   # 对接真实 cmicmaap 网关
 *   MAAP_API_KEY=ak_xxx node index.cjs
 *
 * 环境变量（详见 config.cjs 或 docs）：
 *   MAAP_WS_URL / MAAP_API_KEY
 *   ACP_PORT (0 自动探测) / ACP_SESSION_ID / ACP_CWD / ACP_SESSION_NEW_WAIT_MS (默认 500)
 *   BRIDGE_MAX_QUEUE / TASK_TIMEOUT_MS / BRIDGE_IDLE_RECONNECT_MS
 *   LOG_LEVEL / LOG_DIR / CHANNEL_LOG_FILE
 *   NO_PROGRESS=1 / PHONE_PROGRESS=0 / BRIDGE_SELFTEST_TEXT=xxx
 *   HTTPS_PROXY（通过公司代理访问真实 wss 网关时）
 *   MAAP_TLS_*（私签 CA / 双向 TLS）
 */

const config = require('./config.cjs');
const MaapClient = require('./maap-client.cjs');
const AcpClient = require('./acp-client.cjs');
const Bridge = require('./bridge.cjs');
const McpServerLib = require('./mcp-server.cjs');
const heartbeat = require('./heartbeat.cjs');
const logger = require('./logger.cjs');
const VERSION = require('./version.cjs');
const sessionStore = require('./session-store.cjs');
const uiSession = require('./ui-session.cjs');
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const crypto = require('crypto');

// ============== 同步阶段（必须立即执行，不能包 async）：banner + MCP deferred attach ==============

const MOCK = process.argv.includes('--mock');
const DAEMON = process.argv.includes('--daemon');   // daemon 守护模式：由 watchdog 拉起，stdin 关闭不自杀
const WS_URL = MOCK
  ? (process.env.MOCK_WS_URL || 'ws://127.0.0.1:8066/ws')
  : config.maap.wsUrl;
const API_KEY = config.maap.apiKey || (MOCK ? 'test-api-key' : '');
const ALLOWED_SENDERS = config.allowedSenders;
const ENFORCE_WHITELIST = true;

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : '';
}
const SESSION_ID = argValue('--session-id') || config.acp.sessionId || AcpClient.resolveSessionIdHint();
const SESSION_SOURCE = argValue('--session-id') ? 'arg' : (config.acp.sessionId ? 'env' : 'auto');
const ACP_CWD = config.acp.cwd;
const SELFTEST = config.selftest;
const DRY = process.env.BRIDGE_DRY !== '0';

// -------- 1) MCP stdio 同步阶段立即 attach（deferred 模式）————— WorkBuddy 握手帧绝不丢 --------
// daemon 模式：keepAliveOnStdinEnd=true，MCP stdin 关闭不影响桥接（由 watchdog 保活）
const mcpHandle = McpServerLib && typeof McpServerLib.attach === 'function'
  ? McpServerLib.attach({ logger, dry: DRY, version: VERSION, deferred: true, keepAliveOnStdinEnd: DAEMON })
  : null;

// -------- 2) 启动 banner（永远同步输出，保证"只要进程没崩"就有第一笔可追踪日志）--------
logger.info('==================================================');
logger.mark('🚀', '5g-msg-channel', `v${VERSION} 连接器启动`);
logger.info(` 模式: ${MOCK ? '模拟器联调(8066)' : '真实网关'} | WS=${WS_URL}${DAEMON ? ' | 运行形态: daemon(守护)' : ''}`);
logger.info(` ACP: :${config.acp.port > 0 ? config.acp.port : '(自动探测中…)'} | session=${SESSION_ID ? (SESSION_SOURCE + ':' + SESSION_ID.slice(0, 8)) : '(自动 new + 持久化)'} | cwd=${ACP_CWD}`);
logger.info(` 上下文复用: ${uiSession.describeMode()}`);
logger.info(` 日志文件: ${logger.LOG_FILE}`);
logger.info(` 白名单: 强制开启(${ALLOWED_SENDERS.length} 个目标)`);
if (mcpHandle) logger.info('[mcp] stdio 监听已挂起 (deferred)，等待 MAAP/ACP 装配完成');
logger.info('==================================================');

// ============== 异步阶段：ACP 端口探测 → 装配 → setRuntime ==============

let maap = null, acp = null, bridge = null;   // 模块级，供 graceful shutdown 访问
let _hbStop = null;                            // 心跳循环 stop 句柄
let acpStartupError = null;                    // ACP 无法使用时，MCP bridge_status 结构化返回
let acpStartupPort = null;                     // 实际探测到的 ACP 端口（含 null 表示未探测到）
let ipcServer = null;
let leaseServer = null;
const SOCKET_PATH = process.env.BRIDGE_SOCKET || path.join(os.homedir(), '.workbuddy', '5g-legacy-macos.sock');

// ---- UI 会话绑定器（5G 消息复用当前 UI 对话上下文）：实现见 src/ui-session.cjs ----
// 显式指定 ACP_UI_SESSION_ID/ACP_SESSION_ID 优先；否则 ACP_FOLLOW_UI=1（默认）自动跟随当前 UI 对话。
let acpPortResolved = 0;                            // 实际探测到的 ACP 端口（绑定器工厂读取）
const uiBinder = uiSession.BIND_UI_SESSION
  ? uiSession.createUiBinder({
      AcpClient, logger, acpCwd: ACP_CWD,
      explicitSessionId: config.acp.sessionId,
      getPort: () => acpPortResolved,
    })
  : null;

async function listen(server, target, host) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    host ? server.listen(target, host, resolve) : server.listen(target, resolve);
  });
}

(async () => {
  if (DAEMON) {
    leaseServer = net.createServer((socket) => socket.destroy());
    await listen(leaseServer, Number(process.env.BRIDGE_LEASE_PORT || 18567), '127.0.0.1');
    try { fs.unlinkSync(SOCKET_PATH); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  // ---- ACP 端口探测（env 显式指定直接走探测 + alive，否则走日志/默认列表）----
  let ACP_PORT = null;
  try {
    ACP_PORT = config.acp.port > 0
      ? ((await AcpClient._portAlive(config.acp.port)) ? config.acp.port : null)
      : await AcpClient.detectPortAsync();
  } catch (e) {
    logger.error('[index] ACP 端口探测异常:', e.message);
  }
  acpStartupPort = ACP_PORT;

  if (ACP_PORT == null) {
    acpStartupError = {
      code: 'ACP_PORT_DETECT_FAILED',
      message: 'WorkBuddy ACP 引擎不可达：所有候选端口（env 显式指定/daemon.log 解析/常见默认端口）均 TCP 不通。请确认 WorkBuddy 已登录且在运行；或在 mcp.json env 设置 ACP_PORT=<实际端口>。',
      hint: 'PowerShell 执行:  Get-Content ~/.workbuddy/logs/daemon.log | Select-String acpEndpoint  找最后一行端口号',
    };
    logger.error('[index] 💥 FATAL: ACP 端口探测全部失败，连接器将进入降级模式（MAAP WS 不启动，仅响应 MCP bridge_status / bridge_version 用于排障）。');
    logger.error('         ' + acpStartupError.message);
    if (mcpHandle) mcpHandle.setRuntime({ maap: null, bridge: null, dry: DRY, version: VERSION, logger, error: acpStartupError });
    // 仍然异步暴露全局，方便 SIGINT 正常 shutdown
    acp = null; bridge = null; maap = null;
    return;
  }

  logger.info(` ACP 端口确认: :${ACP_PORT}`);
  acpPortResolved = ACP_PORT;

  // ---- 实例化 ----
  maap = new MaapClient({
    wsUrl: WS_URL,
    apiKey: API_KEY,
    tls: MOCK ? {} : config.maap.tls,
    logger,
    mode: MOCK ? 'cmicmaap-mock' : 'cmicmaap',
  });
  acp = new AcpClient({
    port: ACP_PORT,
    cwd: ACP_CWD,
    sessionIdHint: SESSION_ID,
    sessionHintSource: SESSION_SOURCE,
    logger,
  });
  bridge = new Bridge({
    maap, acp, logger,
    // 共享会话模式：所有发送者共用「当前 UI 会话」，5G 消息因此进入当前对话的上下文
    makeSharedAcp: uiBinder ? uiBinder.makeUiBoundAcp : null,
    makeAcp: (target) => {
      const senderDir = path.join(ACP_CWD, crypto.createHash('sha256').update(String(target)).digest('hex').slice(0, 24));
      fs.mkdirSync(senderDir, { recursive: true, mode: 0o700 });
      const store = sessionStore.create(path.join(senderDir, 'session.json'));
      const saved = store.load();
      return new AcpClient({
        port: ACP_PORT, cwd: senderDir, sessionIdHint: saved ? saved.sessionId : '',
        sessionHintSource: 'auto', sessionStore: store, logger,
      });
    },
    options: {
      maxQueue: config.bridge.maxQueue,
      idleReconnectMs: config.bridge.idleReconnectMs,
      noProgressReceipt: config.bridge.noProgressReceipt,
      progressReceipt: config.bridge.phoneProgress,
      taskTimeoutMs: config.bridge.taskTimeoutMs,
      dry: DRY,
      allowedSenders: ALLOWED_SENDERS,
    },
  });

  // ---- MCP runtime 装配（deferred → ready）----
  if (mcpHandle) mcpHandle.setRuntime({ maap, bridge, dry: DRY, version: VERSION, logger });

  if (DAEMON) {
    ipcServer = net.createServer((socket) => {
      socket.on('error', () => {});
      McpServerLib.attach({ maap, bridge, logger, dry: DRY, version: VERSION, input: socket, output: socket, keepAliveOnStdinEnd: true });
    });
    await listen(ipcServer, SOCKET_PATH);
    fs.chmodSync(SOCKET_PATH, 0o600);
    logger.info(`[mcp] 共享后台 socket 已就绪: ${SOCKET_PATH}`);
  }

  // ---- 接线 ----
  maap.onConnect = () => { logger.info('✅ 5G WS 已连接(auth_ok)，开始接收消息'); };
  maap.onDisconnect = (r) => { logger.warn('⚠️ 5G WS 断开:', r); };
  maap.onMessage = (msg) => {
    if (!msg.replyTarget || !msg.text.trim()) {
      logger.debug('[index] 丢弃无目标/空消息');
      return;
    }
    if (!ALLOWED_SENDERS.includes(msg.replyTarget)) {
      logger.warn(`[index] 拦截非白名单号码: ${msg.replyTarget}`);
      return;
    }
    bridge.enqueue(msg);
  };
  maap.onFrame = (j) => { if (MOCK && j.type) logger.debug('[ws帧]', j.type); };

  // ---- ACP 预握手一次，暴露问题（如端口通但 connect/initialize 失败）----
  try {
    await acp.ensureConnection();
    logger.info(`✅ ACP 握手就绪: :${ACP_PORT}`);
    acp.disconnect();
  } catch (e) {
    acpStartupError = {
      code: 'ACP_HANDSHAKE_FAILED',
      message: 'WorkBuddy ACP 端口可达但握手失败：' + String(e.message || e).slice(0, 200),
    };
    logger.error('⚠️ ACP 预握手失败（将按消息到达时重试）:', e.message);
    logger.error('   请确认 WorkBuddy 引擎在线；可用 ACP_PORT 环境变量指定正确端口。');
  }

  // ---- UI 会话绑定预握手：让 bridge_status 立即可见绑定结果，并预热首条消息延迟 ----
  if (uiBinder) {
    try {
      const ui = uiBinder.makeUiBoundAcp();
      if (ui) {
        await ui.ensureSession();
        logger.info(`✅ UI 会话已就绪（5G 消息将进入此对话上下文）: ${ui.activeSessionId}`);
        bridge.primeShared();   // 登记到 bridge，使 bridge_status 立即可见 sharedSession
        ui.disconnect();        // 释放连接；首条消息到达时自动重连并 resume
      } else {
        logger.warn('⚠️ 未发现可绑定的 UI 会话（daemon.log 无匹配 launch-spec）→ 5G 消息暂走隔离会话');
      }
    } catch (e) {
      logger.warn('⚠️ UI 会话绑定预握手失败（首条消息时会重试）:', e.message);
    }
  }

  // ---- MAAP WS 启动 ----
  maap.start();

  if (SELFTEST) {
    setTimeout(() => {
      logger.info(`[selftest] 注入自测消息: "${SELFTEST}"`);
      bridge && bridge.enqueue({
        id: 'selftest-' + Date.now(),
        replyTarget: '13800138000',
        text: SELFTEST,
        createdAt: Date.now(),
      });
    }, 3000);
  }

  // ---- 状态日志（MOCK 模式 + 非 MOCK 每 60s 也打一条轻量状态）----
  const statusIntervalMs = MOCK ? 5000 : 60000;
  setInterval(() => {
    if (!bridge) return;
    const s = bridge.status();
    logger.info(`[status] ws=${maap && maap.connected ? '已连接' : '断开'} 队列=${s.queueLength} 在途=${s.active ? s.active.target : '-'} 成功=${s.processed} 失败=${s.failed}`);
  }, statusIntervalMs);

  // ---- 心跳文件（watchdog 探活通道）：daemon 模式 5s / 其他 10s ----
  const heartbeatState = () => {
    const s = bridge ? bridge.status() : {};
    return {
      pid: process.pid,
      wsConnected: !!(maap && maap.connected),
      wsAuthed: !!(maap && maap.authed),
      wsUrl: WS_URL,
      queueLength: s.queueLength || 0,
      processed: s.processed || 0,
      failed: s.failed || 0,
      mode: MOCK ? 'mock' : (DAEMON ? 'daemon' : 'mcp'),
    };
  };
  heartbeat.writeHeartbeat(heartbeatState());
  _hbStop = heartbeat.startHeartbeatLoop(heartbeatState, DAEMON ? 5000 : 10000);
  logger.info(`[heartbeat] 心跳已启动 → ${heartbeat.HEARTBEAT_FILE} (${DAEMON ? 'daemon 5s' : '10s'})`);
})();

// ============== 优雅退出：最多等 10s 排空当前任务 ==============
function gracefulShutdown(signal) {
  logger.info(`收到 ${signal}，开始优雅停机（最多等待 10s 排空任务）…`);
  try { if (maap && typeof maap.stop === 'function') maap.stop(); } catch (e) {}
  try { if (ipcServer) ipcServer.close(); } catch (e) {}
  try { if (leaseServer) leaseServer.close(); } catch (e) {}
  if (DAEMON) { try { fs.unlinkSync(SOCKET_PATH); } catch (e) {} }
  try { heartbeat.clearHeartbeat(); } catch (e) {}      // 正常停机清心跳 → watchdog 不再拉起
  if (_hbStop) { try { _hbStop(); } catch (e) {} }
  const startTs = Date.now();
  const waitFn = () => {
    const s = bridge ? bridge.status() : { active: null, queueLength: 0 };
    const waitMs = Date.now() - startTs;
    if ((!s.active && s.queueLength === 0) || waitMs > 10000) {
      logger.info(`[shutdown] 排空完成(active=${!!s.active}, queue=${s.queueLength}) 耗时 ${waitMs}ms`);
      try { if (bridge && typeof bridge.disconnect === 'function') bridge.disconnect(); } catch (e) {}
      try { if (uiBinder) uiBinder.disconnect(); } catch (e) {}
      try { if (acp && typeof acp.disconnect === 'function') acp.disconnect(); } catch (e) {}
      process.exit(0);
    }
    setTimeout(waitFn, 200);
  };
  setTimeout(waitFn, 0);
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// 暴露 ACP 探测状态（调试用）
Object.defineProperty(module.exports || {}, '_diagnostic', {
  configurable: true, enumerable: true,
  value: () => ({
    MOCK, WS_URL, API_KEY_HAS_VALUE: !!API_KEY,
    SESSION_ID_HAS_VALUE: !!SESSION_ID, SESSION_SOURCE, ACP_CWD,
    ACP_PORT_CFG: config.acp.port, acpStartupPort,
    acpStartupError,
    hasMcpHandle: !!mcpHandle,
    instances: { maap: !!maap, acp: !!acp, bridge: !!bridge },
    logFile: logger.LOG_FILE,
  }),
});
