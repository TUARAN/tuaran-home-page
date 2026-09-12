'use strict';
/*
 * 守护进程的 launchd 服务管理（install / uninstall / status）
 * Label: cn.workbuddy.5g-daemon
 * 用法：
 *   node scripts/daemon-service.cjs install    # 写入 plist 并加载（开机自启 + KeepAlive）
 *   node scripts/daemon-service.cjs uninstall  # 卸载
 *   node scripts/daemon-service.cjs status     # 查看运行状态
 * 环境变量（安装时固化进 plist）：DAEMON_REPLY / DAEMON_REPLY_TEMPLATE / DAEMON_HOOK / DAEMON_WAIT
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const LABEL = 'cn.workbuddy.5g-daemon';
const NODE = '/Users/tuaran/.hermes/node/bin/node';
const SCRIPT = path.join(__dirname, 'daemon.cjs');
const CWD = path.join(__dirname, '..');
const LOG_DIR = path.join(CWD, 'var');
const PLIST = path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);
const STDOUT = path.join(LOG_DIR, 'daemon-stdout.log');
const STDERR = path.join(LOG_DIR, 'daemon-stderr.log');

function buildPlist() {
  const env = {
    PATH: '/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
    DAEMON_REPLY: process.env.DAEMON_REPLY || 'echo',
    DAEMON_REPLY_TEMPLATE: process.env.DAEMON_REPLY_TEMPLATE || '已收到：{text}',
    DAEMON_HOOK: process.env.DAEMON_HOOK || '',
    DAEMON_WAIT: String(Number.parseInt(process.env.DAEMON_WAIT, 10) || 50),
    DAEMON_FORWARD_WORKBUDDY: process.env.DAEMON_FORWARD_WORKBUDDY || '0',
    DAEMON_INBOX_FILE: process.env.DAEMON_INBOX_FILE || path.join(os.homedir(), '.workbuddy', '5g-inbox.jsonl'),
    DAEMON_NOTIFY: process.env.DAEMON_NOTIFY || '1',
    DAEMON_LOG: path.join(LOG_DIR, 'daemon.log'),
  };
  const envDict = Object.entries(env).map(([k, v]) => `      <key>${k}</key><string>${escapeXml(v)}</string>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array><string>${NODE}</string><string>${SCRIPT}</string></array>
  <key>WorkingDirectory</key><string>${CWD}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>5</integer>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>${STDOUT}</string>
  <key>StandardErrorPath</key><string>${STDERR}</string>
  <key>EnvironmentVariables</key><dict>
${envDict}
  </dict>
</dict></plist>`;
}
function escapeXml(s) { return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c])); }

const cmd = process.argv[2] || 'status';
if (!['install', 'uninstall', 'status', 'restart'].includes(cmd)) throw new Error('用法: daemon-service.cjs install|uninstall|status|restart');

const DOMAIN = `gui/${process.getuid()}`;
const SERVICE = `${DOMAIN}/${LABEL}`;

function bootout() { try { execFileSync('/bin/launchctl', ['bootout', SERVICE], { stdio: 'ignore' }); } catch {} }
function bootstrap() { execFileSync('/bin/launchctl', ['bootstrap', DOMAIN, PLIST]); }

fs.mkdirSync(LOG_DIR, { recursive: true });
if (cmd === 'install') {
  fs.writeFileSync(PLIST, buildPlist());
  bootout();
  bootstrap();
  console.log('✅ 已安装并加载', LABEL);
  console.log('   plist:', PLIST);
  console.log('   日志: ', STDOUT, '/', STDERR);
  console.log('   说明: 守护进程为收件唯一接收者，请勿同时在 WorkBuddy 对话中 receive。');
} else if (cmd === 'uninstall') {
  bootout();
  try { fs.unlinkSync(PLIST); } catch {}
  console.log('✅ 已卸载', LABEL);
} else if (cmd === 'restart') {
  bootout();
  bootstrap();
  console.log('✅ 已重启', LABEL);
} else {
  try {
    const out = execFileSync('/bin/launchctl', ['print', SERVICE], { encoding: 'utf8' });
    console.log(out.split('\n').filter(l => /state|pid|last exit|runs|reason/i.test(l)).join('\n') || out);
  } catch (e) {
    console.log('未运行（未安装或已卸载）:', LABEL);
  }
}
