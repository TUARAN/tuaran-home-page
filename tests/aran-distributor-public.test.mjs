import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('阿燃分发智能体公开页与文章访客按钮', async () => {
  const [landing, guestButton, published] = await Promise.all([
    read('../app/(site)/tools/aran-distributor/page.jsx'),
    read('../app/(site)/components/ArticleGuestDistributeButton.jsx'),
    read('../app/(site)/articles/[slug]/PublishedArticle.jsx'),
  ])
  assert.match(landing, /阿燃分发智能体/)
  assert.match(landing, /\/skill-center\/2aran-distributor/)
  assert.match(landing, /legacy-plugin/)
  assert.match(landing, /openGraph/)
  assert.match(landing, /application\/ld\+json/)
  assert.match(guestButton, /buildGuestDistributionTaskPrompt/)
  assert.match(published, /ArticleGuestDistributeButton/)
})

test('公开 SKILL 下载 API 从 harness 构建正文', async () => {
  const route = await read('../app/api/resources/aran-distributor-skill/route.js')
  assert.match(route, /buildDistributorSkill/)
  assert.match(route, /GET/)
})