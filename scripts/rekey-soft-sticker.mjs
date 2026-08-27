#!/usr/bin/env node
// 从本机原始资料与生成历史恢复软贴空间，再统一加密到一个新口令。
// 口令通过 TTY 无回显输入，只存在于当前 Node 进程内存中。

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { decryptPayload, encryptPayload } from '../lib/longCompass/crypto.js'
import { CURRENT_PLAIN_VERSION } from '../lib/longCompass/schema.js'
import { SOFT_STICKER_ENVELOPE } from '../app/(admin)/admin/soft-sticker/seed.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATABASE = 'tuaran-me'
const OWNER_ID = 'github:25968749'
const MEMOIR_SLUG = 'self-regulation-memoir'
const SEED_PATH = path.join(ROOT, 'app/(admin)/admin/soft-sticker/seed.js')
const COMPASS_SOURCE_PATH = path.join(ROOT, 'private/long-compass-seed.json')
const RECOVERY_DIR = path.join(ROOT, 'private/soft-sticker-recovery')
const SESSION_DIR = path.join(os.homedir(), '.codex/sessions/2026/08/25')
const WRANGLER_PATH = path.join(
  ROOT,
  'node_modules/.bin',
  process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler'
)
const VERIFY_SOURCES_ONLY = process.argv.includes('--verify-sources')

function promptHidden(label) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      throw new Error('需要在交互式终端中运行，新口令不会从命令行参数或环境变量读取。')
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    process.stdout.write(`${label}: `)
    process.stdin.setRawMode(true)
    let buffer = ''

    const finish = () => {
      process.stdin.setRawMode(false)
      process.stdin.removeListener('data', onData)
      rl.close()
      process.stdout.write('\n')
      resolve(buffer)
    }

    const onData = (chunk) => {
      for (const char of chunk.toString()) {
        const code = char.charCodeAt(0)
        if (code === 13 || code === 10) return finish()
        if (code === 3) {
          process.stdin.setRawMode(false)
          process.stdout.write('\n')
          process.exit(130)
        }
        if (code === 127 || code === 8) buffer = buffer.slice(0, -1)
        else buffer += char
      }
    }

    process.stdin.on('data', onData)
  })
}

function wranglerEnvironment() {
  const env = { ...process.env }
  for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy']) {
    delete env[key]
  }
  return env
}

export function parseWranglerRows(stdout) {
  const payload = JSON.parse(String(stdout || '').trim())
  const result = Array.isArray(payload) ? payload[0] : payload
  if (!result?.success || !Array.isArray(result.results)) {
    throw new Error('Wrangler 没有返回有效的 D1 查询结果。')
  }
  return result.results
}

function queryRemote(command) {
  const result = spawnSync(
    WRANGLER_PATH,
    ['d1', 'execute', DATABASE, '--remote', '--command', command, '--json'],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: wranglerEnvironment(),
      maxBuffer: 64 * 1024 * 1024,
    }
  )
  if (result.status !== 0) {
    throw new Error(`Wrangler 查询失败：${String(result.stderr || result.stdout || '').trim()}`)
  }
  return parseWranglerRows(result.stdout)
}

function executeRemoteFile(sqlPath) {
  return spawnSync(
    WRANGLER_PATH,
    ['d1', 'execute', DATABASE, '--remote', `--file=${sqlPath}`, '--yes'],
    { cwd: ROOT, stdio: 'inherit', env: wranglerEnvironment() }
  )
}

export function escapeSqlLiteral(value) {
  return String(value).replaceAll("'", "''")
}

function envelopeSql(value) {
  return `'${escapeSqlLiteral(JSON.stringify(value))}'`
}

export function extractRecoveryCandidates(events) {
  const candidates = new Set()
  const patterns = [
    /\bpassword\s*=\s*'([^'\r\n]+)'/g,
    /\bpassword\s*=\s*"([^"\r\n]+)"/g,
    /encryptPayload\(\{schemaVersion:1,markdown\},\s*'([^'\r\n]+)'\)/g,
    /encryptPayload\(\{schemaVersion:1,markdown\},\s*"([^"\r\n]+)"\)/g,
  ]

  for (const event of events) {
    const payload = event?.payload
    if (payload?.type !== 'custom_tool_call' || typeof payload.input !== 'string') continue
    for (const pattern of patterns) {
      pattern.lastIndex = 0
      for (const match of payload.input.matchAll(pattern)) candidates.add(match[1])
    }
  }
  return [...candidates]
}

