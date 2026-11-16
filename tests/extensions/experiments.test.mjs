import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { listContext, avatarUrl, mergePeople } = require('../../tools/x-reply-clipboard-extension/experiments.js')
test('separates following, followers and verified followers by owner', () => {
  assert.equal(listContext('/Alice/verified_followers').kind, 'verified_followers')
  assert.equal(listContext('/Alice/following').owner, 'alice')
  assert.equal(listContext('/Alice/followers').kind, 'followers')
  assert.equal(listContext('/Alice/status/123'), null)
})
test('deduplicates case-insensitively and keeps collected avatars on partial rerenders', () => {
  const url = 'https://pbs.twimg.com/profile_images/123/avatar_normal.jpg'
  const people = mergePeople([{ handle: 'Alice', name: '爱丽丝', avatar: url }], [{ handle: 'alice', name: 'Alice', avatar: null }, { handle: 'bob', name: 'Bob', avatar: 'javascript:bad' }])
  assert.equal(people.length, 2)
  assert.equal(people[0].avatar, url)
  assert.equal(people[1].avatar, null)
  assert.equal(avatarUrl('https://evil.test/profile_images/a.jpg'), null)
  assert.equal(avatarUrl('https://pbs.twimg.com/media/post.jpg'), null)
})
test('operations tools use the same numbered settings section as the hub', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/experiments.js', import.meta.url), 'utf8')
  const panel = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
  assert.match(panel, /<b>03<\/b><span><strong>运营辅助功能<\/strong><small>采集、归档与盘点<\/small><\/span>/)
  assert.match(source, /xrc-docs-section/)
  assert.match(source, /sectionTitle/)
  assert.doesNotMatch(source, /<details/)
  assert.doesNotMatch(source, /<summary>运营辅助功能<\/summary>/)
})
test('manifest loads experiment module after main panel and keeps existing permissions', async () => {
  const { readFile } = await import('node:fs/promises')
  const manifest = JSON.parse(await readFile(new URL('../../tools/x-reply-clipboard-extension/manifest.json', import.meta.url), 'utf8'))
  const scripts = manifest.content_scripts.flatMap(entry => entry.js)
  assert.ok(scripts.indexOf('experiments.js') > scripts.indexOf('content.js'))
  assert.ok(manifest.permissions.includes('storage'))
  assert.ok(!manifest.permissions.includes('downloads'))
})
test('site published source version matches extension manifest', async () => {
  const { readFile } = await import('node:fs/promises')
  const manifest = JSON.parse(await readFile(new URL('../../tools/x-reply-clipboard-extension/manifest.json', import.meta.url), 'utf8'))
  const { X_EXTENSION_LATEST_VERSION } = await import('../../lib/community/xExtensionVersion.js')
  assert.equal(X_EXTENSION_LATEST_VERSION, manifest.version)
})
