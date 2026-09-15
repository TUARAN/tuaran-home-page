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
import { buildContentMerkleBatch, verifyContentMerkleBatch, verifyMerkleMembership } from '../lib/contentMerkle.js'
import { describeProofStatus, isOlderVersion, shortDigest } from '../lib/contentProofPresentation.js'
import { contentProofHref } from '../lib/contentProofRegistry.js'

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

test('Merkle batches are deterministic and every proof verifies against one root', async () => {
  const proofs = Array.from({ length: 12 }, (_, index) => ({
    contentKey: `research:topics:batch-${String(index + 1).padStart(2, '0')}`,
    version: 1,
    proofId: index.toString(16).padStart(64, '0'),
  }))
  const options = { generatedAt: '2026-09-15T00:00:00.000Z' }
  const batch = await buildContentMerkleBatch(proofs, options)
  const shuffled = await buildContentMerkleBatch([...proofs].reverse(), options)

  assert.equal(batch.count, 12)
  assert.equal(batch.merkleRoot, shuffled.merkleRoot)
  assert.equal(batch.manifestHash, shuffled.manifestHash)
  assert.equal(await verifyContentMerkleBatch(batch), true)
  assert.equal((await Promise.all(batch.members.map((member) => verifyMerkleMembership(member, batch.merkleRoot)))).every(Boolean), true)
})

test('Merkle verification detects a changed proof and supports odd batch sizes', async () => {
  const proofs = Array.from({ length: 11 }, (_, index) => ({
    contentKey: `article:odd-${index}`,
    version: 1,
    proofId: (index + 100).toString(16).padStart(64, '0'),
  }))
  const batch = await buildContentMerkleBatch(proofs, { generatedAt: '2026-09-15T00:00:00.000Z' })
  assert.equal(await verifyContentMerkleBatch(batch), true)

  const changed = structuredClone(batch)
  changed.members[3].proofId = 'f'.repeat(64)
  assert.equal(await verifyMerkleMembership(changed.members[3], batch.merkleRoot), false)
  assert.equal(await verifyContentMerkleBatch(changed), false)
})

test('Merkle batches reject duplicate content versions', async () => {
  const proof = { contentKey: 'article:duplicate', version: 1, proofId: 'a'.repeat(64) }
  await assert.rejects(
    buildContentMerkleBatch([proof, { ...proof, proofId: 'b'.repeat(64) }], { generatedAt: '2026-09-15T00:00:00.000Z' }),
    /duplicate contentKey \+ version/,
  )
})

test('reader status distinguishes signed, wrong-root, wrong-chain, and confirmed records', () => {
  const proof = { proofId: 'a'.repeat(64) }
  const verification = { valid: true }
  assert.equal(describeProofStatus({ proof, verification }).level, 'signed')
  assert.equal(describeProofStatus({ proof, verification, batch: { membershipValid: false } }).label, 'Merkle Root 不一致')
  assert.equal(describeProofStatus({ proof, verification, batch: { membershipValid: true, anchor: { chainId: 1 } } }).label, '链网络不匹配')
  assert.equal(describeProofStatus({ proof, verification, batch: { membershipValid: true, anchor: { chainId: 84532 } } }).level, 'batched')
  assert.equal(describeProofStatus({ proof, verification, batch: { membershipValid: true, anchor: { chainId: 84532, transactionHash: '0x1', attestationUid: '0x2' } } }).level, 'confirmed')
})

test('reader helpers label old versions and abbreviate public digests', () => {
  assert.equal(isOlderVersion(1, 2), true)
  assert.equal(isOlderVersion(2, 2), false)
  assert.equal(shortDigest('1234567890abcdef', 4, 4), '1234…cdef')
  assert.equal(shortDigest('', 4, 4), '—')
  assert.equal(contentProofHref('research:topics:demo'), '/proofs/research:topics:demo')
})

test('checked-in Base Sepolia bootstrap anchor contains a valid demo membership', async () => {
  const batch = JSON.parse(await readFile(new URL('../public/proofs/batches/bootstrap-001-anchored.json', import.meta.url), 'utf8'))
  assert.equal(batch.anchor.chainId, 84532)
  assert.match(batch.anchor.transactionHash, /^0x[a-f0-9]{64}$/)
  assert.match(batch.anchor.attestationUid, /^0x[a-f0-9]{64}$/)
  assert.equal(batch.members[0].proofId, '168fd4950fb76d024f5be2adb52bb6b35b068da0fc4c95505393ed6f1c4ef1f4')
  assert.equal(await verifyContentMerkleBatch(batch), true)
})

test('all public article renderers expose the credential entry point', async () => {
  const renderers = await Promise.all([
    readFile(new URL('../app/(site)/articles/[slug]/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/articles/[slug]/PublishedArticle.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/articles/research/[category]/[slug]/page.jsx', import.meta.url), 'utf8'),
  ])
  for (const source of renderers) {
    assert.match(source, /<ContentProofCard/)
    assert.match(source, /contentKey=/)
  }
})
