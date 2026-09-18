import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [
  dropdownSource,
  layoutSource,
  globalsSource,
  devResourcesSource,
] = await Promise.all([
  readFile(new URL('../../app/(site)/components/ArticleActionsDropdown.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/BookmarksTocLayout.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/globals.css', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/bookmarks/dev-resources/page.jsx', import.meta.url), 'utf8'),
])

test('article action dropdown keeps the menu mounted and can open from the start edge', () => {
  assert.match(dropdownSource, /data-open=\{open \? 'true' : 'false'\}/)
  assert.match(dropdownSource, /align = 'end'/)
  assert.match(dropdownSource, /article-actions-dropdown-menu-start/)
  assert.doesNotMatch(dropdownSource, /\{open \? \(/)
})

test('empty or closed dropdown menus are not visible', () => {
  assert.match(globalsSource, /\.article-actions-dropdown:not\(:has\(\.article-actions-dropdown-menu > \*\)\)/)
  assert.match(globalsSource, /\.article-actions-dropdown\[data-open='false'\] \.article-actions-dropdown-menu/)
  assert.match(globalsSource, /\.article-actions-dropdown-menu:empty/)
  assert.match(globalsSource, /\.article-actions-dropdown-menu-start/)
})

test('bookmark resource pages put share inside 更多 instead of an empty owner-only menu', () => {
  assert.match(layoutSource, /<SharePageButton/)
  assert.match(layoutSource, /align="start"/)
  assert.match(devResourcesSource, /<DistributeContentButton/)
  assert.doesNotMatch(devResourcesSource, /ArticleActionsDropdown/)
})
