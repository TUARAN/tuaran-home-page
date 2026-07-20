#!/usr/bin/env node
// 将 gitignored 的 private/information-records.json 端到端加密后写入远端 D1。
// 信息库口令通过 TTY 无回显输入；明文和口令都不会出现在 SQL 或 shell history 中。

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

import { encryptPayload } from '../lib/longCompass/crypto.js'

const USER_ID = 'github:25968749'
const ROOT = path.resolve(process.cwd())
const SOURCE_PATH = path.join(ROOT, 'private/information-records.json')
const SQL_PATH = path.join(ROOT, 'private/information-records.insert.sql')

function promptPassword(label) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    process.stdout.write(`${label}: `)
    const stdin = process.stdin
    if (stdin.isTTY) stdin.setRawMode(true)
    let buffer = ''
    const onData = (chunk) => {
      for (const char of chunk.toString()) {
        const code = char.charCodeAt(0)
        if (code === 13 || code === 10) {
          if (stdin.isTTY) stdin.setRawMode(false)
          stdin.removeListener('data', onData)
          rl.close()
          process.stdout.write('\n')
          resolve(buffer)
          return
        }
        if (code === 3) process.exit(130)
        if (code === 127 || code === 8) buffer = buffer.slice(0, -1)
        else buffer += char
      }
    }
    stdin.on('data', onData)
  })
}

function escapeSql(value) {
  return value.replaceAll("'", "''")
}

function runWrangler(args) {
  const env = { ...process.env }
  for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy']) {
    delete env[key]
  }
  return spawnSync('npx', ['wrangler', ...args], { stdio: 'inherit', env })
}

async function main() {
  if (!fs.existsSync(SOURCE_PATH)) throw new Error(`找不到 ${SOURCE_PATH}`)
  const records = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'))
  if (!Array.isArray(records) || records.length === 0) throw new Error('没有可导入的记录')

  const password = await promptPassword('信息库口令')
  if (!password) throw new Error('口令不能为空')
  const confirmation = await promptPassword('再输一次确认')
  if (password !== confirmation) throw new Error('两次口令不一致')

  const now = Date.now()
  const statements = []
  for (let index = 0; index < records.length; index += 1) {
    const source = records[index]
    const category = source.category === 'apple-id' ? 'apple-id' : 'account'
    const plain = {
      type: category,
      label: String(source.label || ''),
      account: String(source.account || ''),
      password: String(source.password || ''),
      securityAnswers: {
        friend: String(source.securityAnswers?.friend || ''),
        work: String(source.securityAnswers?.work || ''),
        parents: String(source.securityAnswers?.parents || ''),
      },
      birthday: String(source.birthday || ''),
      notes: String(source.notes || ''),
      schemaVersion: 1,
    }
    const payload = escapeSql(JSON.stringify(await encryptPayload(plain, password)))
    const id = String(source.id || crypto.randomUUID()).replaceAll("'", '')
    statements.push(
      `INSERT INTO private_information_records (id, user_id, category, encrypted_payload, created_at, updated_at) VALUES ('${id}', '${USER_ID}', '${category}', '${payload}', ${now + index}, ${now + index}) ON CONFLICT(id) DO UPDATE SET encrypted_payload = excluded.encrypted_payload, updated_at = excluded.updated_at, deleted_at = NULL;`
    )
  }

  fs.writeFileSync(SQL_PATH, `${statements.join('\n')}\n`, { mode: 0o600 })
  try {
    const result = runWrangler(['d1', 'execute', 'tuaran-me', '--remote', `--file=${SQL_PATH}`, '--yes'])
    if (result.status !== 0) throw new Error(`wrangler 执行失败（exit ${result.status}）`)
    console.log(`✓ 已写入 ${records.length} 条端到端加密记录。`)
  } finally {
    if (fs.existsSync(SQL_PATH)) fs.unlinkSync(SQL_PATH)
  }
}

main().catch((error) => {
  console.error(`✘ ${error?.message || error}`)
  process.exit(1)
})
