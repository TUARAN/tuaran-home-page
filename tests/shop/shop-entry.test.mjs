import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { SHOP_ITEMS, SHOP_PATH, findShopItem, listShopItems } from '../../lib/shop/shopCatalog.js'
import { STATIC_PAGE_REGISTRY, getStaticPage } from '../../lib/site/staticPageRegistry.mjs'

const repoRoot = new URL('../..', import.meta.url)
const siteHeaderSource = await readFile(new URL('app/(site)/components/SiteHeader.jsx', repoRoot), 'utf8')
const globalsCss = await readFile(new URL('app/globals.css', repoRoot), 'utf8')
const shopPageSource = await readFile(new URL('app/(site)/shop/page.jsx', repoRoot), 'utf8')

test('shop catalog: ChatGPT recharge first, Claude recharge via Wokey second', () => {
  assert.equal(SHOP_PATH, '/shop')
  assert.equal(listShopItems().length, SHOP_ITEMS.length)

  const gptplus = findShopItem('gptplus')
  assert.ok(gptplus, '缺少 ChatGPT 代充商品')
  assert.equal(gptplus.status, 'available')
  assert.match(gptplus.href, /^https:\/\/gptplus\.2aran\.com\/$/)
  assert.match(gptplus.title, /ChatGPT/)
  assert.ok(gptplus.desc.length > 0)

  const claude = findShopItem('claude-recharge')
  assert.ok(claude, '缺少 Claude 代充商品')
  assert.equal(SHOP_ITEMS[1].id, 'claude-recharge')
  assert.equal(claude.status, 'available')
  assert.equal(claude.href, 'https://wokey.ai/r/6D1SSKHS')
  assert.equal(claude.wechat, true)
  const highlights = claude.highlights.map((highlight) => highlight.label)
  assert.ok(highlights.includes('离线可验证'))
  assert.ok(highlights.some((label) => label.includes('1:6.9')))
  assert.ok(highlights.some((label) => label.includes('微信')))
  assert.equal(findShopItem('claude-relay'), undefined, 'Claude 中转占位应已被代充商品替换')
})

test('every available shop item has a valid href; coming items stay placeholder', () => {
  for (const item of SHOP_ITEMS) {
    assert.ok(item.title && item.desc && item.tags?.length, `${item.id} 缺少文案`)
    if (item.status === 'available') {
      assert.match(item.href, /^https?:\/\//, `${item.id} 是开放商品，href 必须是绝对链接`)
    } else {
      assert.equal(item.href, null, `${item.id} 非开放商品不应带链接`)
    }
  }
})

test('site header picks include 甄选小店 with shop icon badge next to X大互动', () => {
  assert.match(siteHeaderSource, /label: '甄选小店'/)
  assert.match(siteHeaderSource, /href: '\/shop'/)
  assert.match(siteHeaderSource, /tone: 'shop'/)
  assert.match(siteHeaderSource, /icon: 'shop'/)
  assert.match(siteHeaderSource, /site-header-pick-badge/)
  assert.match(siteHeaderSource, /site-header-pick-icon/)
  // 类名必须逐字出现在源码里，避免动态拼接导致样式丢失。
  assert.match(siteHeaderSource, /'site-header-pick-shop'/)
  const pickBlock = siteHeaderSource.match(/const HEADER_RECOMMENDATIONS = \[[\s\S]*?\]/)?.[0] ?? ''
  const xIndex = pickBlock.indexOf('X大互动')
  const shopIndex = pickBlock.indexOf('甄选小店')
  assert.ok(xIndex >= 0 && shopIndex > xIndex, '甄选小店应排在 X大互动 旁边之后')
})

test('globals.css styles the shop pick tone in light and dark themes', () => {
  assert.match(globalsCss, /\.site-header-pick-shop,/)
  assert.match(globalsCss, /\.dark \.site-header-pick-shop,/)
  assert.match(globalsCss, /\.site-header-pick-icon::before/)
  assert.match(globalsCss, /\.site-header-pick-badge/)
  assert.match(globalsCss, /--pick-dot: #d9772f;/)
  assert.match(globalsCss, /--pick-badge-bg: #f7dcc4;/)
  assert.match(globalsCss, /--pick-dot: #f29a55;/)
  assert.match(globalsCss, /--pick-badge-bg: #4a2e18;/)
})

test('/shop is registered as an indexable static page', () => {
  const entry = getStaticPage('/shop')
  assert.ok(entry, 'staticPageRegistry 缺少 /shop')
  assert.equal(entry.indexable, true)
  assert.equal(entry.sitemap, true)
  assert.ok(STATIC_PAGE_REGISTRY.some((page) => page.path === '/shop' && page.sitemap))
})

test('shop page renders catalog from shopCatalog and marks placeholders', () => {
  assert.match(shopPageSource, /from ['"].*lib\/shop\/shopCatalog/)
  assert.match(shopPageSource, /canonical: SHOP_PATH/)
  assert.match(shopPageSource, /购买入口准备中/)
})

test('shop cards with a WeChat action do not nest buttons inside the card link', () => {
  assert.match(shopPageSource, /ContactDialogButton/)
  assert.match(shopPageSource, /splitActions/)
  assert.match(shopPageSource, /加微信/)
  assert.match(shopPageSource, /item\.highlights/)
})
