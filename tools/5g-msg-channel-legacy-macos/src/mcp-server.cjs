'use strict';

/**
 * mcp-server.cjs — 5g-msg-channel 连接器 MCP stdio 层 v2.0
 *
 * 关键变更 (v2):
 *   - 修复 WorkBuddy 握手丢 initialize 帧：attach() 必须在进程 require 同步阶段立即调用，
 *     不再等 ACP 端口探测 + 握手等异步过程。通过 deferred 模式先挂载 stdin 监听器，
 *     maap/bridge 准备好后再调用 setRuntime({maap,bridge,dry,version})。
 *   - stdin buffer 上限 4MB，单帧 1MB，异常后保留残余 buffer 不破坏后续帧。
 *   - bridge_status 返回标准 JSON 结构体（不是字符串），WorkBuddy 可以直接渲染。
 *
 * 协议：行式 JSON-RPC（与 wb-gateway / 参考包同款）
 *   initialize / tools/list / tools/call / ping / notifications/initialized
 */

const SERVER_NAME = '5g-msg-channel';
const DEFAULT_PROTOCOL_VERSION = '2024-11-05';
const STDIN_BUF_MAX = 4 * 1024 * 1024;   // 4MB 总 buffer 上限（防御 OOM）
const LINE_MAX = 1024 * 1024;            // 1MB 单行上限

function _safeJson(obj) {
  try { return JSON.stringify(obj); } catch (e) {
    return JSON.stringify({ error: 'serialize_failed', message: String(e && e.message || e).slice(0, 200) });
  }
}

