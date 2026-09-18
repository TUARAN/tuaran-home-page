import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  BROWSER_EXTENSION_WORK_ITEMS,
  DESKTOP_APP_WORK_ITEMS,
  DOWNLOAD_ITEMS,
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
      '/resources/x-mutual-cleaner-extension',
      '/resources/x-tweet-to-pdf-extension',
      '/tools/syncblog-publisher',
    ],
  )
  assert.equal(getDownloadItemsByType('extension').length, 4)
  assert.equal(getDownloadItemsByType('desktop').length, 2)
  assert.ok(BROWSER_EXTENSION_WORK_ITEMS.some((item) => item.id === 'syncblog-publisher'))
  assert.ok(DESKTOP_APP_WORK_ITEMS.some((item) => item.id === 'codex-model-switcher'))
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