function readRecoveryEvents() {
  if (!fs.existsSync(SESSION_DIR)) throw new Error('找不到 2026-08-25 的本地生成历史。')
  const events = []
  const files = fs.readdirSync(SESSION_DIR).filter((name) => name.endsWith('.jsonl')).sort()
  for (const name of files) {
    const lines = fs.readFileSync(path.join(SESSION_DIR, name), 'utf8').split(/\r?\n/)
    for (const line of lines) {
      if (!line) continue
      try {
        events.push(JSON.parse(line))
      } catch {
        // 单条损坏不影响其他历史；采用候选值前还必须通过密文完整性验证。
      }
    }
  }
  return events
}

async function decryptWithCandidates(envelope, candidates, label) {
  for (const candidate of candidates) {
    try {
      return await decryptPayload(envelope, candidate)
    } catch {
      // 不输出候选值；继续用 AES-GCM 完整性标签验证下一项。
    }
  }
  throw new Error(`无法从本机生成历史恢复${label}。`)
}

function assertUnifiedPassword(password) {
  if (!password) throw new Error('新的统一口令不能为空。')
  if (password !== password.trim()) throw new Error('新的统一口令首尾不能包含空格。')
  if (password.length < 6) throw new Error('新的统一口令至少需要 6 个字符。')
}

function writeSeedAtomically(envelope) {
  const nextSource = [
    '// SoftSticker 只保存 AES-GCM 密文。明文数据与解锁口令不得写入仓库或客户端源码。',
    `export const SOFT_STICKER_ENVELOPE = ${JSON.stringify(envelope)}`,
    '',
  ].join('\n')
  const tempPath = `${SEED_PATH}.rekey-tmp`
  fs.writeFileSync(tempPath, nextSource, { mode: 0o600 })
  fs.renameSync(tempPath, SEED_PATH)
}

function normalizeCompassPlain(source, now) {
  return {
    title: source.title,
    summary: source.summary || '',
    content: source.content,
    updatedAt: source.updatedAt || now,
    authoredBy: source.authoredBy || '',
    theme: Array.isArray(source.theme) ? source.theme : [],
    schemaVersion: source.schemaVersion || CURRENT_PLAIN_VERSION,
  }
}

async function recoverSources() {
  if (!fs.existsSync(WRANGLER_PATH)) throw new Error('未安装 Wrangler，请先运行 pnpm install。')
  if (!fs.existsSync(COMPASS_SOURCE_PATH)) throw new Error('找不到 private/long-compass-seed.json。')

  const candidates = extractRecoveryCandidates(readRecoveryEvents())
  if (candidates.length === 0) throw new Error('本机生成历史中没有可验证的恢复材料。')

  const recordsPlain = await decryptWithCandidates(
    SOFT_STICKER_ENVELOPE,
    candidates,
    '体验记录'
  )
  if (recordsPlain?.schemaVersion !== 1 || !Array.isArray(recordsPlain.records)) {
    throw new Error('恢复出的体验记录结构异常。')
  }

  const memoirRows = queryRemote(
    `SELECT title, content, created_at, updated_at FROM private_documents WHERE slug = '${MEMOIR_SLUG}' LIMIT 1;`
  )
  if (memoirRows.length !== 1) throw new Error('远端回忆录不存在。')
  const memoirEnvelope = JSON.parse(memoirRows[0].content)
  const memoirPlain = await decryptWithCandidates(memoirEnvelope, candidates, '回忆录')
  if (memoirPlain?.schemaVersion !== 1 || typeof memoirPlain.markdown !== 'string') {
    throw new Error('恢复出的回忆录结构异常。')
  }

  const compassSource = JSON.parse(fs.readFileSync(COMPASS_SOURCE_PATH, 'utf8'))
  if (!Array.isArray(compassSource) || compassSource.length === 0) {
    throw new Error('长期罗盘原始种子为空或格式异常。')
  }

  const oldCompassRows = queryRemote(
    `SELECT id, encrypted_payload FROM private_records WHERE user_id = '${OWNER_ID}' AND deleted_at IS NULL ORDER BY id;`
  )

  return { recordsPlain, memoirPlain, memoirRow: memoirRows[0], compassSource, oldCompassRows }
}

