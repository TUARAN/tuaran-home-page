'use strict';
// Retire only this user's custom bridge. WorkBuddy's embedded agents are excluded.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const home = os.homedir(), label = 'cn.workbuddy.5g-cli-bridge';
const legacyRoot = path.join(home, 'Documents/codex/5g-cli-bridge');
const configFile = path.join(home, '.workbuddy/mcp.json');
const backup = path.join(home, '.workbuddy/retired-5g-cli', String(Date.now()));
fs.mkdirSync(backup, { recursive: true, mode: 0o700 });
const before = fs.readFileSync(configFile, 'utf8'), data = JSON.parse(before);
const old = data.mcpServers?.['5gmsg-channel'];
if (old && !old.args?.some(arg => typeof arg === 'string' && arg.startsWith(legacyRoot + '/'))) throw new Error('旧 MCP 路径不匹配，未修改配置');
if (old) delete data.mcpServers['5gmsg-channel'];
const after = JSON.stringify(data, null, 2) + '\n'; JSON.parse(after);
fs.writeFileSync(path.join(backup, 'mcp.json'), before, { mode: 0o600 });
const disabled = spawnSync('launchctl', ['disable', `gui/${process.getuid()}/${label}`], { encoding: 'utf8' });
if (disabled.status) throw new Error(disabled.stderr || '无法禁用旧启动项');
spawnSync('launchctl', ['bootout', `gui/${process.getuid()}/${label}`]);
const plist = path.join(home, 'Library/LaunchAgents', label + '.plist');
if (fs.existsSync(plist)) fs.renameSync(plist, path.join(backup, label + '.plist'));
const result = spawnSync('ps', ['-axo', 'pid=,command='], { encoding: 'utf8' });
if (result.status) throw new Error('无法核对进程');
const stopped = [];
for (const line of result.stdout.split('\n')) {
  const match = line.trim().match(/^(\d+)\s+(.*)$/); if (!match) continue;
  const pid = Number(match[1]), command = match[2];
  if (pid === process.pid || command.includes('/Applications/WorkBuddy.app/')) continue;
  const legacyScripts = ['guard.cjs', 'launch-macos.cjs', '5g-cli-bridge.cjs'].map(f => path.join(legacyRoot, f));
  if (legacyScripts.some(script => command.split(/\s+/).includes(script))) {
    try { process.kill(pid, 'SIGTERM'); stopped.push(pid); } catch (e) { if (e.code !== 'ESRCH') throw e; }
  }
}
fs.writeFileSync(configFile + '.retire.tmp', after, { mode: 0o600 });
fs.renameSync(configFile + '.retire.tmp', configFile);
// Diff includes only names, flags and paths; no credentials or other connectors.
const safe = entry => entry ? { command: entry.command, args: entry.args, disabled: entry.disabled } : null;
console.log(JSON.stringify({ backup, stopped, jsonValid: true, diff: { '5gmsg-channel': { before: safe(old), after: null } }, oldLaunchAgentRemoved: !fs.existsSync(plist) }, null, 2));
