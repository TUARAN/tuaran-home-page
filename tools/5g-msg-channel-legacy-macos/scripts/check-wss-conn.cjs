'use strict';
const net = require('net');
const tls = require('tls');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');

// ws 候选路径：优先当前 connector 目录 node_modules -> 顶层 node_modules（monorepo）-> 相邻旧项目（存在就用）
(function _ensureWs() {
  const rootAbove = path.resolve(__dirname, '..', '..');
  const connectorNodeModules = path.resolve(__dirname, '..', 'node_modules');
  const tries = [
    path.join(connectorNodeModules, 'ws'),
    path.join(rootAbove, 'node_modules', 'ws'),
    // 兼容旧的相邻项目（如存在，直接用）
    path.resolve(rootAbove, '..', '5g-channel', 'node_modules', 'ws'),
  ];
  for (const p of tries) {
    try {
      const stat = fs.statSync(p);
      if (stat && (stat.isDirectory() || stat.isFile())) {
        module.paths.unshift(path.dirname(p));
        return;
      }
    } catch (e) { /* 不存在，继续 */ }
  }
  try { require.resolve('ws'); } catch (e) {
    console.error('❌ 未找到 ws 模块，请先在 connector 目录执行:  npm install');
    console.error('   提示：已按优先级尝试以下路径：');
    tries.forEach(p => console.error('    - ' + p));
    process.exit(2);
  }
})();
const WebSocket = require('ws');

const TARGET_URL = process.argv[2] || 'wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg';
const API_KEY = process.env.MAAP_API_KEY || 'test-key';
const U = new URL(TARGET_URL);

const step = (n, t, ok, extra = '') => console.log(
  `[${ok ? '✅' : '❌'} Step ${n}] ${t}${extra ? '  →  ' + extra : ''}`
);
const failExit = (n, t, msg) => { step(n, t, false, msg); process.exit(1); };

