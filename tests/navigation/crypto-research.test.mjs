import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('加密调研页面展示当前模板、风格与调研策略', async () => {
  const [page, client] = await Promise.all([
    readFile(new URL('../../app/(site)/crypto-research/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/crypto-research/CryptoResearchClient.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(page, /CRYPTO_RESEARCH_TEMPLATE_VERSION/)
  assert.match(page, /template\.status === 'active'/)
  assert.match(client, /当前调研模板与策略/)
  assert.match(client, /CryptoResearchSubnav/)
  assert.match(client, /active="research"/)
  assert.match(client, /<details className="group mt-7/)
  assert.doesNotMatch(client, /<details[^>]*\sopen/)
  assert.match(client, /查看模板/)
  assert.match(client, /十段式资产观察/)
  assert.match(client, /CoinGecko 美元市值前 250 名/)
  assert.match(client, /自动草稿保留 72 小时人工复核窗口/)
})

test('加密调研二级菜单提供 RSS 订阅页', async () => {
  const [nav, rssPage, subnav] = await Promise.all([
    readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/crypto-research/rss/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/crypto-research/CryptoResearchSubnav.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(nav, /href: '\/crypto-research\/rss'/)
  assert.match(rssPage, /SiteRssSubscribeCard/)
  assert.match(rssPage, /RssBlogroll/)
  assert.match(subnav, /\/crypto-research\/rss/)
  assert.match(subnav, /RSS 订阅/)
})
