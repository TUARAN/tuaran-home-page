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

test('tools is the single public directory for online and downloadable tools', async () => {
  const [nav, downloadsPage] = await Promise.all([
    readFile(new URL('lib/siteNav.js', root), 'utf8'),
    readFile(new URL('app/(site)/downloads/page.jsx', root), 'utf8'),
  ])
  assert.match(nav, /href: '\/tools'[^}\n]*label: '工具与下载'/)
  assert.match(nav, /TOOL_RESOURCE_PATHS[\s\S]*'\/resources\/codex-model-switcher'/)
  assert.doesNotMatch(nav, /href: '\/downloads'[^}\n]*label: '下载中心'/)
  assert.doesNotMatch(nav, /href: '\/browser-extensions'/)
  assert.doesNotMatch(nav, /href: '\/desktop-apps'[^}\n]*label: '桌面应用'/)
  assert.match(downloadsPage, /permanentRedirect\('\/tools#downloads'\)/)
  assert.ok(STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/tools' && entry.sitemap && entry.indexable))
  assert.ok(!STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/downloads' && entry.sitemap))
  assert.ok(!STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/browser-extensions' && entry.sitemap))
  assert.ok(!STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/desktop-apps' && entry.sitemap))
})

test('download compatibility exports are derived from the unified tools catalog', () => {
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
  assert.ok(DOWNLOAD_ITEMS.every((item) => item.downloadType && item.downloadStatus))
})

test('downloadable tools default to newest-first order', () => {
  assert.ok(DOWNLOAD_ITEMS.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.updatedAt)))
  const dates = getDownloadItemsByDate().map((item) => item.updatedAt)
  assert.deepEqual(dates, [...dates].sort((a, b) => b.localeCompare(a)))
})

test('legacy download routes redirect into the unified tools directory', async () => {
  const [extensionsPage, desktopPage, nextConfig] = await Promise.all([
    readFile(new URL('app/(site)/browser-extensions/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/desktop-apps/page.jsx', root), 'utf8'),
    readFile(new URL('next.config.js', root), 'utf8'),
  ])
  assert.match(extensionsPage, /permanentRedirect\('\/tools#downloads'\)/)
  assert.match(desktopPage, /permanentRedirect\('\/tools#downloads'\)/)
  assert.match(nextConfig, /source: '\/downloads'[\s\S]*destination: '\/tools#downloads'/)
  assert.match(nextConfig, /source: '\/browser-extensions'[\s\S]*destination: '\/tools#downloads'/)
  assert.match(nextConfig, /source: '\/desktop-apps'[\s\S]*destination: '\/tools#downloads'/)
  assert.deepEqual(getLegacyPathRedirect('/downloads'), { pathname: '/tools', hash: '#downloads' })
  assert.deepEqual(getLegacyPathRedirect('/browser-extensions'), { pathname: '/tools', hash: '#downloads' })
  assert.deepEqual(getLegacyPathRedirect('/desktop-apps'), { pathname: '/tools', hash: '#downloads' })
})

test('tools catalog exposes a download filter and syncs legacy hashes', async () => {
  const [page, directory] = await Promise.all([
    readFile(new URL('app/(site)/tools/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/components/ShowcaseDirectory.jsx', root), 'utf8'),
  ])
  assert.match(page, /title: '工具与下载'/)
  assert.match(page, /field: 'deliveryGroup'/)
  assert.match(page, /downloads: 'download'/)
  assert.match(page, /label: '下载安装'/)
  assert.match(directory, /role="tablist"/)
  assert.match(directory, /role="tab"/)
  assert.match(directory, /aria-selected=\{active\}/)
  assert.match(directory, /window\.addEventListener\('hashchange', syncHashFilter\)/)
})
