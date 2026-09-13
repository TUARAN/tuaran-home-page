#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { buildAssetManifest, buildContentProof } from '../lib/contentProof.js'

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1]
}

function usage() {
  return `Usage:
  node scripts/build-content-proof.mjs --input entry.json --private-key site-private.jwk.json --output proof.json --published-at 2026-09-14T00:00:00.000Z

The input is a public content entry. Asset records may contain either data or an
existing sha256 + bytes pair. The private JWK is read locally and is never
included in the proof.`
}

const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log(usage())
  process.exit(0)
}

const inputPath = valueAfter(args, '--input')
const keyPath = valueAfter(args, '--private-key')
const outputPath = valueAfter(args, '--output')
const publishedAt = valueAfter(args, '--published-at')
const previousProofId = valueAfter(args, '--previous-proof-id')

if (!inputPath || !keyPath || !outputPath || !publishedAt) {
  console.error(usage())
  process.exit(1)
}

const input = JSON.parse(await readFile(resolve(inputPath), 'utf8'))
const privateKeyJwk = JSON.parse(await readFile(resolve(keyPath), 'utf8'))
const assets = await buildAssetManifest(input.assets || [])
const proof = await buildContentProof({ ...input, assets }, { privateKeyJwk, publishedAt, previousProofId })
await writeFile(resolve(outputPath), `${JSON.stringify(proof, null, 2)}\n`, { flag: 'wx', mode: 0o644 })
console.log(JSON.stringify({ contentKey: proof.contentKey, contentHash: proof.contentHash.value, output: resolve(outputPath), proofId: proof.proofId }))
