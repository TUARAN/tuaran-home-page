import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  CONTACT_CHANNELS,
  CONTACT_PAGE_PATH,
  WECHAT_CONTACT,
  getContactChannel,
  listContactChannels,
  listContactSameAs,
  listProfileLinks,
} from '../lib/site/contactChannels.js'
import { listStaticPageSitemapEntries } from '../lib/site/staticPageRegistry.mjs'
import { COMMUNITY_MEMBERSHIP } from '../lib/auth/communityMembership.js'

const root = new URL('../', import.meta.url)

async function source(path) {
  return readFile(new URL(path, root), 'utf8')
}

test('contact channels keep WeChat first and leave payment codes out', async () => {
  assert.equal(CONTACT_PAGE_PATH, '/contact')
  assert.equal(WECHAT_CONTACT.value, 'atar24')
  assert.equal(WECHAT_CONTACT.primary, true)
  assert.equal(WECHAT_CONTACT.qr, '/qrcodewechat3.png')
  assert.equal(CONTACT_CHANNELS.filter((item) => item.primary).length, 1)
  assert.equal(getContactChannel('email').value, 'tuaran666@gmail.com')
  assert.equal(getContactChannel('github').href, 'https://github.com/TUARAN')
  assert.deepEqual(listProfileLinks().map((item) => item.label), ['掘金', '小红书', 'CSDN', '51CTO', 'GitHub', '领英'])
  assert.deepEqual(listContactSameAs(), [
    'https://github.com/TUARAN',
    'https://www.linkedin.com/in/%E6%B6%82%E9%98%BF%E7%87%83-tuaran-473841210/',
    'https://juejin.cn/user/1521379823340792',
    'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e',
    'https://blog.csdn.net/aifs2025',
    'https://blog.51cto.com/u_15298598',
  ])
  const serialized = JSON.stringify(CONTACT_CHANNELS)
  assert.doesNotMatch(serialized, /donate|收款|赞助|\/ranbi/)
  assert.deepEqual(listContactChannels('direct').map((item) => item.id), ['wechat', 'email', 'github'])
  await access(new URL(`../public${WECHAT_CONTACT.qr}`, import.meta.url))
})

test('navigation points at the contact page without adding a top-level channel', async () => {
  const nav = await source('lib/site/siteNav.js')
  const channelKeys = nav.match(/key: '(content|tools|systems|community|checkin|about)'/g) || []
  assert.deepEqual(channelKeys, [
    "key: 'content'",
    "key: 'tools'",
    "key: 'systems'",
    "key: 'community'",
    "key: 'checkin'",
    "key: 'about'",
  ])
  assert.match(nav, /href: '\/about'[\s\S]{0,240}href: '\/contact', label: '联系'/)
  assert.doesNotMatch(nav, /key: 'contact'/)
  assert.match(nav, /href: '\/contact', label: '联系'[\s\S]{0,180}dialog: true/)
  const nextConfig = await source('next.config.js')
  assert.doesNotMatch(nextConfig, /source:\s*'\/contact'/)
  const sitemap = listStaticPageSitemapEntries().map((entry) => entry.url)
  assert.ok(sitemap.includes('https://2aran.com/contact'))
  assert.equal(COMMUNITY_MEMBERSHIP.wechatId, WECHAT_CONTACT.value)
  assert.equal(COMMUNITY_MEMBERSHIP.paymentQr, '/donate-wechat.jpg')
})

test('scattered entries reuse the dialog or the contact page', async () => {
  const footer = await source('app/(site)/components/SiteFooter.jsx')
  const circles = await source('app/(site)/circles/page.jsx')
  const about = await source('app/(site)/about/page.jsx')
  const articles = await source('app/(site)/components/ArticleFooterCta.jsx')
  const home = await source('app/(site)/page.jsx')
  const services = await source('app/(site)/services/page.jsx')
  const page = await source('app/(site)/contact/page.jsx')

  assert.match(footer, /link\.dialog/)
  assert.match(footer, /ContactDialogButton/)
  assert.match(circles, /ContactDialogButton/)
  assert.match(circles, /联系站长/)
  assert.match(about, /listProfileLinks\(/)
  assert.match(about, /ContactDialogButton/)
  assert.match(articles, /ContactDialogButton/)
  assert.match(home, /ContactDialogButton/)
  assert.match(services, /<ContactCards/)
  assert.doesNotMatch(services, /donate-wechat/)
  assert.match(page, /<ContactCards/)
  assert.match(page, /canonical: CONTACT_PAGE_PATH/)
  assert.match(page, /application\/ld\+json/)
})
