import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import test from 'node:test'

import { GET as agentGuide } from '../app/(site)/verify.txt/route.js'
import { GET as discovery } from '../app/(site)/.well-known/content-proof.json/route.js'
import { GET as schemaRoute } from '../app/(site)/schemas/[...slug]/route.js'
import {
  getContentProofDiscoveryDocument,
  renderContentProofAgentGuide,
  renderContentProofLlmsSection,
} from '../lib/contentProofDiscovery.js'
import { getContentProofSchema, listContentProofSchemaPaths } from '../lib/contentProofSchemas.js'
import { getContentProofCredential } from '../lib/contentProofRegistry.js'
import { verifyContentProofBundle } from '../lib/contentProofVerify.js'

const execFileAsync = promisify(execFile)
const root = fileURLToPath(new URL('..', import.meta.url))

async function readJson(relative) {
  return JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'))
}

test('offline bundle verifier passes the checked-in demo from local files only', async () => {
  const credential = getContentProofCredential('research:topics:content-proof-demo')
  const proof = await readJson('../public/proofs/content-proof-demo-v1.json')
  const publicKey = await readJson('../public/.well-known/content-proof-key.json')
  const replica = await readJson('../public/proofs/replicas/content-proof-demo-v1.json')
  const batch = await readJson('../public/proofs/batches/bootstrap-001-anchored.json')

  const report = await verifyContentProofBundle({
    entry: credential.entry,
    proof,
    publicKey,
    replica,
    batch,
    expectedChainId: 84532,
  })

  assert.equal(report.valid, true)
  assert.equal(report.offline, true)
  assert.deepEqual(report.verified, ['content_integrity', 'proof_identity', 'publisher_signature', 'merkle_membership'])
  assert.equal(report.checks.replica.status, 'passed')
  assert.equal(report.checks.localAnchor.status, 'passed')
  assert.ok(report.notVerified.some((item) => item.id === 'factual_accuracy'))
  assert.ok(report.notVerified.some((item) => item.id === 'live_chain_rpc'))
})

test('offline verifier fails a one-character body edit without contacting the site', async () => {
  const credential = getContentProofCredential('research:topics:content-proof-demo')
  const proof = await readJson('../public/proofs/content-proof-demo-v1.json')
  const publicKey = await readJson('../public/.well-known/content-proof-key.json')
  const report = await verifyContentProofBundle({
    entry: { ...credential.entry, body: `${credential.entry.body}改` },
    proof,
    publicKey,
  })
  assert.equal(report.valid, false)
  assert.equal(report.checks.contentHash.status, 'failed')
  assert.ok(report.errors.includes('content_hash_mismatch'))
})

test('CLI verifies the demo replica locally and does not fetch 2aran.com', async () => {
  const cli = await readFile(new URL('../tools/content-proof-verifier/cli.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(cli, /\bfetch\s*\(/)
  assert.match(cli, /never fetches 2aran\.com/)

  const { stdout } = await execFileAsync(process.execPath, [
    'tools/content-proof-verifier/cli.mjs',
    '--replica', 'public/proofs/replicas/content-proof-demo-v1.json',
    '--public-key', 'public/.well-known/content-proof-key.json',
    '--batch', 'public/proofs/batches/bootstrap-001-anchored.json',
    '--expected-chain-id', '84532',
  ], { cwd: root })
  const report = JSON.parse(stdout)
  assert.equal(report.valid, true)
  assert.equal(report.contentKey, 'research:topics:content-proof-demo')
})

test('well-known discovery, schemas and verify.txt describe offline verification', async () => {
  const document = getContentProofDiscoveryDocument()
  assert.equal(document.protocol, '2aran-content-proof')
  assert.equal(document.verifier.offline, true)
  assert.deepEqual(document.verifier.doesNotFetch, ['https://2aran.com'])
  assert.match(document.discovery.agentGuide, /\/verify\.txt$/)
  assert.equal(document.proofs[0].proofJsonUrl, 'https://2aran.com/proofs/content-proof-demo-v1.json')

  const discoveryResponse = await discovery()
  assert.equal((await discoveryResponse.json()).schema, document.schema)

  const guide = renderContentProofAgentGuide(document)
  assert.match(guide, /What a passing result means/)
  assert.match(guide, /tools\/content-proof-verifier/)
  const guideResponse = await agentGuide()
  assert.equal(await guideResponse.text(), guide)

  const schemaRouteSource = await readFile(new URL('../app/(site)/schemas/[...slug]/route.js', import.meta.url), 'utf8')
  assert.match(schemaRouteSource, /export const runtime = 'edge'/)
  assert.match(schemaRouteSource, /export const dynamic = 'force-dynamic'/)

  for (const path of listContentProofSchemaPaths()) {
    assert.ok(getContentProofSchema(path).$id)
    const response = await schemaRoute(new Request('https://2aran.com'), { params: Promise.resolve({ slug: path.split('/') }) })
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /schema\+json/)
  }

  assert.match(renderContentProofLlmsSection(), /Agent 验证说明/)
  assert.match(renderContentProofLlmsSection(), /离线验证器/)
})
