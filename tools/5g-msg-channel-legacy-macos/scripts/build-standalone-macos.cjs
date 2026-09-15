'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '..', '..');
const version = require('../src/version.cjs');
const arch = process.arch;
if (process.platform !== 'darwin') throw new Error('macOS 安装包只能在 macOS 上构建');
if (arch !== 'arm64') throw new Error(`当前构建器仅发布 arm64，实际为 ${arch}`);

const outputDir = path.join(repoRoot, 'desktop-dist');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'new-message-phone-package-'));
const volumeRoot = path.join(tempRoot, 'volume');
const appRoot = path.join(volumeRoot, '安装新消息手机.app');
const contents = path.join(appRoot, 'Contents');
const resources = path.join(contents, 'Resources');
const connectorOut = path.join(resources, 'connector');
const runtimeOut = path.join(resources, 'runtime');
const artifact = path.join(outputDir, `new-message-phone-macos-${arch}-v${version}.dmg`);

function copy(source, target) {
  fs.cpSync(source, target, { recursive: true, dereference: true });
}
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${command} failed`);
  return result.stdout.trim();
}

try {
  fs.mkdirSync(path.join(contents, 'MacOS'), { recursive: true });
  fs.mkdirSync(connectorOut, { recursive: true });
  fs.mkdirSync(runtimeOut, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  fs.mkdirSync(path.join(connectorOut, 'src'), { recursive: true });
  for (const name of fs.readdirSync(path.join(root, 'src')).filter(name => name.endsWith('.cjs') && !name.includes('.bak'))) {
    copy(path.join(root, 'src', name), path.join(connectorOut, 'src', name));
  }
  copy(path.join(root, 'node_modules'), path.join(connectorOut, 'node_modules'));
  fs.mkdirSync(path.join(connectorOut, 'scripts'), { recursive: true });
  for (const name of ['install-service.cjs', 'service-launch.cjs', 'channel.cjs']) {
    copy(path.join(root, 'scripts', name), path.join(connectorOut, 'scripts', name));
  }
  for (const name of ['package.json', 'package-lock.json', 'README.md']) copy(path.join(root, name), path.join(connectorOut, name));

  const runtimeSource = fs.realpathSync(process.execPath);
  copy(runtimeSource, path.join(runtimeOut, 'node'));
  fs.chmodSync(path.join(runtimeOut, 'node'), 0o755);
  copy(path.join(root, 'scripts', 'setup-one-click.cjs'), path.join(resources, 'setup-one-click.cjs'));

  fs.writeFileSync(path.join(contents, 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleDisplayName</key><string>安装新消息手机</string>
<key>CFBundleExecutable</key><string>new-message-phone-installer</string>
<key>CFBundleIdentifier</key><string>com.tuaran.new-message-phone.installer</string>
<key>CFBundleName</key><string>安装新消息手机</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>${version}</string>
<key>CFBundleVersion</key><string>${version.replace(/\D/g, '')}</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
</dict></plist>\n`);

  const launcher = `#!/bin/zsh
set -eu
RES="$(cd "$(dirname "$0")/../Resources" && pwd)"
SUPPORT="$HOME/Library/Application Support/NewMessagePhone"
mkdir -p "$SUPPORT/runtime" "$SUPPORT/connector"
/usr/bin/ditto "$RES/runtime" "$SUPPORT/runtime"
/usr/bin/ditto "$RES/connector" "$SUPPORT/connector"
/bin/cp "$RES/setup-one-click.cjs" "$SUPPORT/setup-one-click.cjs"
/bin/chmod 700 "$SUPPORT/runtime/node"
API_KEY=$(/usr/bin/osascript -e 'text returned of (display dialog "请输入 MaaP 网关 API Key" default answer "" with hidden answer buttons {"取消", "继续"} default button "继续")') || exit 0
SENDERS=$(/usr/bin/osascript -e 'text returned of (display dialog "请输入允许使用服务的手机号（多个号码用英文逗号分隔）" default answer "" buttons {"取消", "安装"} default button "安装")') || exit 0
if "$SUPPORT/runtime/node" "$SUPPORT/setup-one-click.cjs" "$API_KEY" "$SENDERS" "wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg"; then
  /usr/bin/osascript -e 'display dialog "安装完成。请启动或重启 WorkBuddy，并在连接器列表中信任“新消息手机”。" buttons {"知道了"} default button "知道了" with icon note'
else
  /usr/bin/osascript -e 'display dialog "安装未完成。请检查 API Key、手机号和 WorkBuddy 是否已安装。" buttons {"知道了"} default button "知道了" with icon stop'
  exit 1
fi
`;
  const launcherPath = path.join(contents, 'MacOS', 'new-message-phone-installer');
  fs.writeFileSync(launcherPath, launcher, { mode: 0o755 });

  fs.writeFileSync(path.join(volumeRoot, '使用说明.txt'), `新消息手机连接器 v${version}\n\n1. 双击“安装新消息手机”。\n2. 输入平台提供的 MaaP API Key 和允许号码。\n3. 启动或重启 WorkBuddy，在连接器列表中完成一次信任。\n\n安装包不会内置或上传您的 API Key。真实消息收发可能产生运营商费用。\n`);

  run('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', appRoot]);
  if (fs.existsSync(artifact)) fs.unlinkSync(artifact);
  run('/usr/bin/hdiutil', ['create', '-volname', '新消息手机', '-srcfolder', volumeRoot, '-ov', '-format', 'UDZO', artifact]);
  const sha256 = run('/usr/bin/shasum', ['-a', '256', artifact]).split(/\s+/)[0];
  process.stdout.write(JSON.stringify({ artifact, version, arch, bytes: fs.statSync(artifact).size, sha256 }, null, 2) + '\n');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
