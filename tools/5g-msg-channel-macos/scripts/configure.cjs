'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
function configure({ target = path.join(os.homedir(), '.workbuddy/mcp.json'), apply = false } = {}) {
  const before = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '{}\n';
  const data = JSON.parse(before);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('mcp.json 根节点必须是对象');
  if (data.mcpServers && (typeof data.mcpServers !== 'object' || Array.isArray(data.mcpServers))) throw new Error('mcpServers 必须是对象');
  const entry = { type: 'stdio', command: process.execPath, args: [path.join(ROOT, 'src/index.cjs'), '--mock'], cwd: ROOT,
    env: { ACP_CWD: path.join(ROOT, 'var/workspace'), ENFORCE_WHITELIST: 'true', ALLOWED_SENDERS: 'test-sender', BRIDGE_DRY: '1' } };
  const name = '5g-msg-channel-macos';
  if (data.mcpServers?.[name] && JSON.stringify(data.mcpServers[name]) !== JSON.stringify(entry)) throw new Error('已有同名配置且内容不同；请先人工核对，防止覆盖生产配置');
  data.mcpServers ||= {}; data.mcpServers[name] = entry;
  const after = JSON.stringify(data, null, 2) + '\n'; JSON.parse(after);
  // Diff only this entry: never print credentials belonging to other connectors.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '5g-config-diff-'));
  const oldEntry = JSON.parse(before).mcpServers?.[name];
  fs.writeFileSync(path.join(dir, 'before.json'), JSON.stringify(oldEntry ? { [name]: oldEntry } : {}, null, 2) + '\n', { mode: 0o600 });
  fs.writeFileSync(path.join(dir, 'after.json'), JSON.stringify({ [name]: entry }, null, 2) + '\n', { mode: 0o600 });
  const diff = spawnSync('diff', ['-u', path.join(dir, 'before.json'), path.join(dir, 'after.json')], { encoding: 'utf8' }).stdout;
  fs.rmSync(dir, { recursive: true });
  if (apply && before !== after) {
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    if (fs.existsSync(target)) fs.writeFileSync(target + '.bak-' + Date.now(), before, { mode: 0o600, flag: 'wx' });
    const temp = target + '.tmp-' + process.pid;
    fs.writeFileSync(temp, after, { mode: 0o600, flag: 'wx' });
    JSON.parse(fs.readFileSync(temp, 'utf8'));
    fs.renameSync(temp, target);
  }
  return { target, applied: apply, jsonValid: true, diff };
}
if (require.main === module) {
  try { const result = configure({ apply: process.argv.includes('--apply') }); console.log(result.diff); console.log(JSON.stringify({ ...result, diff: undefined }, null, 2)); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { configure };
