import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { SYNCBLOG_DOCS, SYNCBLOG_DOCS_TOC } from '../lib/content/syncblogDocs.mjs'

test('documentation groups have unique anchors and cover both platform utilities', () => {
  const ids = SYNCBLOG_DOCS.groups.flatMap(group => group.sections.map(section => section.id))
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(SYNCBLOG_DOCS_TOC.flatMap(group => group.items.map(item => item.id)), ids)
  for (const id of ['quick-start', 'distribution', 'ai-settings', 'juejin-checkin', 'xiaohongshu-manager', 'states', 'updates', 'data']) assert.ok(ids.includes(id))
})
test('offline artifact shares all sections and contains no broken internal anchors or inline scripts', async () => {
  const out = await mkdtemp(path.join(os.tmpdir(), 'adm-docs-test-'))
  try {
    execFileSync(process.execPath, ['scripts/build-syncblog-docs.mjs', out])
    const html = await readFile(path.join(out, 'docs.html'), 'utf8')
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]))
    for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(match[1]), match[1])
    for (const group of SYNCBLOG_DOCS.groups) for (const section of group.sections) assert.ok(ids.has(section.id))
    assert.match(html, new RegExp(`v${SYNCBLOG_DOCS.version.replaceAll('.', '\\.')}`))
    assert.match(html, /src="master\/docs.js"/)
    assert.doesNotMatch(html, /<script[^>]*>[^<]+<\/script>/)
    const script = await readFile(path.join(out, 'master/docs.js'), 'utf8')
    assert.match(script, /target.open = true/)
    assert.match(script, /hashchange/)
    assert.match(script, /aria-current/)
  } finally { await rm(out, { recursive: true, force: true }) }
})