async function main() {
  console.log('软贴空间原始数据恢复与统一加密')
  console.log('旧口令不再需要；恢复材料只从本机读取，不会输出口令或正文。\n')

  console.log('▸ 正在验证本机原始资料与生成历史…')
  const recovered = await recoverSources()
  console.log(`✓ 体验记录：${recovered.recordsPlain.records.length} 条`)
  console.log(`✓ 回忆录：${recovered.memoirPlain.markdown.length} 字符`)
  console.log(`✓ 长期罗盘：${recovered.compassSource.length} 条`)

  if (VERIFY_SOURCES_ONLY) {
    console.log('✓ 恢复源验证完成，未修改仓库或远端 D1。')
    return
  }

  const unifiedPassword = await promptHidden('新的统一口令（至少 6 个字符）')
  assertUnifiedPassword(unifiedPassword)
  const confirmation = await promptHidden('再次输入新的统一口令')
  if (confirmation !== unifiedPassword) throw new Error('两次输入的新统一口令不一致。')

  console.log('▸ 正在用新统一口令加密三类原始资料…')
  const now = Date.now()
  const nextRecordsEnvelope = await encryptPayload(recovered.recordsPlain, unifiedPassword)
  const nextMemoirEnvelope = await encryptPayload(recovered.memoirPlain, unifiedPassword)
  const nextCompassRows = []
  for (let index = 0; index < recovered.compassSource.length; index += 1) {
    const source = recovered.compassSource[index]
    const plain = normalizeCompassPlain(source, now)
    nextCompassRows.push({
      kind: source.kind,
      envelope: await encryptPayload(plain, unifiedPassword),
      createdAt: now + index,
      updatedAt: now + index,
    })
  }

  await decryptPayload(nextRecordsEnvelope, unifiedPassword)
  await decryptPayload(nextMemoirEnvelope, unifiedPassword)
  for (const row of nextCompassRows) await decryptPayload(row.envelope, unifiedPassword)

  fs.mkdirSync(RECOVERY_DIR, { recursive: true, mode: 0o700 })
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
  const backupPath = path.join(RECOVERY_DIR, `ciphertext-backup-${stamp}.json`)
  const recordsSourcePath = path.join(RECOVERY_DIR, 'records.json')
  const memoirSourcePath = path.join(RECOVERY_DIR, 'memoir.md')
  const sqlPath = path.join(RECOVERY_DIR, `rebuild-${stamp}.sql`)
  const originalSeedSource = fs.readFileSync(SEED_PATH, 'utf8')

  fs.writeFileSync(
    backupPath,
    `${JSON.stringify({
      createdAt: now,
      recordsEnvelope: SOFT_STICKER_ENVELOPE,
      memoir: recovered.memoirRow,
      compass: recovered.oldCompassRows,
    })}\n`,
    { mode: 0o600 }
  )
  fs.writeFileSync(recordsSourcePath, `${JSON.stringify(recovered.recordsPlain, null, 2)}\n`, { mode: 0o600 })
  fs.writeFileSync(memoirSourcePath, recovered.memoirPlain.markdown, { mode: 0o600 })

  const sql = [
    `UPDATE private_documents SET content = ${envelopeSql(nextMemoirEnvelope)} WHERE slug = '${MEMOIR_SLUG}';`,
    `DELETE FROM private_records WHERE user_id = '${OWNER_ID}';`,
    ...nextCompassRows.map(
      (row) =>
        `INSERT INTO private_records (user_id, record_kind, encrypted_payload, created_at, updated_at) VALUES ('${OWNER_ID}', '${escapeSqlLiteral(row.kind)}', ${envelopeSql(row.envelope)}, ${row.createdAt}, ${row.updatedAt});`
    ),
    '',
  ].join('\n')
  fs.writeFileSync(sqlPath, sql, { mode: 0o600 })

  try {
    writeSeedAtomically(nextRecordsEnvelope)
    const result = executeRemoteFile(sqlPath)
    if (result.status !== 0) throw new Error(`Wrangler 写入失败（exit ${result.status ?? 'unknown'}）`)
    fs.unlinkSync(sqlPath)
  } catch (error) {
    fs.writeFileSync(SEED_PATH, originalSeedSource)
    throw error
  }

  console.log('▸ 正在回读远端新密文…')
  const verifiedMemoirRows = queryRemote(
    `SELECT content FROM private_documents WHERE slug = '${MEMOIR_SLUG}' LIMIT 1;`
  )
  const verifiedCompassRows = queryRemote(
    `SELECT encrypted_payload FROM private_records WHERE user_id = '${OWNER_ID}' AND deleted_at IS NULL ORDER BY id;`
  )
  await decryptPayload(JSON.parse(verifiedMemoirRows[0].content), unifiedPassword)
  for (const row of verifiedCompassRows) {
    await decryptPayload(JSON.parse(row.encrypted_payload), unifiedPassword)
  }
  if (verifiedCompassRows.length !== nextCompassRows.length) {
    throw new Error(`远端长期罗盘数量异常：期望 ${nextCompassRows.length}，实际 ${verifiedCompassRows.length}。`)
  }

  console.log('✓ 三类数据已恢复，并统一到同一个新口令。')
  console.log(`✓ 原始资料保存在 ${path.relative(ROOT, RECOVERY_DIR)}/（Git 已忽略，权限 600）。`)
  console.log(`✓ 回滚密文备份：${path.relative(ROOT, backupPath)}`)
  console.log('✓ seed.js 已更新，请随代码部署后使用新口令解锁。')
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(`✘ ${error?.message || error}`)
    process.exit(1)
  })
}
