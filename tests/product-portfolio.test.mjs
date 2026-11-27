import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { SECONDARY_SITES } from '../lib/site/secondarySites.js'
import { STATIC_PAGE_REGISTRY } from '../lib/site/staticPageRegistry.mjs'
import { INTERACTIVE_DIRECTORY_WORKS } from '../lib/site/engineeringWorks.js'
import { getToolItemsByDate, TOOL_ITEMS } from '../lib/site/toolItems.js'

const root = new URL('../', import.meta.url)
const [worksSource, sitesSource, workItemsSource] = await Promise.all([
  readFile(new URL('app/(site)/works/page.jsx', root), 'utf8'),
  readFile(new URL('app/(site)/sites/page.jsx', root), 'utf8'),
  readFile(new URL('lib/site/workItems.js', root), 'utf8'),
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

test('tools default to newest-first order', () => {
  assert.ok(TOOL_ITEMS.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.updatedAt)))
  const dates = getToolItemsByDate().map((item) => item.updatedAt)
  assert.deepEqual(dates, [...dates].sort((a, b) => b.localeCompare(a)))
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
  assert.match(directorySource, /<time dateTime=\{item\.updatedAt\}>更新于 \{item\.updatedAt\}<\/time>/)
  assert.match(directorySource, /aria-selected=\{active\}/)
})

test('capabilities use the Skill Center experience', async () => {
  const [source, hubSource] = await Promise.all([
    readFile(new URL('app/(site)/capabilities/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/skill-center/page.jsx', root), 'utf8'),
  ])
  assert.match(source, /SkillCenterExperience/)
  assert.match(source, /hubHref="\/skill-center"/)
  assert.match(hubSource, /AgentApplicationCenterExperience/)
  assert.match(hubSource, /title: '智能应用中心'/)
  assert.ok(STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/capabilities' && entry.sitemap))
})

test('legacy center routes redirect into the agent application hub', async () => {
  const [mcpPage, promptPage, workbuddyPage, hubExperience] = await Promise.all([
    readFile(new URL('app/(site)/mcp-center/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/prompt-center/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/workbuddy-publish-center/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/skill-center/AgentApplicationCenterExperience.jsx', root), 'utf8'),
  ])
  assert.match(mcpPage, /RedirectToAgentHub/)
  assert.match(promptPage, /fallbackHash="#prompt"/)
  assert.match(workbuddyPage, /fallbackHash="#workbuddy"/)
  assert.match(hubExperience, /id="mcp"/)
  assert.match(hubExperience, /id="prompt"/)
  assert.match(hubExperience, /id="workbuddy"/)
})

test('embedded agent catalogs keep actionable controls', async () => {
  const experiences = await Promise.all([
    'mcp-center/McpCatalog.jsx',
    'prompt-center/PromptCatalog.jsx',
    'workbuddy-publish-center/WorkBuddyCatalog.jsx',
  ].map((path) => readFile(new URL(`app/(site)/${path}`, root), 'utf8')))

  assert.match(experiences[0], /McpConfigActions/)
  assert.match(experiences[1], /PromptCopyButton/)
  assert.match(experiences[2], /下载 ZIP/)
})