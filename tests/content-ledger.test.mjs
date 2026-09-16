import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { GET as proofsRss } from '../app/(site)/proofs.xml/route.js'
import {
  CONTENT_LEDGER_NETWORKS,
  getContentLedgerNetwork,
} from '../lib/contentLedgerNetworks.js'
import {
  contentLedgerIdempotencyKey,
  findLedgerRecord,
  isRetryablePublishError,
  publishBackoffMs,
  recordContentLedgerCost,
  resolveIdempotentPublish,
  summarizeAnchorWindow,
  upsertPublishLedger,
  withPublishRetry,
} from '../lib/contentLedgerPublish.js'
import {
  assertPublisherAddress,
  assertRecordHasNoSecrets,
  buildKeyDrillReceipt,
  resolvePublisherWallet,
} from '../lib/contentLedgerWallet.js'
import {
  listContentProofDiscoveryEntries,
  listContentProofRssEntries,
  renderContentProofLlmsSection,
} from '../lib/contentProofDiscovery.js'
import { getContentProofCredential } from '../lib/contentProofRegistry.js'
import { sha256, verifyContentProof } from '../lib/contentProof.js'
import {
  DEFAULT_IPFS_GATEWAYS,
  assertIndependentGateways,
  buildContentReplica,
  pinContentReplica,
  readReplicaFromGateways,
} from '../lib/contentReplica.js'

const CID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
const SCHEMA_UID = `0x${'ab'.repeat(32)}`
const TESTNET_KEY = `0x${'11'.repeat(32)}`
const MAINNET_KEY = `0x${'22'.repeat(32)}`

test('replica payload is canonical, self-contained, and hashes the exact written bytes', async () => {
  const credential = getContentProofCredential('research:topics:content-proof-demo')
  const proof = JSON.parse(await readFile(new URL('../public/proofs/content-proof-demo-v1.json', import.meta.url), 'utf8'))
  const publicKey = JSON.parse(await readFile(new URL('../public/.well-known/content-proof-key.json', import.meta.url), 'utf8'))
  const built = await buildContentReplica({ proof, entry: credential.entry })
  const checkedIn = await readFile(new URL('../public/proofs/replicas/content-proof-demo-v1.json', import.meta.url), 'utf8')

  assert.equal(built.payload, checkedIn)
  assert.equal(built.replica.schema, 'https://2aran.com/schemas/content-replica/v1')
  assert.equal(built.replica.contentHash, proof.contentHash.value)
  assert.equal((await verifyContentProof(credential.entry, built.replica.proof, publicKey)).valid, true)
})

test('pinning is idempotent and dual gateways must agree on SHA-256', async () => {
  const payload = '{"ok":true}\n'
  const built = { payload, replicaHash: await sha256(payload), replica: { contentKey: 'demo', version: 1 } }
  const first = await pinContentReplica(built, { pin: async ({ bytes }) => ({ cid: CID, provider: 'pinata', bytes: bytes.length }) })
  const second = await pinContentReplica(built, {
    existing: first,
    pin: async () => { throw new Error('pin must not run again') },
  })
  assert.equal(first.idempotent, false)
  assert.equal(second.idempotent, true)
  assert.equal(second.cid, CID)

  const encoder = new TextEncoder()
  const bytes = encoder.encode(payload)
  const readback = await readReplicaFromGateways(CID, {
    expectedHash: built.replicaHash,
    gateways: DEFAULT_IPFS_GATEWAYS,
    pinProviderHost: 'gateway.pinata.cloud',
    fetch: async (url) => {
      assert.match(url, /ipfs\.io|dweb\.link/)
      return { ok: true, arrayBuffer: async () => bytes.buffer }
    },
  })
  assert.equal(readback.gateways.length, 2)
  assert.equal(readback.replicaHash, built.replicaHash)

  await assert.rejects(
    readReplicaFromGateways(CID, {
      expectedHash: built.replicaHash,
      fetch: async (url) => ({
        ok: true,
        arrayBuffer: async () => encoder.encode(url.includes('ipfs.io') ? payload : '{"nope":true}\n').buffer,
      }),
    }),
    /do not match/,
  )
  assert.throws(() => assertIndependentGateways(['https://ipfs.io/ipfs/', 'https://ipfs.io/gateway/']), /independent origins/)
  assert.throws(
    () => assertIndependentGateways(DEFAULT_IPFS_GATEWAYS, { pinProviderHost: 'ipfs.io' }),
    /pinning provider/,
  )
})

