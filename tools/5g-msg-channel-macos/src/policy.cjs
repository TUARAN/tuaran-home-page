'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { buildPersona } = require('./persona.cjs');
function settings(env = process.env, argv = process.argv.slice(2)) {
  const production = argv.includes('--production');
  if (production && argv.includes('--mock')) throw new Error('不能同时选择 --mock 和 --production');
  const wsUrl = production ? (env.MAAP_WS_URL || 'wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg') : (env.MOCK_WS_URL || 'ws://127.0.0.1:8066/ws');
  const url = new URL(wsUrl);
  if (production && (url.protocol !== 'wss:' || url.hostname !== '5gvas01.cmicmaap.com')) throw new Error('生产网关必须使用已核对的 cmicmaap WSS 主机');
  if (!production && (url.protocol !== 'ws:' || url.hostname !== '127.0.0.1')) throw new Error('模拟网关仅允许 ws://127.0.0.1');
  if (url.username || url.password || url.search) throw new Error('网关 URL 不允许携带凭据/查询参数');
  const allowed = (env.ALLOWED_SENDERS || (production ? '' : 'test-sender')).split(',').map(x => x.trim()).filter(Boolean);
  if (!allowed.length) throw new Error('ALLOWED_SENDERS 不能为空：默认拒绝全部号码');
  if (env.ENFORCE_WHITELIST === 'false') throw new Error('此版本不允许关闭白名单');
  let apiKey = production ? (env.MAAP_API_KEY || '') : 'test-api-key';
  if (production && env.MAAP_API_KEY_FILE) {
    const stat = fs.statSync(env.MAAP_API_KEY_FILE);
    if (stat.mode & 0o077) throw new Error('MAAP_API_KEY_FILE 必须仅当前用户可读写 (chmod 600)');
    apiKey = fs.readFileSync(env.MAAP_API_KEY_FILE, 'utf8').trim();
  }
  if (production && (!apiKey.trim() || /<|你的|test-api-key/.test(apiKey))) throw new Error('生产模式需要有效 MAAP_API_KEY 或 MAAP_API_KEY_FILE');
  const workdir = path.resolve(env.ACP_CWD || path.join(__dirname, '..', 'var', 'workspace'));
  fs.mkdirSync(workdir, { recursive: true, mode: 0o700 });
  const taskTimeoutMs = Number(env.TASK_TIMEOUT_MS || 120000);
  if (!Number.isFinite(taskTimeoutMs) || taskTimeoutMs < 1000 || taskTimeoutMs > 600000) throw new Error('TASK_TIMEOUT_MS 必须为 1000–600000');
  const backend = env.BRIDGE_BACKEND || 'acp';
  if (!['acp', 'desktop'].includes(backend)) throw new Error('BRIDGE_BACKEND 必须为 acp 或 desktop');
  return { backend, production, wsUrl, apiKey, allowed, workdir, dry: env.BRIDGE_DRY !== '0', taskTimeoutMs, persona: buildPersona(env) };
}
function assertAllowed(allowed, target) {
  if (!allowed.includes(target)) throw new Error('目标/发送者不在白名单');
}
function senderDirectory(workdir, target) {
  const dir = path.join(workdir, crypto.createHash('sha256').update(target).digest('hex').slice(0, 24));
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}
module.exports = { settings, assertAllowed, senderDirectory };
