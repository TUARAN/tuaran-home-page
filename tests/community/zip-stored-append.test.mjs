import assert from 'node:assert/strict'
import test from 'node:test'
import { inflateRawSync, deflateRawSync } from 'node:zlib'

import {
  communitySecretLocalJson,
  crc32,
  injectZipStoredFile,
} from '../../lib/content/zipStoredAppend.mjs'

function u16(view, offset, value) {
  view.setUint16(offset, value, true)
}

function u32(view, offset, value) {
  view.setUint32(offset, value, true)
}

function buildMinimalZip(entries) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const entry of entries) {
    const name = new TextEncoder().encode(entry.name)
    const data = entry.deflate ? deflateRawSync(entry.data) : entry.data
    const method = entry.deflate ? 8 : 0
    const crc = crc32(entry.data)
    const local = new Uint8Array(30 + name.length + data.length)
    const localView = new DataView(local.buffer)
    u32(localView, 0, 0x04034b50)
    u16(localView, 8, method)
    u32(localView, 14, crc)
    u32(localView, 18, data.length)
    u32(localView, 22, entry.data.length)
    u16(localView, 26, name.length)
    local.set(name, 30)
    local.set(data, 30 + name.length)
    locals.push(local)

    const central = new Uint8Array(46 + name.length)
    const centralView = new DataView(central.buffer)
    u32(centralView, 0, 0x02014b50)
    u16(centralView, 10, method)
    u32(centralView, 16, crc)
    u32(centralView, 20, data.length)
    u32(centralView, 24, entry.data.length)
    u16(centralView, 28, name.length)
    u32(centralView, 42, offset)
    central.set(name, 46)
    centrals.push(central)
    offset += local.length
  }
  const centralOffset = offset
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0)
  const eocd = new Uint8Array(22)
  const eocdView = new DataView(eocd.buffer)
  u32(eocdView, 0, 0x06054b50)
  u16(eocdView, 8, entries.length)
  u16(eocdView, 10, entries.length)
  u32(eocdView, 12, centralSize)
  u32(eocdView, 16, centralOffset)
  const out = new Uint8Array(centralOffset + centralSize + 22)
  let cursor = 0
  for (const part of locals) {
    out.set(part, cursor)
    cursor += part.length
  }
  for (const part of centrals) {
    out.set(part, cursor)
    cursor += part.length
  }
  out.set(eocd, cursor)
  return out
}

function listStoredNames(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let eocd = -1
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset
      break
    }
  }
  assert.notEqual(eocd, -1)
  const total = view.getUint16(eocd + 10, true)
  let cursor = view.getUint32(eocd + 16, true)
  const names = []
  for (let index = 0; index < total; index += 1) {
    assert.equal(view.getUint32(cursor, true), 0x02014b50)
    const nameLen = view.getUint16(cursor + 28, true)
    const extra = view.getUint16(cursor + 30, true)
    const comment = view.getUint16(cursor + 32, true)
    const localOffset = view.getUint32(cursor + 42, true)
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLen))
    names.push(name)
    const method = view.getUint16(cursor + 10, true)
    const comp = view.getUint32(cursor + 20, true)
    const localView = new DataView(bytes.buffer, bytes.byteOffset + localOffset)
    assert.equal(localView.getUint32(0, true), 0x04034b50)
    const localNameLen = localView.getUint16(26, true)
    const localExtra = localView.getUint16(28, true)
    const payload = bytes.subarray(localOffset + 30 + localNameLen + localExtra, localOffset + 30 + localNameLen + localExtra + comp)
    if (name === 'community-secret.local') {
      assert.equal(method, 0)
      const text = new TextDecoder().decode(payload)
      names.secretJson = text
    } else if (method === 8) {
      inflateRawSync(payload)
    }
    cursor += 46 + nameLen + extra + comment
  }
  return names
}

test('injectZipStoredFile appends community-secret.local without breaking other entries', () => {
  const manifest = new TextEncoder().encode('{"manifest_version":3}')
  const readme = new TextEncoder().encode('# hello')
  const zip = buildMinimalZip([
    { name: 'manifest.json', data: manifest },
    { name: 'README.md', data: readme, deflate: true },
  ])
  const secret = communitySecretLocalJson('invite-code-abc')
  const next = injectZipStoredFile(zip, 'community-secret.local', secret)
  const names = listStoredNames(next)
  assert.deepEqual([...names].sort(), ['README.md', 'community-secret.local', 'manifest.json'].sort())
  assert.equal(names.secretJson, secret)
  const replaced = injectZipStoredFile(next, 'community-secret.local', communitySecretLocalJson('second'))
  const again = listStoredNames(replaced)
  assert.equal(again.filter((name) => name === 'community-secret.local').length, 1)
  assert.match(again.secretJson, /"secret": "second"/)
})
