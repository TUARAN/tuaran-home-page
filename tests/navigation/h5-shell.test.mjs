import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [navSource, chromeSource, headerSource, pageSource, layoutSource, swSource, manifestSource] = await Promise.all([
  readFile(new URL('../../lib/siteMobileNav.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/LayoutChromeControls.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/layout.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../public/sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../../public/site.webmanifest', import.meta.url), 'utf8'),
])

test('H5 tab bar covers the five high-frequency destinations', () => {
  const tabsBlock = navSource.slice(navSource.indexOf('SITE_MOBILE_TABS'), navSource.indexOf('HOME_MOBILE_CHANNELS'))
  assert.match(tabsBlock, /key: 'home'[\s\S]*href: '\/'/)
  assert.match(tabsBlock, /key: 'content'[\s\S]*href: '\/articles'/)
  assert.match(tabsBlock, /key: 'tools'[\s\S]*href: '\/tools'/)
  assert.match(tabsBlock, /key: 'community'[\s\S]*href: '\/community'/)
  assert.match(tabsBlock, /key: 'me'[\s\S]*href: '\/account'/)
  assert.match(tabsBlock, /systemsChannel/)
  const tabKeys = [...tabsBlock.matchAll(/key: '(home|content|tools|community|me)'/g)].map((match) => match[1])
  assert.deepEqual(tabKeys, ['home', 'content', 'tools', 'community', 'me'])
})

test('home mobile channels stay on reading destinations', () => {
  assert.match(navSource, /href: '\/#articles'[\s\S]*label: '推荐'/)
  assert.match(navSource, /href: '\/frontend-weekly'[\s\S]*label: '周看'/)
  assert.match(navSource, /href: '\/a-share-research'[\s\S]*label: 'A股'/)
  assert.doesNotMatch(navSource, /本站为什么|接下来/)
})

test('site chrome mounts the mobile tab bar and add-to-home guide', () => {
  assert.match(chromeSource, /SiteMobileTabBar/)
  assert.match(chromeSource, /PwaInstallGuide/)
  assert.match(headerSource, /site-mobile-search/)
  assert.match(headerSource, /openInstallGuide/)
  assert.match(pageSource, /HOME_MOBILE_CHANNELS/)
  assert.match(pageSource, /home-side-stack hidden lg:block/)
  assert.match(layoutSource, /viewportFit: 'cover'/)
  assert.match(layoutSource, /appleWebApp/)
  assert.match(swSource, /addEventListener\('fetch'/)
  assert.match(manifestSource, /"display": "standalone"/)
  assert.match(manifestSource, /"short_name": "2aran"/)
})
