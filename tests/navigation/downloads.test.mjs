import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  BROWSER_EXTENSION_WORK_ITEMS,
  DESKTOP_APP_WORK_ITEMS,
  DOWNLOAD_ITEMS,
  getDownloadItemsByDate,
  getDownloadItemsByType,
} from '../../lib/downloadItems.js'
import { getLegacyPathRedirect } from '../../lib/indexingPolicy.js'
import { STATIC_PAGE_REGISTRY } from '../../lib/staticPageRegistry.mjs'

const root = new URL('../../', import.meta.url)

test('download center is the single public directory for extensions and desktop apps', async () => {
  const nav = await readFile(new URL('lib/siteNav.js', root), 'utf8')
  assert.match(nav, /href: '\/downloads'[^}\n]*label: '下载中心'/)
  assert.match(nav, /TOOL_RESOURCE_PATHS[\s\S]*'\/resources\/codex-model-switcher'/)
  assert.doesNotMatch(nav, /href: '\/tools#downloads'/)
  assert.doesNotMatch(nav, /href: '\/browser-extensions'/)
  assert.doesNotMatch(nav, /href: '\/desktop-apps'[^}\n]*label: '桌面应用'/)
  assert.ok(STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/downloads' && entry.sitemap && entry.indexable))
  assert.ok(!STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/browser-extensions' && entry.sitemap))
  assert.ok(!STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/desktop-apps' && entry.sitemap))
})

test('download center covers gated tool packages plus the Syncblog extension', () => {
  const hrefs = DOWNLOAD_ITEMS.map((item) => item.href)
  assert.deepEqual(
    [...hrefs].sort(),
    [
      '/resources/2aran-desktop',
      '/resources/codex-model-switcher',
      '/resources/x-article-autopublisher-extension',
      '/resources/x-clipboard-phrase',
      '/resources/x-mutual-cleaner-extension',
      '/resources/x-reply-clipboard-extension',
      '/resources/x-tweet-to-pdf-extension',
      '/tools/syncblog-publisher',
      '/tools/workbuddy-desktop-pet',
    ],
  )
  assert.equal(getDownloadItemsByType('extension').length, 5)
  assert.equal(getDownloadItemsByType('desktop').length, 4)
  assert.ok(BROWSER_EXTENSION_WORK_ITEMS.some((item) => item.id === 'syncblog-publisher'))
  assert.ok(DESKTOP_APP_WORK_ITEMS.some((item) => item.id === 'codex-model-switcher'))
})

test('downloads default to newest-first order', () => {
  assert.ok(DOWNLOAD_ITEMS.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.updatedAt)))
  const dates = getDownloadItemsByDate().map((item) => item.updatedAt)
  assert.deepEqual(dates, [...dates].sort((a, b) => b.localeCompare(a)))
})

test('legacy extension and desktop catalogs redirect into the download center', async () => {
  const [extensionsPage, desktopPage, nextConfig] = await Promise.all([
    readFile(new URL('app/(site)/browser-extensions/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/desktop-apps/page.jsx', root), 'utf8'),
    readFile(new URL('next.config.js', root), 'utf8'),
  ])
  assert.match(extensionsPage, /permanentRedirect\('\/downloads#extensions'\)/)
  assert.match(desktopPage, /permanentRedirect\('\/downloads#desktop'\)/)
  assert.match(nextConfig, /source: '\/browser-extensions'[\s\S]*destination: '\/downloads#extensions'/)
  assert.match(nextConfig, /source: '\/desktop-apps'[\s\S]*destination: '\/downloads#desktop'/)
  assert.deepEqual(getLegacyPathRedirect('/browser-extensions'), { pathname: '/downloads', hash: '#extensions' })
  assert.deepEqual(getLegacyPathRedirect('/desktop-apps'), { pathname: '/downloads', hash: '#desktop' })
})

test('download categories use the shared accessible catalog', async () => {
  const [page, directory] = await Promise.all([
    readFile(new URL('app/(site)/downloads/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/components/ShowcaseDirectory.jsx', root), 'utf8'),
  ])
  assert.match(page, /getDownloadItemsByDate\(\)/)
  assert.match(page, /<ShowcaseDirectory/)
  assert.match(page, /categoryTabs: true/)
  assert.match(directory, /role="tablist"/)
  assert.match(directory, /role="tab"/)
  assert.match(directory, /aria-selected=\{active\}/)
})
