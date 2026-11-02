import assert from 'node:assert/strict'
import test from 'node:test'
import { isToolDirectoryItem } from '../lib/content/resourceDirectory.js'
import { TOOL_ITEMS } from '../lib/site/toolItems.js'
import { INTERACTIVE_DIRECTORY_WORKS } from '../lib/site/engineeringWorks.js'
import { isResourceDirectoryItem } from '../lib/content/directoryMembership.js'

test('互动、资源、工具目录互斥，锚点和查询参数不改变归属', () => {
  const interactiveHrefs = new Set(INTERACTIVE_DIRECTORY_WORKS.map((item) => item.href))
  for (const item of TOOL_ITEMS) {
    assert.equal(interactiveHrefs.has(item.href), false, item.href)
    assert.equal(isResourceDirectoryItem(item), false, item.href)
  }
  for (const item of INTERACTIVE_DIRECTORY_WORKS) {
    assert.equal(isToolDirectoryItem(item), false, item.href)
    assert.equal(isResourceDirectoryItem(item), false, item.href)
    assert.equal(isResourceDirectoryItem({ href: `${item.href}?from=search#details` }), false)
  }
  assert.equal(isResourceDirectoryItem({ href: '/resources/new-interactive', contentKind: 'interactive' }), false)
  assert.equal(isResourceDirectoryItem({ href: '/resources/wallpapers' }), true)
})

test('工具目录中的所有入口均从资源目录排除，包括历史下载 URL', () => {
  for (const item of TOOL_ITEMS) {
    assert.equal(isToolDirectoryItem(item), true, item.href)
  }
  assert.equal(isToolDirectoryItem({ href: '/resources/2aran-desktop?from=search' }), true)
  assert.equal(isToolDirectoryItem({ href: '/resources/new-tool', resourceType: 'tool' }), true)
  assert.equal(isToolDirectoryItem({ href: '/tools/new-tool' }), true)
})

test('资料和可下载素材仍属于资源', () => {
  for (const href of ['/resources/wallpapers', '/resources/ai-music', '/resources/rss', '/resources/ai-learning-library']) {
    assert.equal(isToolDirectoryItem({ href, delivery: 'download' }), false, href)
  }
})
