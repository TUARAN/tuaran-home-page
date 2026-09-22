import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

import { DOWNLOAD_ITEMS } from '../../lib/downloadItems.js'
import { STATIC_PAGE_REGISTRY } from '../../lib/staticPageRegistry.mjs'
import { TOOL_ITEMS } from '../../lib/toolItems.js'

const pagePath = '/tools/workbuddy-desktop-pet'

test('desktop pet is discoverable from site catalogs and sitemap', () => {
  assert.ok(TOOL_ITEMS.some((item) => item.href === pagePath && item.status === 'experiment'))
  assert.ok(DOWNLOAD_ITEMS.some((item) => item.href === pagePath && item.status === 'building'))
  assert.ok(STATIC_PAGE_REGISTRY.some((entry) => entry.path === pagePath && entry.sitemap))
})

test('desktop pet page offers an interactive local preview and a real app screenshot', async () => {
  const [page, demo] = await Promise.all([
    readFile(new URL('../../app/(site)/tools/workbuddy-desktop-pet/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/tools/workbuddy-desktop-pet/DesktopPetDemo.jsx', import.meta.url), 'utf8'),
    access(new URL('../../public/images/workbuddy-desktop-pet/screenshot.png', import.meta.url)),
  ])
  assert.match(page, /<DesktopPetDemo \/>/)
  assert.match(page, /安装包尚未开放/)
  assert.match(page, /screenshot\.png/)
  assert.match(demo, /onClick=\{petLulu\}/)
  assert.match(demo, /onSubmit=\{sendMessage\}/)
  assert.match(demo, /不连接 WorkBuddy/)
  assert.doesNotMatch(demo, /fetch\(|window\.pet|localStorage/)
})