test('publisher wallets stay isolated from testnet keys, funds, and public records', () => {
  const testnet = getContentLedgerNetwork('base-sepolia')
  const mainnet = getContentLedgerNetwork('base')
  assert.equal(CONTENT_LEDGER_NETWORKS.base.chainId, 8453)
  assert.equal(mainnet.privateKeyEnv, 'CONTENT_LEDGER_MAINNET_PRIVATE_KEY')

  assert.throws(
    () => resolvePublisherWallet({ network: mainnet, env: { CONTENT_LEDGER_MAINNET_PRIVATE_KEY: MAINNET_KEY } }),
    /--confirm-mainnet/,
  )
  assert.throws(
    () => resolvePublisherWallet({
      network: mainnet,
      confirmMainnet: true,
      env: {
        CONTENT_LEDGER_MAINNET_PRIVATE_KEY: TESTNET_KEY,
        CONTENT_LEDGER_TESTNET_PRIVATE_KEY: TESTNET_KEY,
      },
    }),
    /must be isolated/,
  )
  const resolved = resolvePublisherWallet({
    network: testnet,
    env: { CONTENT_LEDGER_TESTNET_PRIVATE_KEY: TESTNET_KEY, CONTENT_LEDGER_PUBLISHER_ADDRESS: '0x1111111111111111111111111111111111111111' },
  })
  assert.equal(resolved.role, 'content_attestation')
  assert.equal(resolved.requireAllowlist, false)
  assert.throws(
    () => assertPublisherAddress({
      address: '0x1111111111111111111111111111111111111111',
      forbiddenAddresses: ['0x1111111111111111111111111111111111111111'],
    }),
    /not isolated/,
  )
  assert.throws(
    () => assertPublisherAddress({
      address: '0x1111111111111111111111111111111111111111',
      allowlist: ['0x2222222222222222222222222222222222222222'],
      requireAllowlist: true,
    }),
    /allowlist/,
  )
  assert.throws(
    () => assertRecordHasNoSecrets({ anchor: { privateKey: TESTNET_KEY } }, 'batch'),
    /publisher secrets/,
  )
  const receipt = buildKeyDrillReceipt({
    address: '0x1111111111111111111111111111111111111111',
    network: testnet,
    signature: '0xdead',
    recoveredAt: '2026-09-16T00:00:00.000Z',
  })
  assert.equal(receipt.passed, true)
  assert.doesNotMatch(JSON.stringify(receipt), /privateKey|mnemonic/)
})

test('anchoring retries transient failures, reuses confirmed batches, and records mainnet cost', async () => {
  const key = contentLedgerIdempotencyKey({ chainId: 8453, merkleRoot: 'ab'.repeat(32), schemaUid: SCHEMA_UID })
  const sleeps = []
  let attempts = 0
  const result = await withPublishRetry(async () => {
    attempts += 1
    if (attempts < 3) {
      const error = new Error('503 gateway')
      error.code = 'SERVER_ERROR'
      throw error
    }
    return 'ok'
  }, { sleep: async (ms) => { sleeps.push(ms) } })
  assert.equal(result, 'ok')
  assert.deepEqual(sleeps, [publishBackoffMs(1), publishBackoffMs(2)])
  assert.equal(isRetryablePublishError(new Error('invalid schema')), false)

  const confirmed = {
    idempotencyKey: key,
    merkleRoot: 'ab'.repeat(32),
    status: 'confirmed',
    transactionHash: `0x${'cd'.repeat(32)}`,
    attestationUid: `0x${'ef'.repeat(32)}`,
    attemptCount: 1,
  }
  assert.equal(resolveIdempotentPublish(confirmed, { idempotencyKey: key, merkleRoot: 'ab'.repeat(32) }).action, 'reuse')
  assert.equal(resolveIdempotentPublish({ ...confirmed, status: 'failed', transactionHash: null, attestationUid: null }, { idempotencyKey: key }).action, 'retry')

  const cost = recordContentLedgerCost({
    idempotencyKey: key,
    chainId: 8453,
    network: 'base',
    transactionHash: `0x${'cd'.repeat(32)}`,
    publisherAddress: '0x1111111111111111111111111111111111111111',
    gasUsed: 21000,
    effectiveGasPriceWei: 1_000_000_000,
    latencyMs: 1200,
    attemptCount: 2,
    recordedAt: '2026-09-16T00:00:00.000Z',
  })
  assert.equal(cost.costWei, '21000000000000')
  const ledger = upsertPublishLedger({ items: [] }, { ...confirmed, ...cost, recordedAt: '2026-09-16T00:00:00.000Z' })
  assert.equal(findLedgerRecord(ledger, key).transactionHash, confirmed.transactionHash)

  const window = summarizeAnchorWindow(
    Array.from({ length: 4 }, (_, index) => ({
      network: 'base',
      status: 'confirmed',
      costWei: cost.costWei,
      latencyMs: 1000 + index,
      recordedAt: `2026-09-16T00:0${index}:00.000Z`,
    })),
  )
  assert.equal(window.consecutiveConfirmed, 4)
  assert.equal(window.readyForMainnetRamp, true)
  assert.equal(window.totalCostWei, '84000000000000')
})

test('RSS, llms.txt and proofs.xml expose the demo proof JSON', async () => {
  const entries = listContentProofDiscoveryEntries()
  assert.equal(entries[0].proofJsonUrl, 'https://2aran.com/proofs/content-proof-demo-v1.json')
  assert.equal(entries[0].replicaUrl, 'https://2aran.com/proofs/replicas/content-proof-demo-v1.json')
  assert.match(renderContentProofLlmsSection(entries), /内容凭证/)
  assert.equal(listContentProofRssEntries()[0].category, '内容凭证')
  const xml = await (await proofsRss()).text()
  assert.match(xml, /content-proof-demo/)
  assert.match(xml, /proofs\/research:topics:content-proof-demo/)
})

test('ops scripts keep publisher keys out of batch JSON and require mainnet confirmation', async () => {
  const [anchor, pin, drill, replica] = await Promise.all([
    readFile(new URL('../scripts/anchor-content-proof-batch.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/pin-content-replica.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/content-ledger-key-drill.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../lib/contentReplica.js', import.meta.url), 'utf8'),
  ])
  assert.match(anchor, /--confirm-mainnet/)
  assert.match(anchor, /CONTENT_LEDGER_MAINNET_PRIVATE_KEY/)
  assert.match(anchor, /idempotencyKey/)
  assert.match(pin, /readReplicaFromGateways/)
  assert.match(drill, /mode 0600/)
  assert.doesNotMatch(replica, /from ['"]node:/)
})
