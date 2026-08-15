#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import process from 'node:process'

import {
  CREDENTIAL_HASH_ITERATIONS,
  createCredentialSalt,
  createCredentialToken,
  hashCredentialSecret,
  parseCredentialToken,
} from '../lib/credentialAuth.js'

const DATABASE_NAME = 'tuaran-me'

function usage(exitCode = 0) {
  console.log(`用法：
  npm run credential:add -- --remote --label "名称" [--name "显示名"] [--login "登录名"] [--user-id acct_xxx] [--expires-days 30]
  npm run credential:add -- --remote --owner
  npm run credential:disable -- --remote cred_xxxxxxxxxxxx

必须明确传入 --remote 或 --local。--owner 会优先复用已有 GitHub tuaran 身份，
找不到时创建新的站长账号；生成的明文凭证只显示一次。`)
  process.exit(exitCode)
}

function parseArgs(argv) {
  const options = { owner: false, target: '', disableMode: false, disableId: '', label: '', name: '', login: '', userId: '', expiresDays: 0 }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') usage(0)
    if (arg === '--owner') { options.owner = true; continue }
    if (arg === '--disable') { options.disableMode = true; continue }
    if (arg === '--remote' || arg === '--local') { options.target = arg; continue }
    if (options.disableMode && /^cred_[A-Za-z0-9_-]{12}$/.test(arg)) { options.disableId = arg; continue }
    const key = { '--label': 'label', '--name': 'name', '--login': 'login', '--user-id': 'userId', '--expires-days': 'expiresDays' }[arg]
    if (!key || argv[index + 1] == null) usage(1)
    options[key] = argv[index + 1]
    index += 1
  }
  if (!options.target) throw new Error('必须明确传入 --remote 或 --local。')
  if (options.disableMode) {
    if (!options.disableId) throw new Error('要停用的凭证 ID 格式不正确。')
    return options
  }
  if (options.userId && !/^acct_[a-f0-9]{32}$/i.test(options.userId)) throw new Error('--user-id 必须是 acct_ 开头的平台 ID。')
  options.expiresDays = Number(options.expiresDays || 0)
  if (!Number.isInteger(options.expiresDays) || options.expiresDays < 0 || options.expiresDays > 3650) {
    throw new Error('--expires-days 必须是 0 到 3650 的整数。')
  }
  if (options.owner) {
    options.label ||= '站长凭证'
    options.login ||= 'tuaran'
    options.name ||= 'TUARAN'
  } else {
    options.label ||= '邀请凭证'
    options.login ||= options.label
    options.name ||= options.label
  }
  return options
}

function sqlString(value) {
  return `'${String(value || '').replaceAll("'", "''")}'`
}

function runWrangler(sql, target) {
  const result = spawnSync('npx', ['wrangler', 'd1', 'execute', DATABASE_NAME, target, '--command', sql], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || 'wrangler 执行失败。\n')
    process.exit(result.status || 1)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.disableId) {
    runWrangler(
      `UPDATE login_credentials SET disabled_at = ${Date.now()} WHERE id = ${sqlString(options.disableId)} AND disabled_at IS NULL;`,
      options.target
    )
    console.log(`凭证 ${options.disableId} 已停用（目标：${options.target.slice(2)}）。`)
    return
  }
  const token = createCredentialToken()
  const parsed = parseCredentialToken(token)
  const salt = createCredentialSalt()
  const secretHash = await hashCredentialSecret(parsed.secret, salt)
  const fallbackUserId = `acct_${crypto.randomUUID().replaceAll('-', '')}`
  const createdAt = Date.now()
  const expiresAt = options.expiresDays ? createdAt + options.expiresDays * 86400000 : null

  let userIdExpression = sqlString(options.userId || fallbackUserId)
  if (options.owner && !options.userId) {
    userIdExpression = `COALESCE(
      (SELECT user_id FROM account_identities WHERE provider = 'github' AND lower(provider_login) = 'tuaran' LIMIT 1),
      (SELECT platform_id FROM site_users WHERE lower(login) = 'tuaran' OR lower(email) = 'tuaran666@gmail.com' LIMIT 1),
      ${sqlString(fallbackUserId)}
    )`
  }

  const sql = `INSERT INTO login_credentials
    (id, user_id, label, account_login, account_name, secret_salt, secret_hash, hash_iterations, created_at, expires_at)
   VALUES (
    ${sqlString(parsed.id)}, ${userIdExpression}, ${sqlString(options.label)}, ${sqlString(options.login)},
    ${sqlString(options.name)}, ${sqlString(salt)}, ${sqlString(secretHash)}, ${CREDENTIAL_HASH_ITERATIONS},
    ${createdAt}, ${expiresAt == null ? 'NULL' : expiresAt}
   );`

  runWrangler(sql, options.target)
  console.log('\n凭证已创建。请立即保存，数据库无法恢复明文：')
  console.log(token)
  console.log(`\n标签：${options.label}`)
  console.log(`目标：${options.target.slice(2)}`)
  if (expiresAt) console.log(`到期：${new Date(expiresAt).toISOString()}`)
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
