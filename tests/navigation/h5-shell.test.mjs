import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [navSource, chromeSource, headerSource, pageSource, layoutSource, swSource, manifestSource] = await Promise.all([
  readFile(new URL('../../lib/site/siteMobileNav.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/LayoutChromeControls.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/layout.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../public/sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../../public/site.webmanifest', import.meta.url), 'utf8'),
])

test('H5 tab bar covers the five high-frequency destinations', () => {
  assert.match(navSource, /export const SITE_MOBILE_TABS = \[/)
  assert.match(navSource, /key: 'home'[\s\S]*href: '\/'/)
  assert.match(navSource, /key: 'content'[\s\S]*href: '\/articles'/)
  assert.match(navSource, /key: 'tools'[\s\S]*href: '\/tools'/)
  assert.match(navSource, /key: 'community'[\s\S]*href: '\/circles'/)
  assert.match(navSource, /key: 'me'[\s\S]*href: '\/account'/)
  assert.match(navSource, /systemsChannel/)
  const tabKeys = [...navSource.matchAll(/key: '(home|content|tools|community|me)'/g)].map((match) => match[1])
  assert.deepEqual(tabKeys, ['home', 'content', 'tools', 'community', 'me'])
})

test('H5 home keeps feed-first layout without webpage entry bars', () => {
  assert.doesNotMatch(navSource, /HOME_MOBILE_CHANNELS|HOME_MOBILE_SHORTCUTS/)
  assert.doesNotMatch(pageSource, /HOME_MOBILE_CHANNELS|HomeMobileDirectory|home-mobile-directory|HomeQuickNav|首页快捷入口/)
  assert.match(pageSource, /home-side-stack hidden lg:block/)
  assert.match(chromeSource, /SiteMobileTabBar/)
  assert.doesNotMatch(navSource, /本站为什么|接下来/)
})

test('site chrome mounts the mobile tab bar and add-to-home guide', () => {
  assert.match(chromeSource, /SiteMobileTabBar/)
  assert.match(chromeSource, /PwaInstallGuide/)
  assert.match(headerSource, /SiteSearch mobile/)
  assert.match(headerSource, /openInstallGuide/)
  assert.match(pageSource, /home-side-stack hidden lg:block/)
  assert.match(layoutSource, /viewportFit: 'cover'/)
  assert.match(layoutSource, /appleWebApp/)
  assert.match(swSource, /addEventListener\('fetch'/)
  assert.match(manifestSource, /"display": "standalone"/)
  assert.match(manifestSource, /"short_name": "2aran"/)
})

test('standalone pages hide the site header', () => {
  assert.match(chromeSource, /HIDE_HEADER_PATHS = new Set\(\['\/spacex', '\/tools\/workbuddy-acp-bridge'\]\)/)
  assert.match(chromeSource, /isOnchainBlogPath/)
  assert.match(chromeSource, /HIDE_HEADER_PATHS\.has\(pathname\) \|\| isOnchainBlogPath\(pathname\)/)
  assert.doesNotMatch(chromeSource, /bookmark-nav|BOOKMARKS_HOST/)
})