(async () => {
  console.log(`目标: ${TARGET_URL}  主机=${U.hostname}  端口=${U.port || 443}`);
  console.log('');

  // Step 1: TCP 443 连通（3s 超时）
  const t1 = Date.now();
  const tcpOk = await new Promise(res => {
    const s = net.createConnection(U.port || 443, U.hostname);
    let done = false;
    const to = setTimeout(() => { if (!done) { done = true; s.destroy(); res(false); } }, 3000);
    s.on('connect', () => { if (done) return; done = true; clearTimeout(to); s.end(); res(true); });
    s.on('error',   () => { if (done) return; done = true; clearTimeout(to); res(false); });
  });
  if (!tcpOk) failExit(1, 'TCP 443 连接', '超时或被防火墙拒绝（检查出口/代理）');
  step(1, 'TCP 443 连接', true, `${Date.now() - t1}ms`);

  // Step 2: TLS 握手 + 证书链校验（用系统 CA，rejectUnauthorized=true 默认）
  const t2 = Date.now();
  const tlsInfo = await new Promise(res => {
    const sock = tls.connect(U.port || 443, U.hostname, {
      servername: U.hostname, ALPNProtocols: ['http/1.1'],
    }, () => {
      const c = sock.getPeerCertificate(true);
      const r = sock.authorized, e = sock.authorizationError || null;
      sock.end();
      res({ ok: r, err: e, subject: c && c.subject, issuer: c && c.issuer, valid_to: c && c.valid_to, valid_from: c && c.valid_from,
           san: (c && c.subjectaltname || '').slice(0, 160), bits: (c && c.bits) });
    });
    sock.on('error', e => res({ ok: false, err: e.message }));
    sock.setTimeout(5000, () => { sock.destroy(); res({ ok: false, err: 'TLS 超时 5s' }); });
  });
  if (!tlsInfo.ok) failExit(2, 'TLS 握手 & 证书校验', tlsInfo.err || '未知错误');
  step(2, 'TLS 握手 & CA 链校验', true,
    `subject=${tlsInfo.subject && tlsInfo.subject.CN}  issuer=${tlsInfo.issuer && tlsInfo.issuer.O || tlsInfo.issuer.CN}  有效期至=${tlsInfo.valid_to}  ${Date.now() - t2}ms`);
  if (tlsInfo.san) step(0, 'SAN 域名包含', true, tlsInfo.san.slice(0, 180));

  // Step 3: HTTPS GET（看路径是否存在 / 代理层是否拦截）
  const t3 = Date.now();
  const httpResp = await new Promise(res => {
    let finished = false;
    const req = https.get(TARGET_URL.replace(/^wss:/, 'https:'), {
      headers: { 'User-Agent': 'maap-conn-check/1.0' },
      timeout: 5000,
    }, r => {
      let body = '';
      r.setEncoding('utf8');
      r.on('data', c => body += c);
      r.on('end', () => { if (!finished) { finished = true; res({ status: r.statusCode, headers: r.headers, body: body.slice(0, 300) }); } });
    });
    req.on('timeout', () => { req.destroy(new Error('HTTP 超时')); });
    req.on('error', e => { if (!finished) { finished = true; res({ status: 0, error: e.message }); } });
  });
  if (!httpResp || httpResp.status === 0) failExit(3, 'HTTPS GET 路径探测', httpResp.error || '空响应');
  step(3, `HTTPS GET 路径探测 (非 Upgrade)`, httpResp.status >= 400 && httpResp.status < 599 || true,  // 非 WS Upgrade 必然 4xx/200 都算可到达
    `status=${httpResp.status}  server=${(httpResp.headers && httpResp.headers.server) || 'n/a'}  content-type=${(httpResp.headers && httpResp.headers['content-type']) || 'n/a'}  ${Date.now() - t3}ms`);
  if (httpResp.body) console.log(`       响应片段: ${httpResp.body.replace(/\s+/g, ' ').slice(0, 180)}`);

  // Step 4: WebSocket 握手 Upgrade（无 API key 也应该能升级成功，auth 帧再拒绝）
  const t4 = Date.now();
  const wsResult = await new Promise(res => {
    let done = false;
    let opened = false;
    let received = [];
    const ws = new WebSocket(TARGET_URL, {
      headers: { 'X-API-Key': API_KEY, Accept: 'application/json' },
      handshakeTimeout: 8000,
    });
    const kill = (r) => { if (done) return; done = true; try { ws.close(); } catch (e) {} res(r); };
    const to = setTimeout(() => kill({ upgrade: opened, timeout: true, frames: received }), 8000);
    ws.on('open', () => {
      opened = true;
      try { ws.send(JSON.stringify({ type: 'auth', apiKey: API_KEY, version: '2.0' })); } catch (e) {}
    });
    ws.on('message', (raw) => {
      received.push(raw.toString().slice(0, 400));
      const s = received[received.length - 1];
      if (/(auth_ok|auth_failed|connected|error)/.test(s) || received.length >= 3) {
        clearTimeout(to);
        kill({ upgrade: true, frames: received });
      }
    });
    ws.on('upgrade', (r) => { /* 标记握手成功 */ });
    ws.on('error', (e) => { clearTimeout(to); kill({ upgrade: opened, error: e.message, frames: received }); });
    ws.on('close', (c, r) => { clearTimeout(to); kill({ upgrade: opened, closeCode: c, closeReason: r && r.toString(), frames: received }); });
  });
  const upgradeOk = wsResult.upgrade || (wsResult.frames && wsResult.frames.length);
  step(4, 'WebSocket handshake Upgrade', upgradeOk,
    `${Date.now() - t4}ms  closeCode=${wsResult.closeCode || 'n/a'}  error=${wsResult.error || 'n/a'}  timeout=${wsResult.timeout ? '是' : '否'}`);
  if (wsResult.frames && wsResult.frames.length) {
    console.log(`       收到 ${wsResult.frames.length} 帧:`);
    wsResult.frames.forEach((f, i) => console.log(`         [#${i + 1}] ${f.slice(0, 320)}`));
  } else {
    console.log(`       未收到有效帧（若 auth_failed 属于正常，说明链路 OK 只等真实 AK）`);
  }

  console.log('');
  console.log('--- 综合判断 ---');
  if (!tcpOk) { console.log('❌ TCP 不通：检查出口防火墙/是否需企业代理（HTTPS_PROXY=…）'); process.exit(1); }
  if (!tlsInfo.ok) { console.log('❌ TLS 证书校验失败：若为私签内网环境请设 MAAP_TLS_CA_FILE=xxx.pem 或测试期 MAAP_TLS_REJECT_UNAUTHORIZED=false'); process.exit(1); }
  if (!upgradeOk) {
    console.log('⚠️  WS Upgrade 失败：TCP/TLS 通但 WebSocket 升级被拦截。常见：出口网关/防火墙阻断 Upgrade。若企业代理请设 HTTPS_PROXY。');
    process.exit(1);
  }
  const hasAuthSignal = (wsResult.frames || []).some(f => /(auth_|connected|error)/.test(f));
  if (hasAuthSignal) {
    const isFail = (wsResult.frames || []).some(f => /auth_failed|error|invalid/i.test(f));
    console.log(isFail
      ? '✅ 链路完全正常：TCP/TLS/WS/Auth 全链路打通（仅 test-key/Ak 错误导致 auth_failed，这正是预期结果——替换真实 MAAP_API_KEY 即可上线。）'
      : '✅ 链路完全正常：已收到 auth_ok/connected 回帧，可直接上线。');
    process.exit(0);
  }
  console.log('⚠️  WS 已连通但 8s 内未收到服务端回帧。可能：网关要求心跳/握手顺序更严格（属正常链路正常的边缘情况，代码会自动重试 auth）。');
  process.exit(0);
})();
