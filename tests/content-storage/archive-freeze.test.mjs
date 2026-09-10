import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('adding 3650 Git research files does not enlarge the generated legacy Worker catalog', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'research-archive-freeze-'))
  try {
    for (const directory of ['data', 'research/topics', 'lib/research']) fs.mkdirSync(path.join(root, directory), { recursive: true })
    fs.writeFileSync(path.join(root, 'data/content-archive.json'), JSON.stringify({ researchKeys: ['topics/legacy'] }))
    fs.writeFileSync(path.join(root, 'research/topics/2026-09-10-legacy.md'), '---\ntitle: Legacy\n---\nOriginal')
    const script = fileURLToPath(new URL('../../scripts/generate-research-catalog.mjs', import.meta.url))
    const generate = () => {
      const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' })
      assert.equal(result.status, 0, result.stderr)
      return fs.readFileSync(path.join(root, 'lib/research/catalog.js'), 'utf8')
    }
    const before = generate()
    for (let index = 0; index < 3650; index++) fs.writeFileSync(path.join(root, `research/topics/2026-09-10-new-${index}.md`), `---\ntitle: New ${index}\n---\nNew body`)
    assert.equal(generate(), before)
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('historical JSON exporter excludes newly authored sources from static assets', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'research-asset-freeze-'))
  const outputUrl = new URL('./archive/', `file://${directory}/`)
  const manifestUrl = new URL('./manifest.json', `file://${directory}/`)
  fs.writeFileSync(manifestUrl, JSON.stringify({ researchKeys: ['topics/legacy'] }))
  try {
    const documents = ['legacy', 'new-private-draft'].map((slug) => ({ entry: { category: 'topics', slug, content: slug } }))
    const source = fs.readFileSync(new URL('../../scripts/generate-research-assets.mjs', import.meta.url), 'utf8')
      .replace(/^#!.*\n/, '').replace(/^import .*\n/gm, '')
      .replace("new URL('../data/content-archive.json', import.meta.url)", 'manifestUrl')
      .replace("new URL('../public/data/research-archive/', import.meta.url)", 'outputUrl')
    new Function('fs', 'documents', 'manifestUrl', 'outputUrl', 'console', source)(fs, documents, manifestUrl, outputUrl, { log() {} })
    assert.deepEqual(fs.readdirSync(new URL('topics/', outputUrl)), ['legacy.json'])
  } finally { fs.rmSync(directory, { recursive: true, force: true }) }
})
