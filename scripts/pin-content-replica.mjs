#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { getContentProofCredential } from '../lib/contentProofRegistry.js'
import {
  DEFAULT_IPFS_GATEWAYS,
  assertIndependentGateways,
  buildContentReplica,
  createPinataPin,
  pinContentReplica,
  readReplicaFromGateways,
} from '../lib/contentReplica.js'

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1]
}

function usage() {
  return `Usage:
  node scripts/pin-content-replica.mjs --proof public/proofs/content-proof-demo-v1.json --content-key research:topics:content-proof-demo --output public/proofs/replicas/content-proof-demo-v1.json
  PINATA_JWT=... node scripts/pin-content-replica.mjs --pin --proof proof.json --content-key research:topics:demo --output replica.json --record replica.pin.json

Default writes the canonical replica payload only. --pin uploads exact UTF-8 bytes
to Pinata, then reads the CID back from two independent gateways and checks SHA-256.`
}

const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log(usage())
  process.exit(0)
}

const proofPath = valueAfter(args, '--proof')
const contentKey = valueAfter(args, '--content-key')
const outputPath = valueAfter(args, '--output')
if (!proofPath || !contentKey || !outputPath) {
  console.error(usage())
  process.exit(1)
}

const credential = getContentProofCredential(contentKey)
if (!credential?.entry) throw new Error(`no registered content entry for ${contentKey}`)
const proof = JSON.parse(await readFile(resolve(proofPath), 'utf8'))
const built = await buildContentReplica({ proof, entry: credential.entry })
await mkdir(dirname(resolve(outputPath)), { recursive: true })
try {
  await writeFile(resolve(outputPath), built.payload, { flag: 'wx', mode: 0o644 })
} catch (error) {
  if (error?.code !== 'EEXIST') throw error
  const existing = await readFile(resolve(outputPath), 'utf8')
  if (existing !== built.payload) throw new Error(`refusing to overwrite a different replica at ${outputPath}`)
}

if (!args.includes('--pin')) {
  console.log(JSON.stringify({ cid: null, output: resolve(outputPath), replicaHash: built.replicaHash, status: 'local' }))
  process.exit(0)
}

const customGateways = [valueAfter(args, '--gateway-a'), valueAfter(args, '--gateway-b')].filter(Boolean)
const gateways = assertIndependentGateways(
  customGateways.length === 2 ? customGateways : DEFAULT_IPFS_GATEWAYS,
  { pinProviderHost: 'gateway.pinata.cloud' },
)
const recordPath = resolve(valueAfter(args, '--record') || outputPath.replace(/\.json$/, '.pin.json'))
let existing = null
try {
  existing = JSON.parse(await readFile(recordPath, 'utf8'))
} catch (error) {
  if (error?.code !== 'ENOENT') throw error
}
const pinned = await pinContentReplica(built, {
  existing,
  pin: createPinataPin({ jwt: process.env.PINATA_JWT }),
  name: `${contentKey.replaceAll(':', '-')}-v${proof.version}.json`,
})
const readback = await readReplicaFromGateways(pinned.cid, {
  expectedHash: built.replicaHash,
  gateways,
  pinProviderHost: 'gateway.pinata.cloud',
})
const record = {
  schema: 'https://2aran.com/schemas/content-replica-record/v1',
  contentKey,
  version: proof.version,
  proofId: proof.proofId,
  replicaHash: built.replicaHash,
  cid: pinned.cid,
  replicaUri: `ipfs://${pinned.cid}`,
  provider: pinned.provider,
  idempotent: pinned.idempotent,
  gateways: readback.gateways,
  status: 'verified',
  verifiedAt: new Date().toISOString(),
}
await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o644 })
console.log(JSON.stringify({ cid: record.cid, replicaHash: record.replicaHash, status: record.status, record: recordPath }))
