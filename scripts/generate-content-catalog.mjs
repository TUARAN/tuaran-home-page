#!/usr/bin/env node
import { register } from 'node:module'
import fs from 'node:fs'
register('./content-source-loader.mjs', import.meta.url)
const { listAllContent } = await import('../lib/contentPipeline.js')
const catalog = await import('../lib/research/catalog.js')
const { articles } = await import('../lib/articleMetadata.js')
const { buildKnowledgeItems } = await import('../app/(site)/articles/buildKnowledgeItems.js')
const { documents } = await import('./research-snapshots.mjs')
const archiveKeys = new Set(JSON.parse(fs.readFileSync(new URL('../data/content-archive.json', import.meta.url), 'utf8')).researchKeys)
const output = {
  version: 1,
  entries: listAllContent(),
  knowledgeItems: buildKnowledgeItems(),
  researchMeta: Object.fromEntries(documents.filter(({ entry }) => !entry.encrypted && archiveKeys.has(`${entry.category}/${entry.slug}`)).map(({ entry }) => {
    const { content, variants, encryptedPayload, ...metadata } = entry
    return [`${entry.category}/${entry.slug}`, metadata]
  })),
  researchRedirects: catalog.RESEARCH_ARTICLE_REDIRECTS,
  researchKeys: catalog.RESEARCH_ENTRY_KEYS,
  articles,
}
const directory = new URL('../public/data/', import.meta.url)
fs.mkdirSync(directory, { recursive: true })
fs.writeFileSync(new URL('content-catalog.json', directory), `${JSON.stringify(output)}\n`)
console.log(`[content-catalog] ${output.entries.length} public entries; archive snapshot only, no bodies`)
