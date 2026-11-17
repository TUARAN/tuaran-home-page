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
  assert.equal(background.communityCopySlotOpen(Date.parse('2026-11-16T14:03:00+08:00')), false)
  assert.equal(background.communityCopySlotId(22 * 60), 'evening')
})

test('community greetings use the same three slots in the scheduler and content module', () => {
  const slots = [['morning', 8, '早安'], ['noon', 12, '午安'], ['evening', 22, '晚安']]
  assert.deepEqual(copy.copySlots().map(({ id }) => id), slots.map(([id]) => id))
  for (const [id, hour, label] of slots) {
    const now = Date.parse(`2026-11-16T${String(hour).padStart(2, '0')}:10:00+08:00`)
    assert.equal(background.communityCopySlotId(hour * 60 + 10), id)
    assert.equal(copy.copySlotAt(now)?.id, id)
    assert.ok(copy.pickTemplate(id, now).startsWith(label))
  }
  const afternoon = Date.parse('2026-11-16T14:05:00+08:00')
  assert.equal(copy.copySlotAt(afternoon), null)
  assert.equal(copy.nextCopySlotAt(afternoon), Date.parse('2026-11-16T22:00:00+08:00'))
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

test('the task desk displays the community body for community greetings', async () => {
  const css = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.css', import.meta.url), 'utf8')
  const mainVisibilityRule = css.split('/* 排班台进入单项后')[0]
  assert.match(mainVisibilityRule, /\[data-desk="task"\]\[data-assistant-mode="community-copy"\] \.xrc-community-body,[^{]+\{\s*display: grid !important;/)
})
