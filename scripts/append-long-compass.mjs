#!/usr/bin/env node
// Append only. No plaintext or password is sent to D1, logged, or passed in argv.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { decryptPayload, encryptPayload } from '../lib/longCompass/crypto.js'
import { CURRENT_PLAIN_VERSION, isValidKind, migrate, validatePlain } from '../lib/longCompass/schema.js'
import { parseWranglerRows, escapeSqlLiteral } from './rekey-soft-sticker.mjs'
import { ownerLookupSql, resolvePrivateRecordOwner } from './private-record-owner.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function normalizeSource(source) {
  if (!isValidKind(source?.kind) || !validatePlain(source).ok || !Number.isSafeInteger(source.updatedAt) || source.updatedAt <= 0) throw new Error('记录类型、正文或历史时间无效。')
  if (source.schemaVersion > CURRENT_PLAIN_VERSION) throw new Error('不支持此明文版本，请先升级导入工具。')
  const { _migratedFrom, ...plain } = migrate(source)
  return { kind: source.kind, plain }
}

export function pendingSources(sources, existing) {
  const pending = []
  for (const source of sources) {
    const same = [...existing, ...pending].find((item) => item.kind === source.kind && item.plain.title === source.plain.title && item.plain.updatedAt === source.plain.updatedAt)
    if (!same) pending.push(source)
    else if (same.plain.content !== source.plain.content || same.plain.summary !== source.plain.summary || same.plain.authoredBy !== source.plain.authoredBy || JSON.stringify(same.plain.theme) !== JSON.stringify(source.plain.theme)) throw new Error('同标题、同时间的记录内容不同；拒绝覆盖历史快照。')
  }
  return pending
}

export function insertStatement(envelope, kind, recordedAt, ownerId) {
  if (!isValidKind(kind) || !Number.isSafeInteger(recordedAt) || recordedAt <= 0 || !ownerId) throw new Error('Invalid insert metadata')
  const payload = escapeSqlLiteral(JSON.stringify(envelope))
  const owner = escapeSqlLiteral(ownerId)
  return `INSERT INTO private_records (user_id, record_kind, encrypted_payload, created_at, updated_at) SELECT '${owner}', '${kind}', '${payload}', ${recordedAt}, ${recordedAt} WHERE NOT EXISTS (SELECT 1 FROM private_records WHERE user_id = '${owner}' AND encrypted_payload = '${payload}');`
}

function promptPassword() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('请在本地交互式终端运行，口令不接受参数、环境变量或管道输入。')
  return new Promise((resolve, reject) => {
    const wasRaw = process.stdin.isRaw
    const oldEncoding = process.stdin.readableEncoding
    process.stdout.write('软贴空间统一解锁口令（不回显）: ')
    process.stdin.setRawMode(true)
    process.stdin.setEncoding('utf8')
    process.stdin.resume()
    let buffer = ''
    const finish = (error) => {
      process.stdin.off('data', onData)
      process.stdin.setRawMode(Boolean(wasRaw))
      if (oldEncoding) process.stdin.setEncoding(oldEncoding)
      process.stdin.pause()
      process.stdout.write('\n')
      if (error) reject(error)
      else resolve(buffer)
    }
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') return finish()
        if (char === '\u0003' || char === '\u0004') return finish(new Error('已取消。'))
        if (char === '\u007f' || char === '\b') buffer = [...buffer].slice(0, -1).join('')
        else if (char >= ' ') buffer += char
      }
    }
    process.stdin.on('data', onData)
  })
}

function wrangler(args) {
  const result = spawnSync(path.join(ROOT, 'node_modules/.bin/wrangler'), ['d1', 'execute', 'tuaran-me', '--remote', ...args], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  // Do not echo CLI output: it can contain ciphertext or environment diagnostics.
  if (result.status !== 0) throw new Error('D1 操作未确认成功，请检查 Cloudflare 登录及网络后重试；不要重置历史记录。')
  return result.stdout
}

function readOwnerId() {
  return resolvePrivateRecordOwner(parseWranglerRows(wrangler(['--command', ownerLookupSql(), '--json'])))
}

function readRows(ownerId) {
  const owner = escapeSqlLiteral(ownerId)
  return parseWranglerRows(wrangler(['--command', `SELECT id, record_kind, encrypted_payload FROM private_records WHERE user_id = '${owner}' AND deleted_at IS NULL ORDER BY id;`, '--json']))
}

export async function appendRecords(sources, password, { read, write, ownerId }) {
  if (!ownerId) throw new Error('缺少长期罗盘所属的平台账号，拒绝写入。')
  const before = await read()
  if (!before.length) throw new Error('远端没有可验证口令的现有记录，拒绝初始化。')
  const existing = []
  try {
    for (const row of before) existing.push({ kind: row.record_kind, plain: migrate(await decryptPayload(JSON.parse(row.encrypted_payload), password)) })
  } catch { throw new Error('统一口令无法解锁全部现有罗盘记录，未写入。') }
  const pending = pendingSources(sources, existing)
  if (!pending.length) return 0
  const inserts = []
  for (const source of pending) inserts.push({ ...source, envelope: await encryptPayload(source.plain, password) })
  await write(inserts.map((item) => insertStatement(item.envelope, item.kind, item.plain.updatedAt, ownerId)).join('\n'))
  const after = await read()
  for (const item of inserts) {
    const matches = after.filter((row) => row.encrypted_payload === JSON.stringify(item.envelope) && row.record_kind === item.kind)
    if (matches.length !== 1) throw new Error('写入后回读验证失败；可重跑以核对，但不要删除历史记录。')
    const plain = await decryptPayload(JSON.parse(matches[0].encrypted_payload), password)
    if (JSON.stringify(plain) !== JSON.stringify(item.plain)) throw new Error('回读内容不一致。')
  }
  return inserts.length
}

async function main() {
  const args = process.argv.slice(2)
  const validateOnly = args.includes('--validate-only')
  const files = args.filter((arg) => arg !== '--validate-only')
  if (files.length !== 1) throw new Error('用法：node scripts/append-long-compass.mjs <private/快照.json> [--validate-only]')
  const file = fs.realpathSync(path.resolve(ROOT, files[0]))
  if (!file.startsWith(`${fs.realpathSync(path.join(ROOT, 'private'))}${path.sep}`)) throw new Error('明文来源必须位于 Git 忽略的 private/ 内。')
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(raw) || !raw.length) throw new Error('来源必须是非空记录数组。')
  const sources = raw.map(normalizeSource)
  pendingSources(sources, [])
  if (validateOnly) { console.log(`✓ ${sources.length} 条记录校验通过；未连接远端。`); return }
  const password = await promptPassword()
  if (!password) throw new Error('口令不能为空。')
  const ownerId = readOwnerId()
  const count = await appendRecords(sources, password, {
    ownerId,
    read: () => readRows(ownerId),
    write(sql) {
      const directory = fs.mkdtempSync(path.join(ROOT, 'private/compass-import-'))
      fs.chmodSync(directory, 0o700)
      const sqlPath = path.join(directory, 'append.sql')
      try {
        fs.writeFileSync(sqlPath, sql, { mode: 0o600 })
        wrangler(['--file', sqlPath, '--yes'])
      } finally {
        if (fs.existsSync(sqlPath)) fs.unlinkSync(sqlPath)
        fs.rmdirSync(directory)
      }
    },
  })
  console.log(count ? `✓ 已追加 ${count} 条加密快照并回读验证。` : '✓ 相同快照已存在，未重复写入。')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
