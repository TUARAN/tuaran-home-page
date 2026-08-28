import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'

import { encryptPayload, isValidEnvelope } from '../lib/longCompass/crypto.js'

const originalSchema = await readFile(new URL('../migrations/0053_private_information_records.sql', import.meta.url), 'utf8')
const archiveMigration = await readFile(new URL('../migrations/0084_private_information_archive.sql', import.meta.url), 'utf8')
const routeSource = (await readFile(new URL('../app/api/admin/information/route.js', import.meta.url), 'utf8'))
  .replace(/^import .*\n/gm, '')
  .replace(/^export /gm, '')
const payload = await encryptPayload({ account: 'fixture@example.test', password: 'test-only' }, 'fixture-vault')

function fixture(t) {
  const sqlite = new DatabaseSync(':memory:')
  t.after(() => sqlite.close())
  sqlite.exec(originalSchema)
  sqlite.prepare(`INSERT INTO private_information_records
    (id, user_id, category, encrypted_payload, created_at, updated_at)
    VALUES (?, ?, 'apple-id', ?, 1, 1)`)
    .run('legacy', 'owner', JSON.stringify(payload))
  sqlite.exec(archiveMigration)

  const db = { prepare(sql) {
    const statement = sqlite.prepare(sql)
    function bound(args = []) {
      return {
        bind: (...values) => bound(values),
        async run() { return { meta: { changes: Number(statement.run(...args).changes) } } },
        async first() { return statement.get(...args) || null },
        async all() { return { results: statement.all(...args) } },
      }
    }
    return bound()
  } }

  function client(userId = 'owner', authorized = true) {
    const handlers = new Function('getOwnerOrReject', 'getD1', 'isValidEnvelope',
      `${routeSource}\nreturn { GET, POST, PATCH, DELETE }`)(
      async () => authorized
        ? { ok: true, user: { id: userId } }
        : { ok: false, response: Response.json({ error: 'FORBIDDEN' }, { status: 403 }) },
      () => {
        assert.ok(authorized, 'unauthorized requests must not access the database')
        return db
      },
      isValidEnvelope,
    )
    return async (method, body, id) => {
      const response = await handlers[method](new Request(
        `https://example.test/api/admin/information${id ? `?id=${encodeURIComponent(id)}` : ''}`,
        { method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) },
      ))
      return { status: response.status, body: await response.json() }
    }
  }
  return { sqlite, request: client(), client }
}

test('migration preserves legacy encrypted records and defaults them to unarchived', async (t) => {
  const { request, sqlite } = fixture(t)
  const { body } = await request('GET')
  assert.equal(body.items.length, 1)
  assert.equal(body.items[0].archivedAt, null)
  assert.deepEqual(body.items[0].payload, payload)
  assert.equal(sqlite.prepare('SELECT encrypted_payload FROM private_information_records').get().encrypted_payload, JSON.stringify(payload))
})

test('records must be archived before deletion, and restoration removes delete eligibility', async (t) => {
  const { request, sqlite } = fixture(t)
  const created = await request('POST', { category: 'apple-id', payload })
  assert.equal(created.status, 200)
  const id = created.body.item.id
  assert.equal(created.body.item.archivedAt, null)

  const denied = await request('DELETE', undefined, id)
  assert.equal(denied.status, 409)
  assert.equal(denied.body.error, 'ARCHIVE_REQUIRED')

  const archived = await request('PATCH', { id, action: 'archive' })
  assert.equal(archived.status, 200)
  assert.ok(archived.body.archivedAt > 0)
  const item = (await request('GET')).body.items.find((record) => record.id === id)
  assert.equal(item.archivedAt, archived.body.archivedAt)
  assert.deepEqual(item.payload, payload)

  const restored = await request('PATCH', { id, action: 'restore' })
  assert.equal(restored.body.archivedAt, null)
  assert.equal((await request('DELETE', undefined, id)).status, 409)

  await request('PATCH', { id, action: 'archive' })
  assert.equal((await request('DELETE', undefined, id)).status, 200)
  assert.equal((await request('GET')).body.items.some((record) => record.id === id), false)
  const deleted = sqlite.prepare('SELECT * FROM private_information_records WHERE id = ?').get(id)
  assert.ok(deleted.deleted_at > 0, 'preserve the existing soft-delete behavior')
  assert.equal(deleted.encrypted_payload, JSON.stringify(payload))
  for (const action of ['archive', 'restore']) {
    assert.equal((await request('PATCH', { id, action })).status, 404)
  }
  assert.equal((await request('DELETE', undefined, id)).status, 404)
  assert.equal((await request('PATCH', { id, payload })).status, 404)
})

test('archived records are read-only until restored, and edits preserve encryption', async (t) => {
  const { request } = fixture(t)
  const changed = await encryptPayload({ account: 'updated@example.test' }, 'fixture-vault')
  await request('PATCH', { id: 'legacy', action: 'archive' })
  const denied = await request('PATCH', { id: 'legacy', payload: changed })
  assert.equal(denied.status, 409)
  assert.equal(denied.body.error, 'RECORD_ARCHIVED')
  assert.deepEqual((await request('GET')).body.items[0].payload, payload)

  await request('PATCH', { id: 'legacy', action: 'restore' })
  assert.equal((await request('PATCH', { id: 'legacy', payload: changed })).status, 200)
  const item = (await request('GET')).body.items[0]
  assert.deepEqual(item.payload, changed)
  assert.equal(item.archivedAt, null)
})

test('ownership is enforced for listing, archiving, restoration, editing and deletion', async (t) => {
  const { request, client } = fixture(t)
  const other = client('other-owner')
  assert.deepEqual((await other('GET')).body.items, [])
  for (const action of ['archive', 'restore']) {
    assert.equal((await other('PATCH', { id: 'legacy', action })).status, 404)
  }
  assert.equal((await other('DELETE', undefined, 'legacy')).status, 404)
  assert.equal((await other('PATCH', { id: 'legacy', payload })).status, 404)
  await request('PATCH', { id: 'legacy', action: 'archive' })
  assert.equal((await other('DELETE', undefined, 'legacy')).status, 404)
  assert.equal((await other('PATCH', { id: 'legacy', action: 'restore' })).status, 404)
  assert.ok((await request('GET')).body.items[0].archivedAt)
})

test('all information endpoints reject unauthorized requests before accessing storage', async (t) => {
  const { client } = fixture(t)
  const unauthorized = client('owner', false)
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
    assert.equal((await unauthorized(method)).status, 403)
  }
})

test('invalid actions, mixed payloads and missing IDs cannot mutate records', async (t) => {
  const { request } = fixture(t)
  for (const action of ['', null, 'delete', false, {}]) {
    const result = await request('PATCH', { id: 'legacy', action })
    assert.equal(result.status, 400)
    assert.equal(result.body.error, 'INVALID_ACTION')
  }
  assert.equal((await request('PATCH', { id: 'legacy', action: 'archive', payload })).status, 400)
  assert.equal((await request('PATCH', { action: 'archive' })).status, 400)
  assert.equal((await request('PATCH', { id: 'legacy', payload: {} })).status, 400)
  assert.equal((await request('DELETE')).status, 400)
  assert.equal((await request('PATCH', { id: 'missing', action: 'archive' })).status, 404)
  assert.equal((await request('DELETE', undefined, 'missing')).status, 404)
  const item = (await request('GET')).body.items[0]
  assert.equal(item.archivedAt, null)
  assert.deepEqual(item.payload, payload)
})
