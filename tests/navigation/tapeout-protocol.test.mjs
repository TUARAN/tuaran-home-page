import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { HOME_RESOURCE_ITEMS } from '../../lib/homeResourceItems.js'
import { STATIC_PAGE_REGISTRY } from '../../lib/staticPageRegistry.mjs'

const root = process.cwd()
const href = '/resources/tapeout-protocol'
const pdfPath = path.join(root, 'public/resources/tapeout-protocol/TapeOut-Protocol.pdf')
const pagePath = path.join(root, 'app/(site)/resources/tapeout-protocol/page.jsx')

test('TapeOut resource is indexed with its original PDF', () => {
  assert.ok(HOME_RESOURCE_ITEMS.some((item) => item.href === href && item.subjects?.includes('web3')))
  assert.ok(STATIC_PAGE_REGISTRY.some((item) => item.path === href && item.sitemap))
  assert.ok(statSync(pdfPath).size > 100_000)
  assert.equal(readFileSync(pdfPath).subarray(0, 5).toString(), '%PDF-')

  const page = readFileSync(pagePath, 'utf8')
  assert.match(page, /TapeOut-Protocol\.pdf/)
  assert.match(page, /https:\/\/tapeout\.net\//)
  assert.match(page, /download="TapeOut-Protocol\.pdf"/)
  assert.match(page, /ContentPvBeacon category="resource" slug="tapeout-protocol"/)
})
