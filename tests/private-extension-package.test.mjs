import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash, webcrypto } from 'node:crypto'
import vm from 'node:vm'

async function fixture() {
  const bytes = new TextEncoder().encode('a private release fixture')
  const metadata = { objectKey: 'downloads/test.zip', size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
  const source = (await readFile(new URL('../lib/content/privateExtensionPackage.mjs', import.meta.url), 'utf8'))
    .replace(/^import .*\n/, '').replace('export async function', 'async function')
  const context = vm.createContext({ X_REPLY_EXTENSION_PACKAGE: metadata, crypto: webcrypto, Uint8Array })
  vm.runInContext(source, context)
  return { bytes, read: context.readPrivateExtensionPackage }
}
test('private package reader verifies the exact bytes and never fetches other object keys', async () => {
  const { bytes, read } = await fixture()
  let calls = 0
  const bucket = { async get(key) { calls++; assert.equal(key, 'downloads/test.zip'); return { async arrayBuffer() { return bytes.buffer } } } }
  assert.equal(await read(bucket, 'downloads/other.zip'), null)
  assert.equal(calls, 0)
  assert.deepEqual((await read(bucket, 'downloads/test.zip')).bytes, bytes)
  assert.equal(await read({ async get() { return null } }, 'downloads/test.zip'), null)
})
test('private package reader rejects a corrupted release', async () => {
  const { bytes, read } = await fixture()
  bytes[0] ^= 1
  await assert.rejects(read({ async get() { return { async arrayBuffer() { return bytes.buffer } } } }, 'downloads/test.zip'), /integrity check failed/)
})
