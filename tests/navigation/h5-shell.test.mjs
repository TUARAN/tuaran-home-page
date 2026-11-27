import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [navSource, chromeSource, headerSource, pageSource, layoutSource, swSource, manifestSource, settingsControlsSource] = await Promise.all([
  readFile(new URL('../../lib/site/siteMobileNav.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/LayoutChromeControls.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/layout.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../public/sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../../public/site.webmanifest', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/SiteSettingsControls.jsx', import.meta.url), 'utf8'),
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

function mobileDrawerStack(source) {
  const start = source.indexOf('site-mobile-drawer-stack')
  assert.ok(start > 0, 'missing mobile drawer stack')
  const end = source.indexOf('</div>\n      </div>\n    </>', start)
  assert.ok(end > start, 'missing mobile drawer end')
  return source.slice(start, end)
}

test('H5 drawer orders search, account, picks, channels, core topics, settings, and RSS', () => {
  const drawer = mobileDrawerStack(headerSource)
  const markers = [
    'site-mobile-drawer-search-field',
    '<SiteSearch mobile',
    '<MobileAccountPanel',
    'HEADER_RECOMMENDATIONS.map',
    "pick(locale, '频道', 'Channels')",
    '<AuthorityDrawerLinks',
    '<SiteSettingsControls',
    '<MobileDrawerRssBlock',
  ]
  let last = -1
  for (const marker of markers) {
    const idx = drawer.indexOf(marker)
    assert.ok(idx > last, `expected ${marker} later in the drawer`)
    last = idx
  }
  const accountPanel = headerSource.match(/function MobileAccountPanel[\s\S]*?^}/m)?.[0] ?? ''
  assert.doesNotMatch(accountPanel, /href="\/resources\/rss"/)
})

test('H5 folds display settings into the drawer and keeps a home Codex reset entry', () => {
  // 右上角 < xl 不再单独摆设置图标；桌面 xl 区块仍保留 SettingsButton
  assert.doesNotMatch(headerSource, /<div className="xl:hidden"><SettingsButton \/>/)
  assert.match(headerSource, /<SettingsButton \/>/)
  // 完整设置控件收进汉堡菜单抽屉
  assert.match(headerSource, /site-mobile-drawer[\s\S]*<SiteSettingsControls \/>/)
  assert.match(headerSource, /显示设置/)
  assert.match(headerSource, /site-mobile-shortcut-row/)
  assert.match(headerSource, /site-mobile-picks/)
  assert.doesNotMatch(headerSource, /pathname !== '\/' \? <div className="border-t/)
  assert.match(settingsControlsSource, /pick\(locale, '语言', 'Language'\)/)
  assert.match(settingsControlsSource, /pick\(locale, '主题', 'Theme'\)/)
  assert.match(settingsControlsSource, /首页背景/)
  // H5 信息流补 Codex 重置入口，桌面已有侧栏卡片，不重复
  assert.match(pageSource, /className="home-masonry-item lg:hidden"[\s\S]{0,400}home-codex-reset-mobile-entry/)
  assert.match(pageSource, /href=\{CODEX_RESET_PATH\}/)
  assert.match(pageSource, /<HomeCodexResetCard/)
})
