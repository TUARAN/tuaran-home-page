import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'

const require = createRequire(import.meta.url)
const copy = require('../../tools/x-reply-clipboard-extension/communityCopy.js')
const background = require('../../tools/x-reply-clipboard-extension/background.js')

test('community copy slots open only inside 15-minute windows', () => {
  assert.equal(background.communityCopySlotOpen(Date.parse('2026-11-16T08:00:00+08:00')), true)
  assert.equal(background.communityCopySlotId(8 * 60), 'morning')
  assert.equal(background.communityCopySlotOpen(Date.parse('2026-11-16T08:14:00+08:00')), true)
  assert.equal(background.communityCopySlotOpen(Date.parse('2026-11-16T08:15:00+08:00')), false)
  assert.equal(background.communityCopySlotId(14 * 60 + 3), 'theory')
  assert.equal(background.communityCopySlotId(22 * 60), 'evening')
})

test('community copy templates cover four slots and big-interaction link', () => {
  const morning = copy.pickTemplate('morning', Date.parse('2026-11-16T08:05:00+08:00'))
  const theory = copy.pickTemplate('theory', Date.parse('2026-11-16T14:05:00+08:00'))
  assert.match(morning, /早安/)
  assert.match(theory, /2aran\.com\/resources\/big-interaction-whitepaper/)
  assert.equal(copy.copySlotAt(Date.parse('2026-11-16T12:10:00+08:00'))?.id, 'noon')
  assert.equal(copy.copySlotAt(Date.parse('2026-11-16T12:20:00+08:00')), null)
})

test('extension wires community-copy into shelf, manifest and panel', async () => {
  const shelf = await readFile(new URL('../../lib/community/xExtensionTaskShelf.js', import.meta.url), 'utf8')
  const manifest = await readFile(new URL('../../tools/x-reply-clipboard-extension/manifest.json', import.meta.url), 'utf8')
  const content = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
  assert.match(shelf, /id: 'community-copy'/)
  assert.match(manifest, /communityCopy\.js/)
  assert.match(content, /XrcCommunityCopy/)
  assert.match(content, /data-xrc-community-copy-toggle/)
  assert.match(content, /十九项任务由后台排班/)
})
