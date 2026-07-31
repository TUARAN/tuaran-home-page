import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const apiSource = await readFile(new URL('../../app/api/admin/quotes/route.js', import.meta.url), 'utf8')
const consoleSource = await readFile(
  new URL('../../app/(admin)/admin/quotes/QuotesConsole.jsx', import.meta.url),
  'utf8',
)
const centerSource = await readFile(
  new URL('../../app/(admin)/admin/content/ContentCenter.jsx', import.meta.url),
  'utf8',
)
const migrationSource = await readFile(new URL('../../migrations/0057_famous_quotes.sql', import.meta.url), 'utf8')

test('quote management is owner-only and supports CRUD plus activation', () => {
  assert.match(apiSource, /getOwnerOrReject/)
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
    assert.match(apiSource, new RegExp(`export async function ${method}`))
  }
  assert.match(apiSource, /enabled = \?/)
  assert.match(consoleSource, /名言管理/)
  assert.match(consoleSource, /核验来源/)
  assert.match(centerSource, /href: '\/admin\/quotes'/)
})

test('quote table stores provenance and publishing state', () => {
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS famous_quotes/)
  assert.match(migrationSource, /source_url TEXT/)
  assert.match(migrationSource, /enabled INTEGER NOT NULL DEFAULT 1/)
})
