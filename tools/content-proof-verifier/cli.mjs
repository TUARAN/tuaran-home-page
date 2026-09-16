#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { verifyContentProofBundle } from '../../lib/contentProofVerify.js'

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1]
}

function usage() {
  return `Usage:
  node tools/content-proof-verifier/cli.mjs --public-key site-public.jwk.json (--replica replica.json | --proof proof.json --entry entry.json) [--batch batch.json] [--expected-chain-id 84532]

Verify a 2aran content proof from local files. The CLI never fetches 2aran.com.
Pin the publisher public JWK yourself; a key that only appears inside the proof
file does not prove publisher identity.

A passing report means content integrity, proof identity and the publisher
signature matched the pinned key. Optional Merkle and replica checks run when
those files are supplied. It does not mean the article's claims are true.`
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(resolve(path), 'utf8'))
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`failed to read ${label} (${path}): ${detail}`)
  }
}

const args = process.argv.slice(2)
if (args.includes('--help') || args.length === 0) {
  console.log(usage())
  process.exit(args.includes('--help') ? 0 : 1)
}

const publicKeyPath = valueAfter(args, '--public-key')
const replicaPath = valueAfter(args, '--replica')
const proofPath = valueAfter(args, '--proof')
const entryPath = valueAfter(args, '--entry')
const batchPath = valueAfter(args, '--batch')
const expectedChainIdRaw = valueAfter(args, '--expected-chain-id')

if (!publicKeyPath || (!replicaPath && !(proofPath && entryPath))) {
  console.error(usage())
  process.exit(1)
}

try {
  const publicKey = await readJson(publicKeyPath, 'public key')
  const replica = replicaPath ? await readJson(replicaPath, 'replica') : null
  const proof = proofPath ? await readJson(proofPath, 'proof') : null
  const entry = entryPath ? await readJson(entryPath, 'entry') : null
  const batch = batchPath ? await readJson(batchPath, 'batch') : null
  const expectedChainId = expectedChainIdRaw == null ? null : Number(expectedChainIdRaw)
  if (expectedChainIdRaw != null && !Number.isSafeInteger(expectedChainId)) {
    throw new TypeError('--expected-chain-id must be an integer')
  }

  const report = await verifyContentProofBundle({
    entry,
    proof,
    publicKey,
    batch,
    replica,
    expectedChainId,
  })
  console.log(JSON.stringify(report, null, 2))
  process.exit(report.valid ? 0 : 1)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
