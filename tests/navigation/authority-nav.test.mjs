import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [nav, header, page, authority, css, topicHub] = await Promise.all([
  readFile(new URL('../../lib/site/siteNav.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../lib/home/homeAuthority.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/globals.css', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/topics/TopicHubView.jsx', import.meta.url), 'utf8'),
])

const authorityBlock = nav.slice(
  nav.indexOf('export const SITE_AUTHORITY_LINKS'),
  nav.indexOf('export const SITE_AUTHORITY_SUMMARY'),
)

test('authority entry points live in the header menu instead of a homepage band', () => {
  assert.ok(authorityBlock.length > 0)
  for (const href of [
    '/topics/ai-agents',
    '/topics/frontend-cloud',
    '/topics/books',
    '/topics/openclaw',
    '/topics/editorial',
  ]) {
    assert.match(authorityBlock, new RegExp(`href: '${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`))
  }
  assert.match(nav, /label: '主线'/)
  assert.match(header, /<nav ref=\{navWrapRef\}[\s\S]*<AuthorityMenu/)
  assert.match(header, /site-header-nav flex shrink-0/)
  assert.match(header, /xl:hidden/)
  assert.match(header, /id="site-authority-menu"/)
  assert.match(header, /<AuthorityDrawerLinks/)
  assert.match(header, /site-mobile-authority-link/)
  assert.doesNotMatch(header, /function AuthorityDrawerLinks[\s\S]*flex flex-wrap gap-1/)
  assert.match(header, /<WeChatContact tone="panel"/)
  assert.doesNotMatch(header, /site-authority-trigger cursor-pointer bg-transparent/)
  assert.match(header, /\(isActive \|\| isOpen\) \? 'site-nav-trigger-active'/)
  assert.match(css, /button\.site-nav-trigger\.site-nav-trigger-active[\s\S]*background-color: var\(--site-ink\)/)
  assert.match(css, /button\.site-nav-trigger\.site-nav-trigger-active[\s\S]*color: var\(--page-bg\)/)
  assert.match(topicHub, /导读/)
  assert.match(topicHub, /同主线/)
  assert.match(topicHub, /内容库/)
  assert.match(topicHub, /量级/)
  assert.match(topicHub, /相关入口/)
  assert.match(topicHub, /SITE_AUTHORITY_LINKS/)
  assert.match(topicHub, /lg:grid lg:grid-cols-\[minmax\(0,1fr\)_17\.5rem\]/)
  assert.doesNotMatch(topicHub, /max-w-\[44rem\]/)
  assert.match(page, /<FestivalBanner \/>\s*<HomeMasonry>/)
  assert.doesNotMatch(page, /HomeAuthorityBar|站长与主线/)
  assert.match(authority, /export function homeContentLine/)
  assert.match(authority, /HOME_LINE_BONUS/)
  assert.match(authority, /HOME_OBSERVATION_ENTRY_LINKS/)
})
