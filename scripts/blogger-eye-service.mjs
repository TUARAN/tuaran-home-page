import { spawnSync } from 'node:child_process'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const LABEL = 'com.2aran.blogger-eye'
const uid = typeof process.getuid === 'function' ? process.getuid() : null
const domain = uid == null ? '' : `gui/${uid}`
const repoRoot = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const serverPath = join(repoRoot, 'scripts', 'blogger-eye-server.mjs')
const launchAgentsDir = join(homedir(), 'Library', 'LaunchAgents')
const logDir = join(homedir(), 'Library', 'Logs', '2aran')
const plistPath = join(launchAgentsDir, `${LABEL}.plist`)
const stdoutPath = join(logDir, 'blogger-eye.log')
const stderrPath = join(logDir, 'blogger-eye.error.log')

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (char) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[char])
}

function runLaunchctl(args, options = {}) {
  const result = spawnSync('/bin/launchctl', args, { encoding: 'utf8' })
  if (!options.ignoreFailure && result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `launchctl ${args[0]} 失败`).trim())
  }
  return result
}

function plist(nodePath) {
  const servicePath = `${dirname(nodePath)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`
  const pairs = [
    ['Label', LABEL],
    ['ProgramArguments', [nodePath, serverPath]],
    ['WorkingDirectory', repoRoot],
    ['RunAtLoad', true],
    ['KeepAlive', true],
    ['ThrottleInterval', 5],
    ['StandardOutPath', stdoutPath],
    ['StandardErrorPath', stderrPath],
    ['EnvironmentVariables', { PATH: servicePath, BLOGGER_EYE_PORT: '5177' }],
  ]
  const render = (value) => {
    if (Array.isArray(value)) return `<array>${value.map((item) => `<string>${escapeXml(item)}</string>`).join('')}</array>`
    if (value && typeof value === 'object') return `<dict>${Object.entries(value).map(([key, item]) => `<key>${escapeXml(key)}</key><string>${escapeXml(item)}</string>`).join('')}</dict>`
    if (typeof value === 'boolean') return value ? '<true/>' : '<false/>'
    if (typeof value === 'number') return `<integer>${value}</integer>`
    return `<string>${escapeXml(value)}</string>`
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>${pairs.map(([key, value]) => `<key>${key}</key>${render(value)}`).join('')}</dict></plist>
`
}

async function install() {
  if (process.platform !== 'darwin' || !domain) throw new Error('自动常驻安装目前只支持 macOS 图形登录用户')
  await mkdir(launchAgentsDir, { recursive: true })
  await mkdir(logDir, { recursive: true })
  runLaunchctl(['bootout', domain, plistPath], { ignoreFailure: true })
  await writeFile(plistPath, plist(process.execPath), { mode: 0o600 })
  runLaunchctl(['bootstrap', domain, plistPath])
  runLaunchctl(['kickstart', '-k', `${domain}/${LABEL}`])
  console.log(`小眼睛后台服务已安装并启动：${LABEL}`)
  console.log('以后随 macOS 登录自动启动，不需要另开终端。')
  console.log(`日志：${stdoutPath}`)
}

async function uninstall() {
  if (!domain) throw new Error('无法确定当前图形登录用户')
  runLaunchctl(['bootout', domain, plistPath], { ignoreFailure: true })
  await unlink(plistPath).catch((error) => {
    if (error.code !== 'ENOENT') throw error
  })
  console.log(`已卸载 ${LABEL}；运行日志仍保留在 ${logDir}`)
}

async function status() {
  if (!domain) throw new Error('无法确定当前图形登录用户')
  const result = runLaunchctl(['print', `${domain}/${LABEL}`], { ignoreFailure: true })
  if (result.status !== 0) {
    console.log('小眼睛后台服务未安装或未运行。')
    process.exitCode = 1
    return
  }
  process.stdout.write(result.stdout)
  try {
    const health = await fetch('http://127.0.0.1:5177/api/health', { signal: AbortSignal.timeout(2000) })
    console.log(`\n健康检查：${health.ok ? '正常' : `HTTP ${health.status}`}`)
  } catch (error) {
    console.log(`\n健康检查：失败（${error.message}）`)
    process.exitCode = 1
  }
}

async function showPlist() {
  process.stdout.write(await readFile(plistPath, 'utf8'))
}

const command = process.argv[2] || 'status'
try {
  if (command === 'install') await install()
  else if (command === 'uninstall') await uninstall()
  else if (command === 'status') await status()
  else if (command === 'plist') await showPlist()
  else throw new Error('用法：node scripts/blogger-eye-service.mjs install|status|uninstall')
} catch (error) {
  console.error(error.message || String(error))
  process.exitCode = 1
}
