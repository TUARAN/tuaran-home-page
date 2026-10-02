import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageSource = await readFile(new URL('../../app/(admin)/admin/site-health/page.jsx', import.meta.url), 'utf8')
const reportSource = await readFile(new URL('../../ai-context/site-health-audit.md', import.meta.url), 'utf8')
const designSource = await readFile(new URL('../../app/(admin)/admin/design/page.jsx', import.meta.url), 'utf8')
const nextConfigSource = await readFile(new URL('../../next.config.js', import.meta.url), 'utf8')

test('UI design stays in engineering while runtime tools share one operations center', () => {
  assert.match(designSource, /title="UI 设计"/)
  assert.match(designSource, /href="\/admin\/site-health"/)
  assert.doesNotMatch(designSource, /site-health-audit\.md/)
  assert.match(pageSource, /title="运行中心"/)
  assert.match(pageSource, /label: '站点体检'/)
  assert.match(pageSource, /label: '数据健康'/)
  assert.match(pageSource, /label: '可用性探测'/)
  assert.match(pageSource, /label: '故障公告'/)
  assert.match(pageSource, /<DbAdminClient embedded \/>/)
  assert.match(pageSource, /<BloggerEyeConsole embedded \/>/)
  assert.match(pageSource, /<SiteStatusConsole embedded \/>/)
  assert.match(pageSource, /site-health-audit\.md\?raw/)
  assert.match(nextConfigSource, /site-health-audit/)
})

test('site health report records scope correction, findings, repairs, and verification', () => {
  assert.match(reportSource, /2026-10-02 Cloudflare Error 1102/)
  assert.match(reportSource, /a4449a136d6b5ddd-HKG/)
  assert.match(reportSource, /当前无法复现/)
  assert.match(reportSource, /requestSource = eyeball/)
  assert.match(reportSource, /Early Hints/)
  assert.match(reportSource, /\/api\/site-status/)
  assert.match(reportSource, /SitePresenceProvider/)
  assert.match(reportSource, /D1 Insights/)
  assert.match(reportSource, /## 7\. 建议修复顺序/)
  assert.match(reportSource, /## 8\. 验收指标/)
  assert.equal([...reportSource.matchAll(/^- \[ \] HEALTH-\d+/gm)].length, 9)
})
