'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const [apiKeyRaw, sendersRaw, wsUrlRaw] = process.argv.slice(2);
const apiKey = String(apiKeyRaw || '').trim();
const senders = String(sendersRaw || '').split(',').map(value => value.trim().replace(/^\+/, '')).filter(Boolean);
const wsUrl = String(wsUrlRaw || 'wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg').trim();

if (!apiKey || /\s/.test(apiKey) || apiKey.length < 8) throw new Error('网关 API Key 无效');
if (!senders.length || senders.some(value => !/^\d{10,15}$/.test(value))) {
  throw new Error('允许号码格式无效，请使用 10—15 位数字；多个号码用英文逗号分隔');
}
if (!/^wss:\/\//i.test(wsUrl)) throw new Error('网关地址必须以 wss:// 开头');

const home = os.homedir();
const supportRoot = path.join(home, 'Library', 'Application Support', 'NewMessagePhone');
const connectorRoot = path.join(supportRoot, 'connector');
const runtimeNode = path.join(supportRoot, 'runtime', 'node');
const workbuddyRoot = path.join(home, '.workbuddy');
const mcpFile = path.join(workbuddyRoot, 'mcp.json');
const keyDir = path.join(workbuddyRoot, 'secrets');
const keyFile = path.join(keyDir, 'new-message-phone-maap.key');
const workspace = path.join(supportRoot, 'workspace');

fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
fs.mkdirSync(workspace, { recursive: true, mode: 0o700 });
fs.writeFileSync(keyFile, apiKey + '\n', { mode: 0o600 });
fs.chmodSync(keyFile, 0o600);

let config = { mcpServers: {} };
let before = '';
if (fs.existsSync(mcpFile)) {
  before = fs.readFileSync(mcpFile, 'utf8');
  config = JSON.parse(before);
}
if (!config.mcpServers || typeof config.mcpServers !== 'object') config.mcpServers = {};

if (config.mcpServers['5g-msg-channel-macos']) {
  config.mcpServers['5g-msg-channel-macos'] = { ...config.mcpServers['5g-msg-channel-macos'], disabled: true };
}
config.mcpServers['5g-msg-channel-legacy-macos'] = {
  type: 'stdio',
  command: runtimeNode,
  args: [path.join(connectorRoot, 'src', 'mcp-client.cjs')],
  cwd: connectorRoot,
  disabled: false,
  env: {
    BRIDGE_MODE: 'production',
    MAAP_WS_URL: wsUrl,
    MAAP_API_KEY_FILE: keyFile,
    ENFORCE_WHITELIST: 'true',
    ALLOWED_SENDERS: senders.join(','),
    BRIDGE_DRY: '0',
    ACP_CWD: workspace,
    BRIDGE_SOCKET: path.join(workbuddyRoot, '5g-legacy-macos.sock'),
  },
};

fs.mkdirSync(workbuddyRoot, { recursive: true, mode: 0o700 });
if (before) fs.writeFileSync(`${mcpFile}.bak-new-message-phone-${Date.now()}`, before, { mode: 0o600, flag: 'wx' });
const temp = `${mcpFile}.tmp-new-message-phone`;
fs.writeFileSync(temp, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
fs.renameSync(temp, mcpFile);
fs.chmodSync(mcpFile, 0o600);

const install = spawnSync(runtimeNode, [path.join(connectorRoot, 'scripts', 'install-service.cjs')], {
  cwd: connectorRoot,
  encoding: 'utf8',
});
if (install.status !== 0) throw new Error(install.stderr || install.stdout || '后台服务安装失败');

const label = 'com.tuaran.5g-msg-channel-legacy-macos';
const plist = path.join(home, 'Library', 'LaunchAgents', `${label}.plist`);
spawnSync('/bin/launchctl', ['bootout', `gui/${process.getuid()}`, plist], { encoding: 'utf8' });
const start = spawnSync('/bin/launchctl', ['bootstrap', `gui/${process.getuid()}`, plist], { encoding: 'utf8' });
if (start.status !== 0) throw new Error(start.stderr || start.stdout || '后台服务启动失败');

process.stdout.write(JSON.stringify({ installed: true, connectorRoot, allowedSenderCount: senders.length }));
