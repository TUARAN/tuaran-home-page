import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { resolveAdminTrail } from '../lib/admin/adminRoutes.js'
import { DISTRIBUTION_AGENT_PLATFORM_IDS } from '../lib/distribution/playbooks.js'
import { DISTRIBUTION_PLATFORMS } from '../lib/distribution/platforms.js'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('分发智能体入口在 内容 → 分发与触达，页面不再依赖浏览器插件', async () => {
  assert.deepEqual(resolveAdminTrail('/admin/article-distribution').map((item) => item.label), ['内容', '分发智能体'])
  const [page, routes] = await Promise.all([
    read('../app/(admin)/admin/article-distribution/ArticleDistributionClient.jsx'),
    read('../lib/admin/adminRoutes.js'),
  ])
  assert.match(routes, /href: '\/admin\/article-distribution', label: '分发智能体'/)
  assert.doesNotMatch(page, /\$cose|EXTENSION_VERSION|article-distributor-extension/)
  assert.match(page, /title="分发智能体"/)
  assert.match(page, /npm run distributor:skill:install/)
  assert.match(page, /action: 'create'/)
  assert.match(page, /buildDistributionClaimPrompt/)
  assert.match(page, /待实测/)
  assert.match(page, /<DistributionJobsPanel/)
})

test('只有带实测手册的平台可以建任务', () => {
  const registered = new Set(DISTRIBUTION_PLATFORMS.map((platform) => platform.id))
  assert.ok(DISTRIBUTION_AGENT_PLATFORM_IDS.length > 0)
  for (const id of DISTRIBUTION_AGENT_PLATFORM_IDS) assert.ok(registered.has(id), `${id} 未登记在平台注册表`)
  assert.ok(DISTRIBUTION_PLATFORMS.every((platform) => !('articleDistribution' in platform)))
})

test('后台任务台接口支持站长建任务，读取文章页接口只接受 /articles/ 路径', async () => {
  const [jobsRoute, articleRoute] = await Promise.all([
    read('../app/api/admin/distribution-jobs/route.js'),
    read('../app/api/admin/article-distribution/article/route.js'),
  ])
  assert.match(jobsRoute, /getOwnerOrReject/)
  assert.match(jobsRoute, /action === 'create'/)
  assert.match(jobsRoute, /createDistributionJob\(db, body/)
  assert.match(jobsRoute, /status: 201/)
  assert.match(articleRoute, /getOwnerOrReject/)
  assert.match(articleRoute, /\^\\\/articles\\\//)
})

test('公开文章页站长工具只有一个合并后的文章分发按钮', async () => {
  const [articlePage, researchPage, published] = await Promise.all([
    read('../app/(site)/articles/[slug]/page.jsx'),
    read('../app/(site)/articles/research/[category]/[slug]/page.jsx'),
    read('../app/(site)/articles/[slug]/PublishedArticle.jsx'),
  ])
  for (const source of [articlePage, researchPage, published]) {
    assert.match(source, /ArticleDistributeButton/)
    assert.doesNotMatch(source, /EgoPublishButton/)
    assert.doesNotMatch(source, /DistributeContentButton|DistributeMarkdownButton/)
  }
})

test('文章转 Markdown 输出 GFM 表格并保留代码语言', async () => {
  const source = await read('../app/(admin)/admin/article-distribution/articleMarkdown.js')
  assert.match(source, /Array\(width\)\.fill\('---'\)/)
  assert.match(source, /language-\(\[\\w\+#-\]\+\)/)
  assert.doesNotMatch(source, /' ｜ '/)
})

test('社区动作不再列站内文章分发插件，AI 分发大师冻结', async () => {
  const communityActions = await read('../app/(admin)/admin/community-actions/CommunityActionsClient.jsx')
  assert.doesNotMatch(communityActions, /站内文章分发插件/)
  assert.doesNotMatch(communityActions, /id: 'article-distribution'/)
  assert.match(communityActions, /冻结维护，只修 bug/)
  assert.match(communityActions, /href="\/admin\/article-distribution"/)
})
