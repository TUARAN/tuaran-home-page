'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { PassThrough } = require('node:stream');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { WebSocketServer } = require('ws');
const path = require('node:path');
const Bridge = require('../src/bridge.cjs');
const MaapClient = require('../src/maap-client.cjs');
const Mcp = require('../src/mcp-server.cjs');

const root = path.resolve(__dirname, '..');

// 测试隔离（2026-09-15 补）：测试里的 Bridge 曾把 fixture 写进**真实**收件箱
// var/inbox/inbox.jsonl（9-15 09:13 / 09:30 各污染一批 a/b/test-sender 假消息）。
// 这里强制把收件箱指到临时目录，并关掉播报栏刷新（否则假未读数会被写进用户真实记忆文件）。
process.env.BRIDGE_INBOX = path.join(os.tmpdir(), 'bridge-test-inbox.jsonl');
process.env.BRIDGE_INBOX_BADGE = '0';

const quiet = { info() {}, warn() {}, error() {}, debug() {}, mark() {} };
const waitFor = async predicate => {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error('condition timeout');
};

test('production 默认拒绝空白名单', () => {
  const env = { PATH: process.env.PATH, BRIDGE_MODE: 'production', MAAP_API_KEY: 'valid-production-key' };
  const result = spawnSync(process.execPath, ['-e', "require('./src/config.cjs')"], { cwd: root, env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ALLOWED_SENDERS 不能为空/);
});

test('消息按发送者建立独立客户端并去重', async () => {
  const sent = [];
  const clients = [];
  const makeAcp = target => {
    const client = {
      target, connectionId: 'connected', activeSessionId: 'session-' + target,
      async ensureSession() {},
      async prompt(_text, options) { options.onText('答复-' + target); return { stopReason: 'end_turn' }; },
      forceReconnect() {}, disconnect() {},
    };
    clients.push(client);
    return client;
  };
  const bridge = new Bridge({
    maap: { async sendReply(to, text) { sent.push({ to, text }); return { status: 'ws_sent' }; } },
    makeAcp, logger: quiet,
    options: { allowedSenders: ['a', 'b'], dry: false, noProgressReceipt: true },
  });
  assert.equal(bridge.enqueue({ id: '1', replyTarget: 'a', text: 'x' }), true);
  assert.equal(bridge.enqueue({ id: '1', replyTarget: 'a', text: 'x' }), false);
  assert.equal(bridge.enqueue({ id: '2', replyTarget: 'b', text: 'y' }), true);
  await waitFor(() => bridge.processed === 2);
  assert.equal(clients.length, 2);
  assert.deepEqual(sent.map(x => x.to), ['a', 'b']);
});

test('超时只失败一次且不自动重放 prompt', async () => {
  let prompts = 0;
  const sent = [];
  const client = {
    connectionId: 'connected', activeSessionId: 'session', async ensureSession() {},
    async prompt() { prompts++; return { timedOut: true, stopReason: null }; },
    forceReconnect() {}, disconnect() {},
  };
  const bridge = new Bridge({
    maap: { async sendReply(to, text) { sent.push({ to, text }); return { status: 'ws_sent' }; } },
    makeAcp: () => client, logger: quiet,
    options: { allowedSenders: ['a'], dry: false, noProgressReceipt: true },
  });
  bridge.enqueue({ id: 'timeout', replyTarget: 'a', text: 'x' });
  await waitFor(() => bridge.failed === 1);
  assert.equal(prompts, 1);
  assert.equal(bridge.processed, 0);
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /没有自动重试/);
});

test('主动下发同样执行白名单', async () => {
  const bridge = new Bridge({ maap: { async sendReply() { throw new Error('不应调用'); } }, logger: quiet, options: { allowedSenders: ['ok'], dry: true } });
  await assert.rejects(() => bridge.send('bad', 'x'), /白名单/);
  assert.equal((await bridge.send('ok', 'x')).status, 'dry_run');
});

