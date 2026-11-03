import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [nav, header, page, authority] = await Promise.all([
  readFile(new URL('../../lib/site/siteNav.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../lib/home/homeAuthority.js', import.meta.url), 'utf8'),
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
    '/publications',
    '/about#openclaw-contributions',
    '/editorial',
  ]) {
    assert.match(authorityBlock, new RegExp(`href: '${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`))
  }
  assert.match(nav, /label: '主线'/)
  assert.match(header, /<nav ref=\{navWrapRef\}[\s\S]*<AuthorityMenu/)
  assert.match(header, /id="site-authority-menu"/)
  assert.match(header, /<AuthorityDrawerLinks/)
  assert.match(header, /site-mobile-authority-link/)
  assert.doesNotMatch(header, /function AuthorityDrawerLinks[\s\S]*flex flex-wrap gap-1/)
  assert.match(header, /<WeChatContact tone="panel"/)
  assert.match(page, /<FestivalBanner \/>\s*<HomeMasonry>/)
  assert.doesNotMatch(page, /HomeAuthorityBar|站长与主线/)
  assert.match(authority, /export function homeContentLine/)
  assert.match(authority, /HOME_LINE_BONUS/)
  assert.match(authority, /HOME_OBSERVATION_ENTRY_LINKS/)
})
