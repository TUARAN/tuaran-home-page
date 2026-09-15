#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { buildContentMerkleBatch } from '../lib/contentMerkle.js'

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1]
}

function usage() {
  return `Usage:
  node scripts/build-content-proof-batch.mjs --input-dir public/proofs/batch-001 --output public/proofs/batches/batch-001.json --generated-at 2026-09-15T00:00:00.000Z [--previous-root 0x...] [--manifest-uri ipfs://...]

The input directory must contain signed content proof JSON files. Output is
created without overwriting an existing batch.`
}

const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log(usage())
  process.exit(0)
}

const inputDir = valueAfter(args, '--input-dir')
const outputPath = valueAfter(args, '--output')
const generatedAt = valueAfter(args, '--generated-at')
if (!inputDir || !outputPath || !generatedAt) {
  console.error(usage())
  process.exit(1)
}

const directory = resolve(inputDir)
const filenames = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort()
if (filenames.length < 10 || filenames.length > 20) throw new Error(`a public testnet batch must contain 10–20 proofs; found ${filenames.length}`)
const proofs = await Promise.all(filenames.map(async (name) => JSON.parse(await readFile(resolve(directory, name), 'utf8'))))
const batch = await buildContentMerkleBatch(proofs, {
  generatedAt,
  previousRoot: valueAfter(args, '--previous-root'),
  manifestUri: valueAfter(args, '--manifest-uri'),
})
await writeFile(resolve(outputPath), `${JSON.stringify(batch, null, 2)}\n`, { flag: 'wx', mode: 0o644 })
console.log(JSON.stringify({ count: batch.count, manifestHash: batch.manifestHash, merkleRoot: batch.merkleRoot, output: resolve(outputPath) }))
