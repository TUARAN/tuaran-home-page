import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [clientSource, pageSource, worksSource, directorySource] = await Promise.all([
  readFile(new URL('../../app/(site)/adsense-content-check/AdSenseContentCheckClient.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/adsense-content-check/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../lib/engineeringWorks.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/ArticlesIndexClient.jsx', import.meta.url), 'utf8'),
])

test('AdSense policy summary is implemented as a registered interactive page', () => {
  assert.match(pageSource, /createRichPageMetadata\('adsense-content-check'\)/)
  assert.match(worksSource, /id: 'adsense-content-check'[\s\S]*href: '\/adsense-content-check'/)
  assert.match(clientSource, /const POLICY_SUMMARIES = \[/)
  assert.equal(clientSource.match(/critical: (?:true|false)/g)?.length, 24)
  assert.match(clientSource, /pass: \{ label: '通过'/)
  assert.match(clientSource, /fix: \{ label: '待整改'/)
  assert.match(clientSource, /unsure: \{ label: '待确认'/)
  assert.match(clientSource, /window\.localStorage\.setItem\(STORAGE_KEY/)
  assert.match(clientSource, /这是站内自检结果，不是 Google 审核结果预测/)
})

test('legacy and delivery-based interactive links resolve to the independent group', () => {
  assert.match(directorySource, /works: 'interactive'/)
  assert.match(directorySource, /delivery === 'interact'[\s\S]*\? 'interactive'/)
})
