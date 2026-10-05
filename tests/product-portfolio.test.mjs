import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { SECONDARY_SITES } from '../lib/secondarySites.js'
import { STATIC_PAGE_REGISTRY } from '../lib/staticPageRegistry.mjs'
import { INTERACTIVE_DIRECTORY_WORKS } from '../lib/engineeringWorks.js'
import { TOOL_ITEMS } from '../lib/toolItems.js'

const root = new URL('../', import.meta.url)
const [worksSource, sitesSource, workItemsSource] = await Promise.all([
  readFile(new URL('app/(site)/works/page.jsx', root), 'utf8'),
  readFile(new URL('app/(site)/sites/page.jsx', root), 'utf8'),
  readFile(new URL('lib/workItems.js', root), 'utf8'),
])

test('portfolio contains products and works without duplicating the tools directory', () => {
  assert.match(worksSource, /title: '独立产品'/)
  assert.match(worksSource, /title: '作品与实验'/)
  assert.match(worksSource, /PRODUCT_WORK_ITEMS/)
  assert.match(worksSource, /SECONDARY_SITES/)
  assert.doesNotMatch(worksSource, /TOOL_ITEMS|title: '站内工具'/)
})

test('individual OpenClaw pull requests are not listed as portfolio products', () => {
  assert.doesNotMatch(workItemsSource, /openclaw-pr-90517|OpenClaw PR #90517/)
})

test('every public subsite can enter the product portfolio', () => {
  assert.ok(SECONDARY_SITES.length > 0)
  assert.ok(SECONDARY_SITES.every((site) => site.domain.endsWith('.2aran.com')))
})

test('interactive and tool directories have exclusive primary entries', () => {
  const interactiveHrefs = new Set(INTERACTIVE_DIRECTORY_WORKS.map((item) => item.href))
  const overlaps = TOOL_ITEMS.filter((tool) => interactiveHrefs.has(tool.href))
  assert.deepEqual(overlaps, [])

  for (const href of ['/skill-center', '/mcp-center', '/prompt-center', '/workbuddy-publish-center']) {
    assert.ok(!TOOL_ITEMS.some((tool) => tool.href === href), `${href} belongs to products`)
  }
  for (const href of ['/resources/wallpapers', '/bookmarks/ai-tools', '/bookmarks/dev-resources']) {
    assert.ok(!TOOL_ITEMS.some((tool) => tool.href === href), `${href} belongs to content`)
  }
})

test('legacy sites directory redirects to works and is absent from the sitemap', () => {
  assert.match(sitesSource, /permanentRedirect\('\/works'\)/)
  assert.ok(!STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/sites' && entry.sitemap))
})

test('tools directory uses compact catalog cards while the portfolio keeps gallery posters', async () => {
  const [toolsSource, directorySource] = await Promise.all([
    readFile(new URL('app/(site)/tools/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/components/ShowcaseDirectory.jsx', root), 'utf8'),
  ])
  assert.match(toolsSource, /layout: 'catalog'/)
  assert.match(toolsSource, /categoryTabs: true/)
  assert.match(worksSource, /categoryTabs: true/)
  assert.doesNotMatch(worksSource, /layout: 'catalog'/)
  assert.match(directorySource, /layout === 'catalog'/)
  assert.match(directorySource, /h-8 w-8/)
  assert.match(directorySource, /xl:grid-cols-4/)
  assert.match(directorySource, /sm:grid-cols-2 lg:grid-cols-3/)
  assert.match(directorySource, /role="tablist"/)
  assert.match(directorySource, /aria-selected=\{active\}/)
})

test('capabilities reuse the compact directory and keep the four former centers reachable', async () => {
  const [source, hero] = await Promise.all([
    readFile(new URL('app/(site)/capabilities/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/components/AgentCenterHero.jsx', root), 'utf8'),
  ])
  assert.match(source, /layout: 'catalog'/)
  assert.match(source, /categoryTabs: true/)
  for (const path of ['/skill-center', '/mcp-center', '/prompt-center', '/workbuddy-publish-center']) {
    assert.ok(source.includes(`href: '${path}'`))
  }
  assert.match(hero, /href="\/capabilities"/)
  assert.match(hero, /aria-label="Agent 能力中心"/)
  assert.match(hero, /aria-current=\{current === href \? 'page'/)
  assert.ok(STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/capabilities' && entry.sitemap))
})

test('capability pages use a public-facing product layout with direct actions', async () => {
  const names = [
    'skill-center', 'mcp-center', 'prompt-center', 'workbuddy-publish-center',
  ]
  const pages = await Promise.all(names.map((name) => readFile(new URL(`app/(site)/${name}/page.jsx`, root), 'utf8')))
  const experiences = await Promise.all([
    'skill-center/SkillCenterExperience.jsx',
    'mcp-center/McpCatalog.jsx',
    'prompt-center/PromptCatalog.jsx',
    'workbuddy-publish-center/WorkBuddyCatalog.jsx',
  ].map((path) => readFile(new URL(`app/(site)/${path}`, root), 'utf8')))

  for (const page of pages) {
    assert.doesNotMatch(page, /divide-y divide-\[#d8d7cf\]/)
  }
  assert.match(experiences[0], /id="skill-catalog"/)
  for (const page of pages.slice(1)) assert.match(page, /<AgentCenterHero/)
  for (const experience of experiences.slice(1)) {
    assert.match(experience, /id="items"/)
    assert.match(experience, /rounded-2xl/)
    assert.match(experience, /AgentCenterControls/)
    assert.match(experience, /AgentCenterEmpty/)
  }
  assert.match(experiences[0], /查看详情|打开/)
  assert.match(experiences[1], /McpConfigActions/)
  assert.match(experiences[2], /PromptCopyButton/)
  assert.match(experiences[3], /下载 ZIP/)
  assert.doesNotMatch(pages[3], /readiness:\s*'\d+%'|标准上架流程|需要准备的材料/)
})
