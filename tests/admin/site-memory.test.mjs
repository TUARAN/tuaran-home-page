import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { ADMIN_HOST_ALLOW_PREFIXES, ADMIN_NAV_CHILD_ITEMS } from '../../lib/admin/adminRoutes.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (rel) => readFile(path.join(root, rel), 'utf8')

test('site memory migration defines a plaintext version table with dedupe index', async () => {
  const sql = await read('migrations/0132_site_memory.sql')
  assert.match(sql, /CREATE TABLE IF NOT EXISTS site_memory_versions/)
  for (const column of ['source_id', 'slug', 'title', 'content', 'hash', 'bytes', 'created_at']) {
    assert.match(sql, new RegExp(`\\b${column}\\b`), `missing column ${column}`)
  }
  assert.match(sql, /UNIQUE INDEX[\s\S]*\(source_id, slug, created_at\)/)
})

test('site memory API is owner-guarded and reads D1 versions', async () => {
  const src = await read('app/api/admin/site-memory/route.js')
  assert.match(src, /export const runtime = 'edge'/)
  assert.match(src, /getOwnerOrReject\(req\)/)
  assert.match(src, /if \(!guard\.ok\) return guard\.response/)
  assert.match(src, /getD1\(\)/)
  assert.match(src, /site_memory_versions/)
  assert.match(src, /SELECT id, content FROM site_memory_versions WHERE id = \?/)
  assert.doesNotMatch(src, /SELECT \*[\s\S]*content[\s\S]*FROM site_memory_versions/)
})

test('vault loads from the owner-guarded API and has no browser decryption', async () => {
  const src = await read('app/(site)/context-memory/MemoryVault.jsx')
  assert.match(src, /fetch\('\/api\/admin\/site-memory'/)
  assert.match(src, /\/api\/admin\/site-memory\?id=/)
  for (const gone of ['PBKDF2', 'AES-GCM', 'decryptBlob', 'deriveKey', 'passphrase', 'type="password"']) {
    assert.ok(!src.includes(gone), `browser decryption left over: ${gone}`)
  }
})

test('admin page and nav describe login-visible snapshots, not a password gate', async () => {
  const page = await read('app/(admin)/admin/context-memory/page.jsx')
  assert.match(page, /const PAGE_TITLE = '站点记忆'/)
  assert.doesNotMatch(page, /输入密码|本机解密|解密查看/)
  assert.match(page, /登录可见/)
  assert.match(page, /owner 鉴权/)

  const item = ADMIN_NAV_CHILD_ITEMS.find((entry) => entry.href === '/admin/context-memory')
  assert.equal(item?.label, '站点记忆')
  assert.ok(!ADMIN_HOST_ALLOW_PREFIXES.includes('/data/memory'), 'static ciphertext path still allowed')
})

test('pre-push no longer writes site memory to remote D1', async () => {
  const hook = await read('scripts/hooks/pre-push')
  assert.ok(!hook.includes('snapshot-memory.mjs'), 'pre-push still runs snapshot-memory')
  assert.match(hook, /manual pnpm snapshot-memory/)

  const script = await read('scripts/snapshot-memory.mjs')
  assert.match(script, /写入远程 D1/)
  assert.match(script, /site_memory_versions/)
})
