import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { HOME_RESOURCE_ITEMS } from '../../lib/homeResourceItems.js'
import { getResourceDocument, loadResourceMarkdown } from '../../lib/resourceDocuments.js'
import { buildJianguoFanglyeArticle } from '../../lib/resourceMarkdown.js'
import { STATIC_PAGE_REGISTRY } from '../../lib/staticPageRegistry.mjs'

const ROOT = process.cwd()
const ASSET_DIR = path.join(ROOT, 'public', 'resources', 'jianguo-fanglye')

const EXPECTED_VOLUMES = [
  '第一卷：心理建设（孙文学说）',
  '第二卷：物质建设（实业计划）',
  '第三卷：社会建设（民权初步）',
]

test('jianguo fanglue is registered as an indexable resource', () => {
  const resource = HOME_RESOURCE_ITEMS.find((item) => item.href === '/resources/jianguo-fanglye')
  assert.ok(resource)
  assert.match(resource.title, /建国方略/)
  assert.equal(resource.subjects[0], 'humanities_history')
  assert.match(
    fs.readFileSync(path.join(ROOT, 'lib', 'contentRegistry.js'), 'utf8'),
    /slug: 'jianguo-fanglye'/,
  )
  assert.ok(
    STATIC_PAGE_REGISTRY.some((page) => page.path === '/resources/jianguo-fanglye' && page.sitemap),
  )
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/content-catalog.json'), 'utf8'))
  assert.ok(
    catalog.knowledgeItems.some((item) => item.href === '/resources/jianguo-fanglye'),
    'content catalog should list the resource in /articles',
  )
})

test('jianguo fanglue renders three volumes, PDF, and a complete table of contents', () => {
  const doc = getResourceDocument('jianguo-fanglye')
  assert.equal(doc.author, '孙文（孙中山）')
  assert.equal(doc.pdfHref, '/resources/jianguo-fanglye/NLC416-01jh003731-18241-jianguo-fanglye.pdf')
  assert.equal(fs.existsSync(path.join(ROOT, doc.markdownFile)), true)
  assert.equal(
    fs.existsSync(path.join(ASSET_DIR, 'NLC416-01jh003731-18241-jianguo-fanglye.pdf')),
    true,
  )
  assert.ok(
    fs.statSync(path.join(ASSET_DIR, 'NLC416-01jh003731-18241-jianguo-fanglye.pdf')).size < 25 * 1024 * 1024,
  )

  const article = buildJianguoFanglyeArticle(loadResourceMarkdown('jianguo-fanglye'))
  const volumes = article.toc.filter((item) => item.depth === 2).map((item) => item.text)
  const sections = article.toc.filter((item) => item.depth === 3).map((item) => item.text)

  assert.deepEqual(volumes, EXPECTED_VOLUMES)
  assert.ok(sections.includes('心理建设自序'))
  assert.ok(sections.includes('第一计划'))
  assert.ok(sections.includes('第三计划'))
  assert.ok(sections.includes('民权初步序'))
  assert.ok(sections.includes('第八章 有志竟成'))
  assert.match(article.html, /id="第一卷心理建设孙文学说"/)
  assert.match(article.html, /知之非艰，行之惟艰/)
  assert.match(article.html, /发展之权，操之在我则存/)
  assert.doesNotMatch(article.html, /<!--请在/)
  assert.doesNotMatch(article.html, /__TOC__/)
  assert.doesNotMatch(article.html, />TOC</)
})

test('jianguo fanglue landing toc is a compact numbered list, not a card grid', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'app/(site)/resources/jianguo-fanglye/page.jsx'),
    'utf8',
  )
  const tocBlock = source.slice(
    source.indexOf('aria-labelledby="toc-heading"'),
    source.indexOf('aria-labelledby="paper-heading"'),
  )
  assert.match(tocBlock, /aria-label="章节目录"/)
  assert.match(tocBlock, /columns-1 gap-x-16 md:columns-2/)
  assert.doesNotMatch(tocBlock, /开篇总论，无小节/)
  assert.doesNotMatch(tocBlock, /rounded-2xl/)
  assert.doesNotMatch(tocBlock, /grid-cols-2/)
})
