import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'

// Evaluate the real navigation modules without Next's extensionless import resolver.
const sources = await Promise.all(['engineeringWorks', 'communityTopics', 'siteNav'].map(async (name) =>
  (await readFile(new URL(`../../lib/${name}.js`, import.meta.url), 'utf8'))
    .replace(/^import .*$/gm, '').replace(/^export /gm, '')
))
const { SITE_CHANNELS, getChannelNavSections, getActiveNavHref } = vm.runInNewContext(
  `${sources.join('\n')}\n;({ SITE_CHANNELS, getChannelNavSections, getActiveNavHref })`,
  { URL, URLSearchParams },
)
const sectionsFor = (key) => getChannelNavSections(SITE_CHANNELS.find((channel) => channel.key === key), null)

test('content dropdown shows four selected topics and three content types', () => {
  const content = SITE_CHANNELS.find((channel) => channel.key === 'content')
  const visible = sectionsFor('content')
  const itemsIn = (sections, title) => sections.find((section) => section.title === title).items
  assert.deepEqual(
    Array.from(itemsIn(visible, '内容主题'), (item) => item.label),
    ['AI 与开发', 'Web 与云', '产品与体验', '公司调研'],
  )
  assert.deepEqual(
    Array.from(itemsIn(visible, '内容类型'), (item) => item.label),
    ['互动', '资源', '精选'],
  )
  assert.ok(itemsIn(content.sections, '内容主题').length > 4)
  assert.ok(itemsIn(content.sections, '内容类型').length > 3)
})

test('public opinion and Codex reset select their own analysis entries', () => {
  assert.equal(getActiveNavHref(sectionsFor('tools'), '/public-opinion'), '/public-opinion')
  assert.equal(getActiveNavHref(sectionsFor('tools'), '/codex-reset'), '/codex-reset')
  assert.equal(getActiveNavHref(sectionsFor('tools'), '/tools'), '/tools')
  assert.equal(getActiveNavHref(sectionsFor('tools'), '/tools/multi-ip'), '/tools')
})

test('x automation retrospective selects content interactives channel', () => {
  assert.equal(getActiveNavHref(sectionsFor('content'), '/x-automation-retrospective'), '/rich-pages')
})

test('legacy capability detail pages select the unified capability entry', () => {
  const sections = sectionsFor('systems')
  for (const path of ['/skill-center', '/skill-center/example', '/mcp-center', '/prompt-center', '/workbuddy-publish-center']) {
    assert.equal(getActiveNavHref(sections, path), '/capabilities')
  }
})

test('all visible internal entries have exactly one owning channel and select themselves', () => {
  for (const channel of SITE_CHANNELS) {
    const sections = sectionsFor(channel.key)
    for (const item of sections.flatMap((section) => section.items)) {
      if (item.external) continue
      const url = new URL(item.href, 'https://2aran.com')
      const owners = SITE_CHANNELS.filter((candidate) => candidate.match(url.pathname, url.searchParams))
      assert.equal(owners.length, 1, item.href)
      assert.equal(owners[0].key, channel.key, item.href)
      assert.equal(getActiveNavHref(sections, url.pathname, url.searchParams), item.href)
    }
  }
})

test('query filters beat overview links and do not select unrelated filters', () => {
  const sections = sectionsFor('content')
  assert.equal(getActiveNavHref(sections, '/articles', new URLSearchParams('subject=ai_dev&q=test')), '/articles?subject=ai_dev')
  assert.equal(getActiveNavHref(sections, '/articles', new URLSearchParams('group=resource')), '/articles?group=resource')
  assert.equal(getActiveNavHref(sections, '/articles', new URLSearchParams('group=analysis')), '/articles')
  assert.equal(getActiveNavHref(sections, '/articles', new URLSearchParams('q=test')), '/articles')
  assert.equal(getActiveNavHref(sections, '/articles/example'), '/articles')
})

test('matching respects path boundaries, trailing slashes, and longest nested entry', () => {
  const sections = [{ items: [{ href: '/tools' }, { href: '/tools/nested' }, { href: '/tools#analysis' }] }]
  assert.equal(getActiveNavHref(sections, '/tools/nested/detail'), '/tools/nested')
  assert.equal(getActiveNavHref(sections, '/tools/'), '/tools')
  assert.equal(getActiveNavHref(sections, '/tools-other'), null)
  assert.equal(getActiveNavHref(sections, null), null)
  assert.equal(getActiveNavHref([{ items: [{ href: 'https://example.com', external: true }] }], '/'), null)
})

test('desktop and mobile render route state instead of featured styling', async () => {
  const header = await readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../../app/globals.css', import.meta.url), 'utf8')
  assert.doesNotMatch(header, /item\.featured|site-menu-item-featured/)
  assert.equal((header.match(/active=\{item\.href === activeHref\}/g) || []).length, 2)
  assert.match(header, /aria-current=\{active \? 'page' : undefined\}/)
  assert.match(css, /\.site-menu-item-active\s*\{/)
  assert.doesNotMatch(css, /site-menu-item-featured/)
})
