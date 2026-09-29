import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageSource = await readFile(new URL('../../app/(admin)/admin/site-health/page.jsx', import.meta.url), 'utf8')
const reportSource = await readFile(new URL('../../ai-context/site-health-audit.md', import.meta.url), 'utf8')
const designSource = await readFile(new URL('../../app/(admin)/admin/design/page.jsx', import.meta.url), 'utf8')
const nextConfigSource = await readFile(new URL('../../next.config.js', import.meta.url), 'utf8')

test('UI design and site health have separate admin pages and cross-links', () => {
  assert.match(designSource, /title="UI 设计"/)
  assert.match(designSource, /href="\/admin\/site-health"/)
  assert.doesNotMatch(designSource, /site-health-audit\.md/)
  assert.match(pageSource, /title="站点体检"/)
  assert.match(pageSource, /href="\/admin\/design"/)
  assert.match(pageSource, /site-health-audit\.md\?raw/)
  assert.match(nextConfigSource, /site-health-audit/)
})

test('site health report records scope correction, findings, repairs, and verification', () => {
  assert.match(reportSource, /requestSource = eyeball/)
  assert.match(reportSource, /Early Hints/)
  assert.match(reportSource, /\/api\/site-status/)
  assert.match(reportSource, /SitePresenceProvider/)
  assert.match(reportSource, /D1 Insights/)
  assert.match(reportSource, /## 7\. 建议修复顺序/)
  assert.match(reportSource, /## 8\. 验收指标/)
  assert.equal([...reportSource.matchAll(/^- \[ \] HEALTH-\d+/gm)].length, 9)
})
