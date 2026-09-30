import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { readFile, stat } from 'node:fs/promises'
import { promisify } from 'node:util'

import {
  ARTICLE_DISTRIBUTION_PLATFORMS,
  normalizeArticleDistributionPlatformIds,
  resolveArticleDistributionAccounts,
} from '../lib/articleDistribution.js'

const execFileAsync = promisify(execFile)

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

test('后台内容工作区和导航都登记文章分发', async () => {
  const [workspace, routes, page, articleRoute] = await Promise.all([
    readFile(new URL('../app/(admin)/admin/content/ContentCenter.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/adminRoutes.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/(admin)/admin/article-distribution/ArticleDistributionClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/admin/article-distribution/article/route.js', import.meta.url), 'utf8'),
  ])
  assert.match(workspace, /getWorkspaceHubProps\('\/admin\/content'\)/)
  assert.match(routes, /\/admin\/article-distribution/)
  assert.match(page, /window\.\$cose\.addTask/)
  assert.match(page, /草稿模式/)
  assert.match(page, /2aran-article-distributor-extension-v1\.3\.7\.zip/)
  assert.match(page, /下载 Chrome 插件/)
  assert.match(page, /插件需更新/)
  assert.match(page, /当前页面需要 v\$\{EXTENSION_VERSION\} 或更高版本/)
  assert.match(page, /detectPlugin\(\{ reloadIfMissing: true \}\)/)
  assert.match(page, /window\.location\.reload\(\)/)
  assert.match(page, /不会自动点击平台的“发布”按钮/)
  assert.match(articleRoute, /getOwnerOrReject/)
  assert.match(articleRoute, /\^\\\/articles\\\//)
})

test('自动化页面提供版本一致且包含 X 表格兼容修复的 Chrome 扩展包', async () => {
  const archive = new URL('../public/downloads/2aran-article-distributor-extension-v1.3.7.zip', import.meta.url)
  const info = await stat(archive)
  const header = await readFile(archive).then((buffer) => buffer.subarray(0, 4).toString('hex'))
  assert.ok(info.size > 100_000)
  assert.equal(header, '504b0304')

  const [{ stdout: manifestSource }, { stdout: injectSource }, { stdout: backgroundSource }] = await Promise.all([
    execFileAsync('unzip', ['-p', archive.pathname, 'manifest.json'], { encoding: 'utf8' }),
    execFileAsync('unzip', ['-p', archive.pathname, 'bundles/inject.js'], { encoding: 'utf8' }),
    execFileAsync('unzip', ['-p', archive.pathname, 'bundles/background.js'], { encoding: 'utf8', maxBuffer: 2_000_000 }),
  ])
  assert.equal(JSON.parse(manifestSource).version, '1.3.7')
  assert.match(injectSource, /version: "1\.3\.7"/)
  assert.doesNotMatch(injectSource, /version: "1\.1\.0"/)
  assert.match(backgroundSource, /normalizeMarkdownTables/)
  assert.match(backgroundSource, /Twitter Articles 写入失败/)
})

test('文章分发页区分 X 平台能力、模型兼容格式和普通 Post', async () => {
  const page = await readFile(
    new URL('../app/(admin)/admin/article-distribution/ArticleDistributionClient.jsx', import.meta.url),
    'utf8',
  )

  assert.match(page, /富文本是平台能力；纯文本是兼容策略/)
  assert.match(page, /X Articles（当前分发目标）/)
  assert.match(page, /不要输出 Markdown 表格/)
  assert.match(page, /字段：内容/)
  assert.match(page, /普通 Post 上限 280 字符/)
  assert.match(page, /Premium 长 Post 上限 25,000 字符/)
  assert.match(page, /按 23 个字符计入 Post 字数/)
  assert.match(page, /正文图片由插件上传到 X/)
})
