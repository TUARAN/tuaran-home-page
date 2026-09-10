'use strict';
const { settings } = require('./policy.cjs');
const AcpClient = require('./acp-client.cjs');
const MaapClient = require('./maap-client.cjs');
const Bridge = require('./bridge.cjs');
const DesktopInbox = require('./desktop-inbox.cjs');
const { attach } = require('./mcp-server.cjs');
const { createPermissionPrompter } = require('./permission-dialog.cjs');
const net = require('node:net'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const daemon = process.argv.includes('--daemon');
const socketPath = process.env.BRIDGE_SOCKET || path.join(os.homedir(), '.workbuddy/5g-macos.sock');
let ipc, lease, gatewayError = null;
let config, maap, bridge, probe, startupError = null, stopping = false, acpHandshake = false;
const recentEvents = [];
const log = event => {
  const entry = { at: new Date().toISOString(), ...event };
  recentEvents.push(entry); if (recentEvents.length > 100) recentEvents.shift();
  console.error(JSON.stringify(entry));
};
const permissionUI = createPermissionPrompter({ onChange: state => { log({ type: 'permission_confirmation', ...state }); if (bridge?.lastTask) bridge.lastTask.state = state.state === 'awaiting_local_confirmation' ? 'awaiting_permission' : 'processing'; } });
// The upstream client logs message bodies. Suppress these in the macOS adapter.
const logger = { info() {}, debug() {}, warn() {}, error() {} };
const shutdown = async () => {
  if (stopping) return; stopping = true;
  maap?.stop(); ipc?.close(); lease?.close(); if (daemon && ipc) { try { fs.unlinkSync(socketPath); } catch {} } await bridge?.close(); await probe?.close(); process.exit(0);
};
const handlers = { status: () => ({
  version: '3.0.0', backend: config?.backend === 'desktop' ? 'workbuddy-desktop-mcp' : 'workbuddy-local-acp', transport: config?.backend === 'desktop' ? 'mcp-inbox' : 'http-sse', spawnsCli: false, sessionBinding: 'channel-session',
  progress: { connectorSendsThinkingNotice: false, source: config?.backend === 'desktop' ? 'desktop-mcp-inbox' : 'acp-session-update-metadata', recentEvents: recentEvents.slice(-30) },
  permissions: permissionUI.status(), pid: process.pid, service: daemon ? 'shared-daemon' : 'stdio', gatewayError,
  runtimeReady: !!bridge,
  acpStartupHandshake: acpHandshake, acpError: startupError,
  acpReady: !!bridge?.clients.size && [...bridge.clients.values()].every(c => c.ready),
  wsConnected: !!maap?.connected, wsAuthed: !!maap?.authed, wsUrl: config?.wsUrl || null,
  mode: config?.production ? 'production' : 'mock', dry: config?.dry ?? true,
  allowedSenderCount: config?.allowed.length || 0, ...(bridge?.status() || {}),
}), receive: (seconds, signal) => { if (!(bridge instanceof DesktopInbox)) throw new Error('未开启 desktop 模式'); return bridge.receive(seconds, signal); }, reply: (id, text, signal) => { if (!(bridge instanceof DesktopInbox)) throw new Error('未开启 desktop 模式'); return bridge.reply(id, text, signal); }, send: (to, text) => { if (!bridge) throw new Error('连接器未就绪'); return bridge.send(to, text); }, shutdown };
if (!daemon) attach(handlers);
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
(async () => {
  try {
    config = settings();
    if (daemon) {
      lease = net.createServer(socket => socket.destroy());
      await new Promise((resolve, reject) => { lease.once('error', reject); lease.listen(Number(process.env.BRIDGE_LEASE_PORT || 18567), '127.0.0.1', resolve); });
      // The legacy guard shares this port: only the lease owner may connect to MaaP.
      try { fs.unlinkSync(socketPath); } catch (e) { if (e.code !== 'ENOENT') throw e; }
      ipc = net.createServer(socket => { socket.on('error', () => {}); attach({ ...handlers, input: socket, output: socket, shutdown() {} }); });
      await new Promise((resolve, reject) => { ipc.once('error', reject); ipc.listen(socketPath, resolve); });
      fs.chmodSync(socketPath, 0o600);
    }
    const errors = [];
    for (const port of config.backend === 'desktop' ? [] : AcpClient.ports()) {
      probe = new AcpClient({ port, cwd: config.workdir, timeoutMs: 3000 });
      try { await probe.connect(); acpHandshake = true; break; }
      catch (e) { errors.push(e.message); await probe.close(); }
    }
    if (config.backend !== 'desktop' && !acpHandshake) startupError = 'ACP 握手失败: ' + (errors.join('; ') || '未发现端口，请启动 WorkBuddy');
    if (stopping) return;
    const port = probe?.port; await probe?.close();
    maap = new MaapClient({ wsUrl: config.wsUrl, apiKey: config.apiKey, tls: { rejectUnauthorized: true }, logger, mode: config.production ? 'cmicmaap' : 'mock' });
    bridge = config.backend === 'desktop' ? new DesktopInbox({ maap, config, onEvent: log }) : new Bridge({ maap, config, port, makeClient: (cwd, preferredSessionId) => new AcpClient({ port, discoverPorts: () => AcpClient.ports(), timeoutMs: 3000, cwd, onEvent: log, onPermission: permissionUI.request, persona: config.persona, preferredSessionId }), onEvent: log });
    maap.onMessage = msg => { try { bridge.enqueue(msg); } catch (e) { log({ type: 'message_rejected', error: e.message }); } };
    maap.onFrame = frame => { if (['error','auth_failed'].includes(frame.type)) { gatewayError = { type: frame.type, message: String(frame.message || frame.reason || '').replaceAll(config.apiKey, '[redacted]').slice(0,200), at: new Date().toISOString() }; log({ type: 'gateway_error', error: gatewayError }); } };
    maap.onConnect = () => { gatewayError = null; log({ type: 'gateway_auth_ok', mode: config.production ? 'production' : 'mock' }); };
    maap.onDisconnect = () => log({ type: 'gateway_disconnected' });
    maap.start();
    log({ type: 'ready', acpPort: port, dry: config.dry, mode: config.production ? 'production' : 'mock' });
  } catch (e) { startupError = e.message; acpHandshake = false; log({ type: 'startup_failed', error: e.message }); }
})();
