'use strict';

/**
 * watchdog.cjs — 5g-msg-channel 连接器守护进程 v1.0
 *
 * 问题背景：
 *   连接器若由 WorkBuddy MCP 托管拉起，宿主关闭 stdin 会触发连接器进程退出
 *   （MCP 惯例），导致 5G WS 断开且无人拉起 —— 服务端显示"WS 断开"。
 *
 * 解决方案：watchdog 以独立进程守护连接器（daemon 模式），三层防护：
 *   ① 心跳过期检测：连接器每 5s 写 connector/run/heartbeat.json；
 *      心跳 15s 未更新 → 判定进程死亡/卡死 → 强杀并重新拉起
 *   ② WS 断开检测：心跳显示 wsConnected=false 且持续 > WS_RESTART_MS(60s)
 *      → 判定 WS 连不上（网关/网络恢复后需重连）→ 重启连接器进程触发全新连接
 *   ③ 启动补位：watchdog 启动时若发现连接器未运行 → 立即拉起
 *
 * 用法：
 *   node watchdog.cjs [--mock] [--interval 5000]
 *   或（推荐，配系统计划任务/开机自启）：
 *   node watchdog.cjs
 *
 * 注意：
 *   - daemon 模式的连接器应独立于 WorkBuddy 的 MCP 托管，避免双实例同 key 顶替
 *     （mcp.json 中若注册了同 key 条目，两者会互相顶替；二选一使用）
 *   - watchdog 自身只负责拉起/重启，被拉起的连接器生命周期由 watchdog 管理
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const heartbeat = require('./heartbeat.cjs');

// ---------- 配置 ----------
const MOCK = process.argv.includes('--mock');
const WATCH_INTERVAL_MS = parseInt(process.env.WATCHDOG_INTERVAL_MS || '5000', 10);  // 巡检周期
const HEARTBEAT_STALE_MS = parseInt(process.env.WATCHDOG_STALE_MS || '15000', 10);   // 心跳过期判定
const WS_RESTART_MS = parseInt(process.env.WATCHDOG_WS_RESTART_MS || '60000', 10);   // WS 持续断开后重启
const CONNECTOR_CWD = path.join(__dirname, '..');

// ---------- 日志 ----------
function log(msg) {
  const line = `[${new Date().toISOString()}] [watchdog] ${msg}`;
  console.log(line);
  try {
    const logDir = path.join(CONNECTOR_CWD, 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'watchdog.log'), line + '\n');
  } catch (e) {}
}

// ---------- 状态 ----------
let child = null;           // 被守护的连接器子进程
let launchedAt = 0;
let wsDownSince = 0;        // wsConnected=false 持续起始时间（毫秒时间戳）
let restartCooldown = 0;    // 重启冷却（避免反复崩溃死循环）

function buildArgs() {
  const args = [path.join(__dirname, 'index.cjs'), '--daemon'];
  if (MOCK) args.push('--mock');
  return args;
}

function launch(reason) {
  const now = Date.now();
  if (now < restartCooldown) {
    log(`跳过拉起(${reason})：冷却中 ${Math.ceil((restartCooldown - now) / 1000)}s`);
    return;
  }
  // 冷却：正常拉起 3s 冷却；异常重启 30s（防崩溃死循环）
  restartCooldown = now + (reason === 'startup' ? 3000 : 30000);

  // 若旧进程残留，先杀掉（防止同 key 双连）
  if (child && child.pid) {
    try { child.kill('SIGKILL'); } catch (e) {}
  }

  const env = { ...process.env };
  child = spawn(process.execPath, buildArgs(), {
    cwd: CONNECTOR_CWD,
    env,
    stdio: ['pipe', 'inherit', 'inherit'],   // stdin 给管道(模拟 MCP,但 daemon 不自杀); 日志走父进程 stdout
    detached: false,
  });
  launchedAt = now;
  wsDownSince = 0;

  child.on('exit', (code, signal) => {
    log(`连接器退出 code=${code} signal=${signal} → 3s 后自动拉起`);
    child = null;
    // 心跳文件可能残留，等超时后自然判定；这里也主动清一下
    try { heartbeat.clearHeartbeat(); } catch (e) {}
    setTimeout(() => launch('exit'), 3000);
  });
  child.on('error', (e) => {
    log(`连接器启动失败: ${e.message} → 10s 后重试`);
    child = null;
    setTimeout(() => launch('error'), 10000);
  });
  log(`🚀 拉起连接器 (${reason}) pid=${child.pid} args=${buildArgs().join(' ')}`);
}

// ---------- 巡检 ----------
function check() {
  const hb = heartbeat.readHeartbeat();
  const hbFresh = heartbeat.isFresh(hb, HEARTBEAT_STALE_MS);

  // 心跳新鲜：连接器活着
  if (hbFresh && hb.pid) {
    const procAlive = (() => {
      try { process.kill(hb.pid, 0); return true; } catch (e) { return false; }
    })();
    if (!procAlive) {
      // 心跳文件在但进程没了（异常退出后残留）
      log(`检测到进程 ${hb.pid} 已不存在但心跳残留 → 重启`);
      child = null;
      launch('pid-dead');
      return;
    }

    // WS 状态检测
    if (!hb.wsConnected) {
      if (!wsDownSince) { wsDownSince = Date.now(); log(`⚠️ WS 断开（心跳 wsConnected=false），计时重启…`); }
      else if (Date.now() - wsDownSince > WS_RESTART_MS) {
        log(`WS 断开已持续 ${Math.round((Date.now() - wsDownSince) / 1000)}s > ${WS_RESTART_MS / 1000}s → 重启连接器`);
        wsDownSince = 0;
        if (child && child.pid) { try { child.kill('SIGTERM'); } catch (e) {} }
        launch('ws-restart');
      }
    } else {
      if (wsDownSince) { wsDownSince = 0; log('✅ WS 已恢复连接'); }
    }
    return;
  }

  // 心跳过期/无心跳：进程未运行 → 拉起
  if (!child || !child.pid) {
    if (!hbFresh) log('心跳缺失/过期 → 判定连接器未运行');
    launch('startup');
  }
}

// ---------- 启动 ----------
log(`==================================================`);
log(`watchdog 启动 v1.0 | mock=${MOCK} | 巡检=${WATCH_INTERVAL_MS}ms | 心跳过期=${HEARTBEAT_STALE_MS}ms | WS重启=${WS_RESTART_MS}ms`);
log(`心跳文件: ${heartbeat.HEARTBEAT_FILE}`);
log(`==================================================`);

// 立即巡检一次（若已有连接器在跑且心跳新鲜，则 watchdog 只观察不重复拉起）
check();
setInterval(check, WATCH_INTERVAL_MS);

// 优雅退出 watchdog 时带走连接器（可选；若保留连接器可注释）
process.on('SIGINT', () => {
  log('watchdog 退出(SIGINT)，同步终止连接器…');
  if (child && child.pid) { try { child.kill('SIGTERM'); } catch (e) {} }
  setTimeout(() => process.exit(0), 1000);
});
process.on('SIGTERM', () => {
  log('watchdog 退出(SIGTERM)，同步终止连接器…');
  if (child && child.pid) { try { child.kill('SIGTERM'); } catch (e) {} }
  setTimeout(() => process.exit(0), 1000);
});
