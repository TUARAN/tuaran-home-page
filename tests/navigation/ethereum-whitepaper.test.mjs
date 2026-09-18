import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { HOME_RESOURCE_ITEMS } from '../../lib/homeResourceItems.js'
import { getResourceDocument, loadResourceMarkdown } from '../../lib/resourceDocuments.js'
import { buildEthereumWhitepaperArticle } from '../../lib/resourceMarkdown.js'
import { STATIC_PAGE_REGISTRY } from '../../lib/staticPageRegistry.mjs'

const ROOT = process.cwd()
const ASSET_DIR = path.join(ROOT, 'public', 'resources', 'ethereum-whitepaper')

const EXPECTED_CHAPTERS = [
  '新一代智能合约和去中心化应用平台',
  '比特币和现有概念介绍',
  '以太坊',
  '应用程序',
  '杂项与关注点',
  '结论',
  '注释与延伸阅读',
]

test('ethereum whitepaper is registered as an indexable resource', () => {
  const resource = HOME_RESOURCE_ITEMS.find((item) => item.href === '/resources/ethereum-whitepaper')
  assert.ok(resource)
  assert.match(resource.title, /以太坊白皮书/)
  assert.equal(resource.subjects[0], 'web3')
  assert.match(
    fs.readFileSync(path.join(ROOT, 'lib', 'contentRegistry.js'), 'utf8'),
    /slug: 'ethereum-whitepaper'/,
  )
  assert.ok(
    STATIC_PAGE_REGISTRY.some((page) => page.path === '/resources/ethereum-whitepaper' && page.sitemap),
  )
})

test('ethereum whitepaper renders local images, PDF, and a complete table of contents', () => {
  const doc = getResourceDocument('ethereum-whitepaper')
  assert.equal(doc.author, 'Vitalik Buterin')
  assert.equal(doc.pdfHref, '/resources/ethereum-whitepaper/Ethereum_Whitepaper_Buterin_2014.pdf')
  assert.equal(
    fs.existsSync(path.join(ROOT, doc.markdownFile)),
    true,
  )
  assert.equal(fs.existsSync(path.join(ASSET_DIR, 'Ethereum_Whitepaper_Buterin_2014.pdf')), true)

  const article = buildEthereumWhitepaperArticle(loadResourceMarkdown('ethereum-whitepaper'))
  const chapters = article.toc.filter((item) => item.depth === 2).map((item) => item.text)
  const sections = article.toc.filter((item) => item.depth === 3)

  assert.deepEqual(chapters, EXPECTED_CHAPTERS)
  assert.ok(sections.length >= 20, `expected 20+ subsections, got ${sections.length}`)
  assert.match(article.html, /id="比特币和现有概念介绍"/)
  assert.match(article.html, /id="以太坊账户"/)
  assert.match(article.html, /src="\/resources\/ethereum-whitepaper\/ethereum-state-transition\.png"/)
  assert.match(article.html, /src="\/resources\/ethereum-whitepaper\/spv-bitcoin\.png"/)
  assert.doesNotMatch(article.html, /\.\/ethereum-state-transition/)
  assert.doesNotMatch(article.html, /\]\(\/learn\/\)/)
})

test('ethereum whitepaper landing toc is a compact numbered list, not a card grid', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'app/(site)/resources/ethereum-whitepaper/page.jsx'),
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
