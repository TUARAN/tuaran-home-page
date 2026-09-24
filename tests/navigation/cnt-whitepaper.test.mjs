import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { HOME_RESOURCE_ITEMS } from '../../lib/homeResourceItems.js'
import { getResourceDocument, loadResourceMarkdown } from '../../lib/resourceDocuments.js'
import { buildCntWhitepaperArticle } from '../../lib/resourceMarkdown.js'
import { STATIC_PAGE_REGISTRY } from '../../lib/staticPageRegistry.mjs'

const ROOT = process.cwd()
const DOWNLOAD = path.join(ROOT, 'public', 'resources', 'cnt-whitepaper', 'CNT-content-token-economy-whitepaper.md')

const EXPECTED_CHAPTERS = [
  '一、项目摘要',
  '二、项目定位与技术架构',
  '三、代币核心基础参数（永久锁死合约）',
  '四、通胀根治体系：双因子动态衰减模型',
  '五、行为挖矿体系：质量加权机制（杜绝无脑刷量）',
  '六、四层反女巫 / 反机器人体系（彻底解决刷量漏洞）',
  '七、代币价值闭环：销毁 + 分红 + 刚需场景（终结挖抛循环）',
  '八、DAO 去中心化治理体系（无人运维永续运行）',
  '九、生态冷启动与发展路线',
  '十、风险提示与合规声明',
  '十一、模型终极闭环总结',
  '附录 智能合约模块清单',
]

test('CNT whitepaper is registered as an indexable resource', () => {
  const resource = HOME_RESOURCE_ITEMS.find((item) => item.href === '/onchain-blog/whitepaper')
  assert.ok(resource)
  assert.match(resource.title, /CNT内容生态代币经济白皮书/)
  assert.equal(resource.subjects[0], 'web3')
  assert.match(
    fs.readFileSync(path.join(ROOT, 'lib', 'contentRegistry.js'), 'utf8'),
    /slug: 'cnt-whitepaper'/,
  )
  assert.ok(
    STATIC_PAGE_REGISTRY.some((page) => page.path === '/onchain-blog/whitepaper' && page.sitemap),
  )
})

test('CNT whitepaper includes allocation, mining, burn tables and contract modules', () => {
  const doc = getResourceDocument('cnt-whitepaper')
  assert.equal(doc.author, 'TUARAN')
  assert.equal(doc.version, 'v1.0')
  assert.equal(doc.downloadHref, '/resources/cnt-whitepaper/CNT-content-token-economy-whitepaper.md')
  assert.equal(fs.existsSync(path.join(ROOT, doc.markdownFile)), true)
  assert.equal(fs.existsSync(DOWNLOAD), true)
  assert.equal(
    fs.readFileSync(path.join(ROOT, doc.markdownFile), 'utf8'),
    fs.readFileSync(DOWNLOAD, 'utf8'),
  )

  const article = buildCntWhitepaperArticle(loadResourceMarkdown('cnt-whitepaper'))
  const chapters = article.toc.filter((item) => item.depth === 2).map((item) => item.text)
  assert.deepEqual(chapters, EXPECTED_CHAPTERS)
  assert.match(article.html, /社区生态挖矿池/)
  assert.match(article.html, /5 亿枚/)
  assert.match(article.html, /有效深度阅读/)
  assert.match(article.html, /内容置顶、作品推广/)
  assert.match(article.html, /CNTToken\.sol/)
  assert.match(article.html, /MiningPool\.sol/)
  assert.match(article.html, /VotingEscrow\.sol/)
  assert.match(article.html, /Constants\.sol/)
  assert.match(fs.readFileSync(DOWNLOAD, 'utf8'), /版本：v1\.0/)
  assert.doesNotMatch(article.html, /不发币/)
  assert.doesNotMatch(article.markdown, /不发币/)
})

test('链上作品 page keeps CNT as a separate proposal and leads with the live collection', () => {
  const blog = fs.readFileSync(path.join(ROOT, 'app/(site)/onchain-blog/page.jsx'), 'utf8')
  const paper = fs.readFileSync(path.join(ROOT, 'app/(site)/onchain-blog/whitepaper/page.jsx'), 'utf8')
  assert.match(blog, /链上作品/)
  assert.match(blog, /ONCHAIN_WORKS/)
  assert.match(blog, /中国象棋已经运行在 BNB Chain/)
  assert.match(blog, /仿照 TapeOut/)
  assert.match(blog, /CNT 白皮书保留为独立方案/)
  assert.doesNotMatch(blog, /CONTENT_LINEAGE/)
  assert.doesNotMatch(blog, /TOKEN_ALLOCATION/)
  assert.doesNotMatch(blog, /不发币/)
  assert.doesNotMatch(paper, /不发币/)
  assert.match(paper, /download=\{doc\.downloadName\}/)
  assert.match(paper, /version: VERSION/)
  assert.match(paper, /\{VERSION\} · 正式版/)
  assert.match(paper, /ResourceLongformReader/)
})
