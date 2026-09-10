#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { register, createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { normalizeResearchSnapshot } from '../lib/researchDocument.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
require('@next/env').loadEnvConfig(root, false, { info() {}, error() {} })
register('./content-source-loader.mjs', import.meta.url)
const { listResearch, getResearchEntry } = await import('../lib/research/loader.js')
export const documents = []
const seen = new Set()
for (const metadata of listResearch()) {
  const key = `${metadata.category}/${metadata.slug}`
  if (seen.has(key)) continue
  seen.add(key)
  const entry = getResearchEntry(metadata.category, metadata.slug)
  const sourcePath = `research/${entry.category}/${entry.filename}`
  const source = fs.readFileSync(path.join(root, sourcePath))
  if (/^encrypted_source:\s*true\s*$/m.test(source.toString()) && !entry.encrypted) throw new Error(`Unsafe encrypted source flags: ${sourcePath}`)
  const input = { entry, sourcePath, sourceHash: createHash('sha256').update(source).digest('hex'), status: 'published' }
  const { document, error } = normalizeResearchSnapshot(input)
  if (error) throw new Error(`${sourcePath}: ${error}`)
  documents.push({ entry: document.entry, sourcePath, sourceHash: input.sourceHash, status: input.status })
}