test('MCP 保留启动失败状态，不假报 runtimeReady', async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  let text = '';
  output.on('data', chunk => { text += chunk; });
  const handle = Mcp.attach({ input, output, logger: quiet, deferred: true, keepAliveOnStdinEnd: true });
  handle.setRuntime({ error: { code: 'ACP_DOWN' } });
  input.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'bridge_status', arguments: {} } }) + '\n');
  await waitFor(() => text.includes('\n'));
  const response = JSON.parse(text.trim());
  const value = JSON.parse(response.result.content[0].text);
  assert.equal(value.runtimeReady, false);
  assert.equal(value.error.code, 'ACP_DOWN');
  input.end();
});

test('网关 error 帧会拒绝唯一在途发送', async () => {
  const client = new MaapClient({ wsUrl: 'ws://127.0.0.1', apiKey: 'secret', logger: quiet });
  client.authed = true;
  client.ws = { readyState: 1, send(_raw, callback) { callback(); } };
  const sending = client.sendReply('a', 'hello');
  await new Promise(resolve => setImmediate(resolve));
  client._handleFrame(Buffer.from(JSON.stringify({ type: 'error', message: 'rejected' })));
  await assert.rejects(sending, /网关拒绝下发/);
});

test('模拟网关到 ACP 再到下行的完整入口闭环', async t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-macos-e2e-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const acp = http.createServer(async (req, res) => {
    if (req.method === 'DELETE') { res.end('{}'); return; }
    if (req.url.endsWith('/connect')) {
      res.setHeader('content-type', 'application/json');
      res.end('{"connectionId":"e2e"}');
      return;
    }
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const msg = JSON.parse(raw);
    res.setHeader('content-type', 'text/event-stream');
    const emit = value => res.write('event: message\ndata: ' + JSON.stringify(value) + '\n\n');
    if (msg.method === 'session/prompt') {
      emit({ method: 'session/update', params: { sessionId: 's1', update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'LEGACY_MACOS_OK' } } } });
      emit({ id: msg.id, result: { stopReason: 'end_turn' } });
    } else {
      emit({ id: msg.id, result: msg.method === 'session/new' ? { sessionId: 's1' } : { protocolVersion: 1 } });
    }
    res.end();
  });
  await new Promise((resolve, reject) => { acp.once('error', reject); acp.listen(0, '127.0.0.1', resolve); });
  t.after(() => { acp.closeAllConnections(); acp.close(); });

  const gateway = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await new Promise((resolve, reject) => { gateway.once('listening', resolve); gateway.once('error', reject); });
  t.after(() => { for (const socket of gateway.clients) socket.terminate(); gateway.close(); });
  let delivered;
  const delivery = new Promise(resolve => gateway.on('connection', socket => socket.on('message', raw => {
    const frame = JSON.parse(raw);
    if (frame.type === 'auth') {
      socket.send('{"type":"auth_ok"}');
      socket.send(JSON.stringify({ type: 'text_message', from: 'test-sender', messageId: 'e2e', content: 'reply' }));
    } else if (frame.type === 'ping') socket.send('{"type":"pong"}');
    else if (frame.type === 'send') { delivered = frame; resolve(); }
  })));
  const child = spawn(process.execPath, [path.join(root, 'src', 'index.cjs'), '--mock'], {
    cwd: root,
    env: { ...process.env, ACP_PORT: String(acp.address().port), ACP_CWD: temp, MOCK_WS_URL: `ws://127.0.0.1:${gateway.address().port}/ws`, BRIDGE_DRY: '0', ALLOWED_SENDERS: 'test-sender', NO_PROGRESS: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  t.after(() => child.kill('SIGTERM'));
  child.stdout.resume(); child.stderr.resume();
  await Promise.race([delivery, new Promise((_, reject) => setTimeout(() => reject(new Error('E2E timeout')), 8000))]);
  assert.equal(delivered.content, 'LEGACY_MACOS_OK');
  assert.equal(delivered.to, 'test-sender');
  const exited = new Promise(resolve => child.once('exit', resolve));
  child.kill('SIGTERM');
  await exited;
});
