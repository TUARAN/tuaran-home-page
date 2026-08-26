import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  ARTICLE_DISTRIBUTION_PLATFORMS,
  normalizeArticleDistributionPlatformIds,
  resolveArticleDistributionAccounts,
} from '../lib/articleDistribution.js'

test('文章分发首期只开放约定的六个平台', () => {
  assert.deepEqual(
    ARTICLE_DISTRIBUTION_PLATFORMS.map((platform) => platform.id),
    ['twitter', 'juejin', 'xiaohongshu', 'csdn', 'zhihu', 'toutiao'],
  )
  assert.deepEqual(
    normalizeArticleDistributionPlatformIds(['twitter', 'unknown', 'csdn', 'twitter']),
    ['twitter', 'csdn'],
  )
})

test('只把插件已声明的平台解析为已勾选账号', () => {
  const accounts = resolveArticleDistributionAccounts([
    { uid: 'twitter', type: 'twitter', title: 'X Articles' },
    { uid: 'csdn', type: 'csdn', title: 'CSDN' },
    { uid: 'wechat', type: 'wechat', title: '微信公众号' },
  ], ['twitter', 'csdn', 'zhihu'])
  assert.deepEqual(accounts.map((account) => account.uid), ['twitter', 'csdn'])
  assert.ok(accounts.every((account) => account.checked === true))
})

test('后台自动化工作区和导航都登记文章一键分发', async () => {
  const [workspace, routes, page, articleRoute] = await Promise.all([
    readFile(new URL('../app/(admin)/admin/automation/AutomationWorkspace.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/adminRoutes.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/(admin)/admin/article-distribution/ArticleDistributionClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/admin/article-distribution/article/route.js', import.meta.url), 'utf8'),
  ])
  for (const source of [workspace, routes]) assert.match(source, /\/admin\/article-distribution/)
  assert.match(page, /window\.\$cose\.addTask/)
  assert.match(page, /草稿模式/)
  assert.match(page, /不会自动点击平台的“发布”按钮/)
  assert.match(articleRoute, /getOwnerOrReject/)
  assert.match(articleRoute, /\^\\\/articles\\\//)
})
