import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const loop = require('../../tools/x-reply-clipboard-extension/loop.js')
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)

test('picks the topmost unseen post that still has a reply button', () => {
  const processed = new Set(['2'])
  const next = loop.nextTweet(
    [
      { id: '2', top: 10, replyButton: {} },
      { id: '3', top: 400, replyButton: {} },
      { id: '1', top: 0, replyButton: null },
      { id: '4', top: 80, replyButton: {} },
    ],
    processed,
  )

  assert.equal(next.id, '4')
})

test('reloads after 35 successful replies and after the timeline stalls', () => {
  assert.deepEqual(loop.shouldReload({ pageCount: 35, succeeded: 35, stalled: false }), {
    reload: true,
    reason: 'batch',
  })
  assert.deepEqual(loop.shouldReload({ pageCount: 8, succeeded: 8, stalled: true }), {
    reload: true,
    reason: 'stalled',
  })
  assert.deepEqual(loop.shouldReload({ pageCount: 0, succeeded: 0, stalled: true }), {
    reload: false,
    reason: '',
  })
  assert.equal(loop.BATCH_SIZE, 35)
})

test('treats a disabled Reply button and empty composer placeholders as not ready', () => {
  assert.equal(loop.isSubmitEnabled(null), false)
  assert.equal(loop.isSubmitEnabled({ disabled: true, getAttribute() { return null } }), false)
  assert.equal(
    loop.isSubmitEnabled({ disabled: false, getAttribute(name) { return name === 'aria-disabled' ? 'true' : null } }),
    false,
  )
  assert.equal(loop.isSubmitEnabled({ disabled: false, getAttribute() { return null } }), true)
  assert.equal(loop.composerText({ innerText: 'Post your reply' }), '')
  assert.equal(loop.composerText({ textContent: '  学习了 \u200b' }), '学习了')
})

test('reads a post id from a status permalink', () => {
  assert.equal(loop.statusIdFromHref('/Ocean_Yu1/status/1840000000000000000'), '1840000000000000000')
  assert.equal(loop.statusIdFromHref('https://x.com/Ocean_Yu1/status/99/photo/1'), '99')
  assert.equal(loop.statusIdFromHref('/home'), '')
})

test('content script keeps the 35-reply refresh loop wired to the reply popup', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))

  assert.equal(manifest.manifest_version, 3)
  assert.deepEqual(manifest.permissions, ['clipboardRead'])
  assert.match(content, /data-testid="reply"/)
  assert.match(content, /tweetTextarea_/)
  assert.match(content, /tweetButton/)
  assert.match(content, /location\.reload/)
  assert.match(content, /execCommand\("paste"\)/)
  assert.match(content, /clipboard\.readText/)
  assert.match(content, /BATCH_SIZE/)
})
