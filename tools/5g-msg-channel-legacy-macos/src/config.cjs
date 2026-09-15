'use strict';

/**
 * config.cjs — 环境变量集中读取（对齐 docs/REQUIREMENTS.md §6）
 * index.cjs 已支持关键项；此文件供需要单独引用配置的模块使用。
 */
const path = require('path');
const fs = require('fs');

// 可选 .env 加载
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const s = line.trim();
      if (!s || s.startsWith('#')) continue;
      const i = s.indexOf('=');
      if (i === -1) continue;
      const k = s.slice(0, i).trim();
      const v = s.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
} catch (e) { /* ignore */ }

const production = process.argv.includes('--production') || process.env.BRIDGE_MODE === 'production';
const mock = process.argv.includes('--mock');
if (production && mock) throw new Error('不能同时使用 production 和 mock');
let apiKey = process.env.MAAP_API_KEY || '';
if (production && process.env.MAAP_API_KEY_FILE) {
  const stat = fs.statSync(process.env.MAAP_API_KEY_FILE);
  if (stat.mode & 0o077) throw new Error('MAAP_API_KEY_FILE 权限必须为 0600');
  apiKey = fs.readFileSync(process.env.MAAP_API_KEY_FILE, 'utf8').trim();
}
const allowedSenders = (process.env.ALLOWED_SENDERS || (mock ? 'test-sender' : ''))
  .split(',').map(s => s.trim()).filter(Boolean);
if (!mock && !allowedSenders.length) throw new Error('生产模式 ALLOWED_SENDERS 不能为空');
if (!mock && (!apiKey || /<|你的|test-api-key/.test(apiKey))) throw new Error('生产模式缺少有效 MaaP API Key');

module.exports = {
  production,
  mock,
  allowedSenders,
  maap: {
    wsUrl: process.env.MAAP_WS_URL || 'wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg',
    apiKey,
    tls: {
      rejectUnauthorized: process.env.MAAP_TLS_REJECT_UNAUTHORIZED !== 'false',
      caFile: process.env.MAAP_TLS_CA_FILE || '',
      clientCertFile: process.env.MAAP_TLS_CLIENT_CERT || '',
      clientKeyFile: process.env.MAAP_TLS_CLIENT_KEY || '',
    },
  },
  acp: {
    port: parseInt(process.env.ACP_PORT || '0', 10),   // 0 = 自动探测
    sessionId: process.env.ACP_SESSION_ID || '',
    cwd: process.env.ACP_CWD || process.cwd(),
    sessionNewWaitMs: parseInt(process.env.ACP_SESSION_NEW_WAIT_MS || '500', 10),
  },
  bridge: {
    maxQueue: parseInt(process.env.BRIDGE_MAX_QUEUE || '500', 10),
    taskTimeoutMs: parseInt(process.env.TASK_TIMEOUT_MS || '120000', 10),
    idleReconnectMs: parseInt(process.env.BRIDGE_IDLE_RECONNECT_MS || '60000', 10),
    noProgressReceipt: process.env.NO_PROGRESS === '1',
    phoneProgress: process.env.PHONE_PROGRESS !== '0',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: path.join(__dirname, '..', 'logs'),
  },
  selftest: process.env.BRIDGE_SELFTEST_TEXT || '',
};
