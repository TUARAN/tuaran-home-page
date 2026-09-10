#!/usr/bin/env node
import fs from 'node:fs'
import { documents } from './research-snapshots.mjs'

const archiveKeys = new Set(JSON.parse(fs.readFileSync(new URL('../data/content-archive.json', import.meta.url), 'utf8')).researchKeys)
const archived = documents.filter(({ entry }) => archiveKeys.has(`${entry.category}/${entry.slug}`))
const directory = new URL('../public/data/research-archive/', import.meta.url)
fs.rmSync(directory, { recursive: true, force: true })
for (const { entry } of archived) {
  const category = new URL(`${entry.category}/`, directory)
  fs.mkdirSync(category, { recursive: true })
  fs.writeFileSync(new URL(`${entry.slug}.json`, category), JSON.stringify(entry) + '\n')
}
console.log(`[research-assets] ${archived.length} historical snapshots; no Worker body imports`)
