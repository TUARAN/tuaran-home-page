import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { SHOP_ITEMS, SHOP_PATH, findShopItem, listShopItems } from '../../lib/shop/shopCatalog.js'
import { STATIC_PAGE_REGISTRY, getStaticPage } from '../../lib/site/staticPageRegistry.mjs'

const repoRoot = new URL('../..', import.meta.url)
const siteHeaderSource = await readFile(new URL('app/(site)/components/SiteHeader.jsx', repoRoot), 'utf8')
const globalsCss = await readFile(new URL('app/globals.css', repoRoot), 'utf8')
const shopPageSource = await readFile(new URL('app/(site)/shop/page.jsx', repoRoot), 'utf8')

test('shop catalog: first item is ChatGPT recharge, second is a coming-soon placeholder', () => {
  assert.equal(SHOP_PATH, '/shop')
  assert.equal(listShopItems().length, SHOP_ITEMS.length)

  const gptplus = findShopItem('gptplus')
  assert.ok(gptplus, '缺少 ChatGPT 代充商品')
  assert.equal(gptplus.status, 'available')
  assert.match(gptplus.href, /^https:\/\/gptplus\.2aran\.com\/$/)
  assert.match(gptplus.title, /ChatGPT/)
  assert.ok(gptplus.desc.length > 0)

  const claudeRelay = findShopItem('claude-relay')
  assert.ok(claudeRelay, '缺少 Claude 中转占位商品')
  assert.equal(claudeRelay.status, 'coming')
  assert.equal(claudeRelay.href, null)
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

test('site header picks include 甄选小店 with its own tone next to X大互动', () => {
  assert.match(siteHeaderSource, /label: '甄选小店'/)
  assert.match(siteHeaderSource, /href: '\/shop'/)
  assert.match(siteHeaderSource, /tone: 'shop'/)
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
  assert.match(globalsCss, /--pick-dot: #c99a2e;/)
  assert.match(globalsCss, /--pick-dot: #d9b45c;/)
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
