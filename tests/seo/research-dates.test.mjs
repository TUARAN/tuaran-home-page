import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { normalizeResearchDate, normalizeResearchUpdated, resolveResearchDates } from '../../lib/research/datetime.js'

test('published and modified dates preserve independent instants and explicit timezone', () => {
  const dates = resolveResearchDates({ date: '2026-09-08', time: '14:30', updated: '2026-09-09T01:15:00+08:00' })
  assert.equal(dates.publishedTime, '2026-09-08T06:30:00.000Z')
  assert.equal(dates.modifiedTime, '2026-09-08T17:15:00.000Z')
  assert.equal(dates.updated, '2026-09-09T01:15:00+08:00')
  assert.equal(resolveResearchDates({ date: '2026-09-08', updated: '2026-09-09' }).modifiedTime, '2026-09-09T00:00:00.000Z')
})

test('legacy date-only content keeps its existing UTC representation', () => {
  const dates = resolveResearchDates({ date: '2026-09-08' })
  assert.equal(dates.publishedTime, '2026-09-08T00:00:00.000Z')
  assert.equal(dates.modifiedTime, dates.publishedTime)
  assert.equal(dates.updated, '')
})

test('invalid calendar, clock and timezone values do not roll over or throw', () => {
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-9-8', 'yesterday', 42]) {
    assert.equal(normalizeResearchDate(date), '')
  }
  assert.equal(normalizeResearchDate('2024-02-29'), '2024-02-29')
  for (const updated of ['2026-02-30', '2026-09-09T24:00:00Z', '2026-09-09T12:60:00Z', '2026-09-09T12:00:60Z', '2026-09-09T12:00:00', '2026-09-09T12:00:00+08:99', '2026-09-09T12:00:00+14:30', null, {}]) {
    assert.equal(normalizeResearchUpdated(updated), '')
    const dates = resolveResearchDates({ date: '2026-09-08', updated })
    assert.equal(dates.modifiedTime, dates.publishedTime)
  }
})

test('invalid publication date uses the filename, or omits dates if neither is valid', () => {
  const dates = resolveResearchDates({ date: '2026-02-30', time: '99:99' }, '2026-09-08')
  assert.equal(dates.date, '2026-09-08')
  assert.equal(dates.time, '')
  assert.equal(dates.publishedTime, '2026-09-08T00:00:00.000Z')
  const unknown = resolveResearchDates({ date: 'invalid', updated: 'invalid' }, '2026-02-30')
  assert.equal(unknown.publishedTime, undefined)
  assert.equal(unknown.modifiedTime, undefined)
  assert.equal(unknown.dateTimeIso, undefined)
  assert.equal(resolveResearchDates({ updated: '2026-09-09' }).modifiedTime, '2026-09-09T00:00:00.000Z')
})

test('updates earlier than publication fall back, including same-day date-only updates', () => {
  for (const updated of ['2026-09-07', '2026-09-08', '2026-09-08T14:29:59+08:00']) {
    const dates = resolveResearchDates({ date: '2026-09-08', time: '14:30', updated })
    assert.equal(dates.modifiedTime, dates.publishedTime)
    assert.equal(dates.updated, '')
  }
})

test('output is independent of the current build clock', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-09-09T00:00:00Z') })
  const input = { date: '2026-09-08', updated: '2026-09-09' }
  const before = resolveResearchDates(input)
  const absent = resolveResearchDates({})
  t.mock.timers.tick(365 * 86400000)
  assert.deepEqual(resolveResearchDates(input), before)
  assert.deepEqual(resolveResearchDates({}), absent)
})

test('real frontmatter loader exposes normalized dates through detail and list entries', async () => {
  const originalCwd = process.cwd()
  const fixture = mkdtempSync(path.join(tmpdir(), 'research-dates-'))
  mkdirSync(path.join(fixture, 'research/topics'), { recursive: true })
  for (const [slug, fields] of Object.entries({
    updated: 'date: 2026-09-08\ntime: 14:30\nupdated: 2026-09-09T01:15:00+08:00',
    legacy: 'date: 2026-09-08',
    invalid: 'date: broken\ntime: bad\nupdated: 2026-02-30',
  })) {
    writeFileSync(path.join(fixture, `research/topics/2026-09-08-${slug}.md`), `---\ntitle: Date fixture\n${fields}\n---\n\nFixture body.\n`)
  }
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      return nextResolve(context.parentURL?.includes('/lib/research/') && /^\.\/[\w-]+$/.test(specifier) ? `${specifier}.js` : specifier, context)
    },
  })
  try {
    process.chdir(fixture)
    const { getResearchEntry, listResearch } = await import('../../lib/research/loader.js')
    const updated = getResearchEntry('topics', 'updated')
    assert.equal(updated.publishedTime, '2026-09-08T06:30:00.000Z')
    assert.equal(updated.modifiedTime, '2026-09-08T17:15:00.000Z')
    assert.equal(updated.updated, '2026-09-09T01:15:00+08:00')
    for (const entry of listResearch()) {
      assert.equal(entry.modifiedTime, getResearchEntry(entry.category, entry.slug).modifiedTime)
      if (entry.slug !== 'updated') assert.equal(entry.modifiedTime, '2026-09-08T00:00:00.000Z')
    }
  } finally {
    process.chdir(originalCwd)
    hooks.deregister()
    rmSync(fixture, { recursive: true, force: true })
  }
})

test('Open Graph, JSON-LD and sitemap consume the same loader fields', () => {
  const page = readFileSync(new URL('../../app/(site)/articles/research/[category]/[slug]/page.jsx', import.meta.url), 'utf8')
  const sitemap = readFileSync(new URL('../../app/(site)/sitemap.js', import.meta.url), 'utf8')
  assert.match(page, /publishedTime: entry\.publishedTime/)
  assert.match(page, /modifiedTime: entry\.modifiedTime/)
  assert.match(page, /datePublished: entry\.publishedTime/)
  assert.match(page, /dateModified: entry\.modifiedTime/)
  assert.match(sitemap, /entry\.modifiedTime \? \{ lastModified: entry\.modifiedTime \} : \{\}/)
})
