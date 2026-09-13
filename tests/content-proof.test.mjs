import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  buildAssetManifest,
  buildContentProof,
  canonicalizeContent,
  canonicalizeJson,
  generateSiteKeyPair,
  getSiteKeyId,
  hashContent,
  sha256,
  verifyContentProof,
} from '../lib/contentProof.js'

const ENTRY = {
  author: 'TUARAN',
  body: '第一行\r\n第二行  \r\n',
  contentKey: 'research:topics:content-proof-demo',
  date: '2026-09-14',
  language: 'zh-CN',
  summary: '同一份内容在 Node 与浏览器中得到相同指纹。',
  tags: ['内容存证', 'SHA-256'],
  title: '可验证内容示例',
  version: 1,
}

test('canonical content has a fixed cross-runtime UTF-8 test vector', async () => {
  const canonical = canonicalizeContent(ENTRY)
  assert.equal(canonical, '{"assets":[],"author":"TUARAN","body":"第一行\\n第二行\\n","contentKey":"research:topics:content-proof-demo","date":"2026-09-14","language":"zh-CN","summary":"同一份内容在 Node 与浏览器中得到相同指纹。","tags":["SHA-256","内容存证"],"title":"可验证内容示例","updated":null,"version":1}')
  assert.equal(await hashContent(ENTRY), 'dec45fa63b5bd7c235603a9b83506adf63cbebb443ed8d54f4a9ae030babac21')
  assert.equal(await sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})

test('normalization removes platform and Unicode representation differences', async () => {
  const equivalent = {
    ...ENTRY,
    title: '可验证内容示例  ',
    body: '\n第一行\n第二行\t\n\n',
    tags: ['SHA-256', '内容存证', 'SHA-256'],
  }
  assert.equal(await hashContent(equivalent), await hashContent(ENTRY))
  assert.equal(canonicalizeJson({ z: 1, a: { d: 2, c: 3 } }), '{"a":{"c":3,"d":2},"z":1}')
})

test('asset manifest hashes bytes and sorts by stable URL order', async () => {
  const manifest = await buildAssetManifest([
    { url: '/z.txt', mediaType: 'text/plain', data: 'z' },
    { url: '/a.txt', mediaType: 'text/plain', data: 'abc' },
  ])
  assert.deepEqual(manifest.map(({ url, bytes }) => ({ url, bytes })), [
    { url: '/a.txt', bytes: 3 },
    { url: '/z.txt', bytes: 1 },
  ])
  assert.equal(manifest[0].sha256, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})

test('proof verifies offline and a one-character edit fails immediately', async () => {
  const { privateKeyJwk, publicKeyJwk } = await generateSiteKeyPair()
  const proof = await buildContentProof(ENTRY, {
    privateKeyJwk,
    publishedAt: '2026-09-14T00:00:00.000Z',
  })

  assert.equal(proof.siteSignature.keyId, await getSiteKeyId(publicKeyJwk))
  assert.deepEqual(await verifyContentProof(ENTRY, proof, publicKeyJwk), {
    valid: true,
    contentHashMatches: true,
    proofIdMatches: true,
    signatureValid: true,
    errors: [],
  })

  const changed = await verifyContentProof({ ...ENTRY, body: `${ENTRY.body}改` }, proof, publicKeyJwk)
  assert.equal(changed.valid, false)
  assert.equal(changed.contentHashMatches, false)
  assert.equal(changed.signatureValid, true)
  assert.deepEqual(changed.errors, ['content_hash_mismatch'])
})

test('published prototype proof and public key verify as checked-in JSON', async () => {
  const proof = JSON.parse(await readFile(new URL('../public/proofs/content-proof-demo-v1.json', import.meta.url), 'utf8'))
  const publicKey = JSON.parse(await readFile(new URL('../public/.well-known/content-proof-key.json', import.meta.url), 'utf8'))
  const result = await verifyContentProof(ENTRY, proof, publicKey)
  assert.equal(result.valid, true)
})

test('proof cannot be reused for another content identity or contract', async () => {
  const { privateKeyJwk, publicKeyJwk } = await generateSiteKeyPair()
  const proof = await buildContentProof(ENTRY, { privateKeyJwk, publishedAt: '2026-09-14T00:00:00.000Z' })
  const wrongIdentity = await verifyContentProof({ ...ENTRY, contentKey: 'research:topics:other' }, proof, publicKeyJwk)
  assert.equal(wrongIdentity.valid, false)
  assert.ok(wrongIdentity.errors.includes('content_key_mismatch'))
  assert.ok(wrongIdentity.errors.includes('content_hash_mismatch'))

  const unsupported = { ...proof, canonicalization: 'unknown/v2' }
  const wrongContract = await verifyContentProof(ENTRY, unsupported, publicKeyJwk)
  assert.equal(wrongContract.valid, false)
  assert.ok(wrongContract.errors.includes('unsupported_canonicalization'))
  assert.ok(wrongContract.errors.includes('proof_id_mismatch'))
  assert.ok(wrongContract.errors.includes('signature_invalid'))
})

test('the shared implementation remains browser-safe', async () => {
  const source = await readFile(new URL('../lib/contentProof.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /from ['"]node:/)
  assert.doesNotMatch(source, /\bBuffer\b/)
  assert.match(source, /globalThis\.crypto\.subtle/)
})