function attach({ maap, bridge, logger, dry = false, version = '1.0.0', deferred = false, keepAliveOnStdinEnd = false, input = process.stdin, output = process.stdout, onClose = null } = {}) {
  let _maap = maap || null;
  let _bridge = bridge || null;
  let _dry = dry;
  let _version = version;
  let _logger = logger || console;
  let _keepAlive = keepAliveOnStdinEnd;   // daemon 守护模式：stdin 关闭不自杀

  let pendingHandles = [];    // maap/bridge 未 ready 前到过的帧（存原始 msg 对象）
  let pendingMax = 64;        // 缓存上限：握手一般 2~4 帧 initialize / list / notif / ping
  let runtimeReady = !deferred;
  let runtimeError = null;

  function setRuntime(runtime) {
    if (!runtime) return;
    if (runtime.maap) _maap = runtime.maap;
    if (runtime.bridge) _bridge = runtime.bridge;
    if (typeof runtime.dry === 'boolean') _dry = runtime.dry;
    if (runtime.version) _version = runtime.version;
    if (runtime.logger) _logger = runtime.logger;
    runtimeError = runtime.error || null;
    runtimeReady = !runtimeError;
    // 重放缓存里的握手帧
    if (pendingHandles.length) {
      const q = pendingHandles; pendingHandles = [];
      for (const msg of q) { try { handle(msg, true); } catch (e) {} }
    }
  }

  function _stdoutSend(obj) { output.write(_safeJson(obj) + '\n'); }

  function statusSnapshot() {
    const s = _bridge ? _bridge.status() : {};
    return {
      wsConnected: !!(_maap && _maap.connected),
      wsAuthed: !!(_maap && _maap.authed),
      wsMode: (_maap && _maap.mode) || 'unknown',
      wsUrl: (_maap && _maap.wsUrl) || '',
      queueLength: s.queueLength || 0,
      active: s.active || null,
      processed: s.processed || 0,
      failed: s.failed || 0,
      progress: s.progress || [],
      // 5G 消息绑定的「当前 UI 会话」（复用对话上下文时非空；null = 按发送者隔离会话）
      sharedSession: s.shared || null,
      dry: _dry,
      version: _version,
      uptimeSec: Math.floor(process.uptime()),
      runtimeReady,
      runtimeError,
    };
  }

  function handle(msg, fromPending = false) {
    const { id, method, params } = msg || {};
    if (method !== 'ping' && method !== 'initialize' && !runtimeReady && !runtimeError && !fromPending) {
      // maap/bridge 还没装配好：暂存，最多 64 条（握手肯定够），超出丢最旧
      pendingHandles.push(msg);
      if (pendingHandles.length > pendingMax) pendingHandles.shift();
      return;
    }
    switch (method) {
      case 'initialize': {
        _stdoutSend({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: (params && params.protocolVersion) || DEFAULT_PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: { name: SERVER_NAME, version: _version },
            instructions:
              '5G 消息通道连接器：手机 5G 上行经 WS 接收 → ACP 注入真实 WorkBuddy 处理 → ' +
              '回复经 WS send 帧下发。可用工具：send_5g 主动下发；bridge_status 查看链路状态；' +
              'bridge_version 查看版本与运行态。',
          },
        });
        break;
      }

      case 'tools/list': {
        _stdoutSend({
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'send_5g',
                description:
                  '主动向 5G 用户发送一条文本消息（真实下发到对方手机）。' +
                  'to 使用对方上行消息携带的 sender（手机号或平台 userId），text 为内容，最多 4000 字。',
                inputSchema: {
                  type: 'object',
                  properties: {
                    to: { type: 'string', description: '接收方（手机号或平台 userId）', minLength: 1, maxLength: 64 },
                    text: { type: 'string', description: '消息文本（最多 4000 字）', minLength: 1, maxLength: 4000 },
                  },
                  required: ['to', 'text'],
                },
              },
              {
                name: 'bridge_status',
                description:
                  '查询 5G↔WorkBuddy 桥接链路结构化状态：WS 连接/认证、ACP、队列深度、在途任务、成功失败计数、运行时长。',
                inputSchema: { type: 'object', properties: {} },
              },
              {
                name: 'bridge_version',
                description: '返回连接器版本号、运行模式（mock/真实网关）、DRY 开关、运行秒数、runtime 是否装配完成。',
                inputSchema: { type: 'object', properties: {} },
              },
            ],
          },
        });
        break;
      }

      case 'tools/call': {
        const name = params && params.name;
        const args = (params && params.arguments) || {};
        const okText = (text) => _stdoutSend({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: String(text) }] } });
        const okJson = (obj) => _stdoutSend({
          jsonrpc: '2.0', id,
          result: {
            content: [{ type: 'text', text: _safeJson(obj) }],
          },
        });
        const err = (text, code = -32000) => _stdoutSend({ jsonrpc: '2.0', id, error: { code, message: String(text) } });

        if (name === 'send_5g') {
          const to = String(args.to || '').trim();
          const text = String(args.text || '');
          if (!to) return err('缺少参数 to');
          if (to.length > 64) return err('to 超过 64 字');
          // trimLeft 仅保留尾部空白（保留文本语义），长度限制 4000
          const trimmedText = text.replace(/^\s+/, '');
          if (!trimmedText) return err('缺少参数 text（去除头部空白后为空）');
          if (trimmedText.length > 4000) return err(`text 超过 4000 字（当前 ${trimmedText.length}）`);
          if (_dry) return okText('[DRY] 未真实发送: to=' + to + ' len=' + trimmedText.length);
          if (!runtimeReady) return err('连接器尚未完成初始化（ACP/MAAP 装配中），请稍后重试', -32001);
          if (!_maap || !_maap.authed) return err('5G WS 未连接或未认证（检查 MAAP_API_KEY 与网络出口连通性）', -32002);
          const sender = _bridge && typeof _bridge.send === 'function' ? _bridge : _maap;
          sender.send ? sender.send(to, trimmedText)
            .then((r) => okText('sent ' + _safeJson(r)))
            .catch((e) => err('发送失败: ' + (e && e.message ? e.message : String(e))))
            : err('发送组件不可用');
          return;
        }

        if (name === 'bridge_status') {
          if (!runtimeReady) {
            return okJson({
              runtimeReady: false,
              note: 'ACP/MAAP 装配中，可能尚未完成握手或 ACP 端口探测失败。请稍后重试或检查 ACP_PORT / WorkBuddy 引擎是否在线。',
              pendingQueue: pendingHandles.length,
              error: runtimeError,
              version: _version,
              dry: _dry,
              uptimeSec: Math.floor(process.uptime()),
            });
          }
          return okJson(statusSnapshot());
        }

        if (name === 'bridge_version') {
          return okJson({
            version: _version,
            serverName: SERVER_NAME,
            protocol: DEFAULT_PROTOCOL_VERSION,
            dry: _dry,
            runtimeReady,
            pendingHandshakeFrames: pendingHandles.length,
            uptimeSec: Math.floor(process.uptime()),
            wsConnected: !!(_maap && _maap.connected),
            wsMode: (_maap && _maap.mode) || 'unknown',
          });
        }

        return err('unknown tool: ' + name, -32601);
      }

      case 'ping':
        if (id !== undefined) _stdoutSend({ jsonrpc: '2.0', id, result: {} });
        break;

      case 'notifications/initialized':
        break;

      default:
        if (id !== undefined) _stdoutSend({ jsonrpc: '2.0', id, result: {} });
        break;
    }
  }

  // -------- stdin 行协议 --------
  let mcpBuf = '';
  let mcpHandshake = false;
  input.on('data', (chunk) => {
    mcpHandshake = true;
    mcpBuf += chunk.toString('utf8');
    // 缓冲区上限：超 4MB 截断最旧字节（保留尾部，更可能是未完整帧）
    if (mcpBuf.length > STDIN_BUF_MAX) mcpBuf = mcpBuf.slice(mcpBuf.length - (STDIN_BUF_MAX >> 1));
    let i;
    while ((i = mcpBuf.indexOf('\n')) >= 0) {
      const line = mcpBuf.slice(0, i).replace(/\r$/, '');
      mcpBuf = mcpBuf.slice(i + 1);
      if (!line) continue;
      if (line.length > LINE_MAX) {
        try { _logger.error && _logger.error('[mcp] 单帧超过 1MB，丢弃以避免 OOM: len=' + line.length); } catch (e) {}
        continue;
      }
      let msg;
      try { msg = JSON.parse(line); }
      catch (e) {
        try { _logger.error && _logger.error('[mcp] JSON 解析失败: ' + (e && e.message ? e.message : String(e)).slice(0, 200) + ' 行前64=' + line.slice(0, 64)); } catch (_) {}
        // **不丢 buffer**：parse 失败是该行本身的问题，不影响后续行；残余 buffer 已被切分
        continue;
      }
      try { handle(msg); } catch (e) {
        try { _logger.error && _logger.error('[mcp] handle 异常: ' + (e && e.message ? e.message : String(e)).slice(0, 300)); } catch (_) {}
      }
    }
  });
  input.on('end', () => {
    if (onClose) { try { onClose(); } catch (e) {} }
    if (_keepAlive) {
      // daemon 守护模式：MCP stdin 只是可选的调试/管理通道，关闭不影响桥接服务
      try { _logger.info && _logger.info('[mcp] MCP stdin 关闭（daemon 守护模式，继续运行桥接服务）'); } catch (e) {}
      return;
    }
    if (mcpHandshake) {
      try { _logger.info && _logger.info('[mcp] MCP stdin 关闭，退出'); } catch (e) {}
      if (input === process.stdin) process.exit(0);
    } else {
      try { _logger.info && _logger.info('[mcp] stdin 立即 EOF（独立调试模式），继续运行桥接服务'); } catch (e) {}
    }
  });

  try { _logger.info && _logger.info(`[mcp] MCP stdio 层已挂载（${SERVER_NAME} v${_version}）${deferred ? ' deferred 模式：等待 setRuntime() 装配 MAAP/Bridge' : ''}`); } catch (e) {}

  return { handle, statusSnapshot, setRuntime };
}

module.exports = { attach };
