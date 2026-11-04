import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { isResourceDirectoryItem } from '../../lib/content/directoryMembership.js'
import { HOME_RESOURCE_ITEMS } from '../../lib/home/homeResourceItems.js'
import {
  XIAOHONGSHU_COMMUNITY,
  XIAOHONGSHU_COMMUNITY_PATH,
  xiaohongshuCommunityItems,
  xiaohongshuCommunityJsonLd,
} from '../../lib/page-data/xiaohongshuCommunity.js'
import { STATIC_PAGE_REGISTRY } from '../../lib/site/staticPageRegistry.mjs'

const require = createRequire(import.meta.url)
const { transform } = require('next/dist/build/swc')
const ROOT = process.cwd()

const LIVE_PAGES = {
  '/topics/ai-agents': 'app/(site)/topics/ai-agents/page.jsx',
  '/frontend-weekly': 'app/(site)/frontend-weekly/page.jsx',
  '/bookmarks/dev-resources': 'app/(site)/bookmarks/dev-resources/page.jsx',
  '/prompt-center': 'app/(site)/prompt-center/page.jsx',
  '/resources/ai-learning-library': 'app/(site)/resources/ai-learning-library/page.jsx',
  '/resources/edge-agent-development': 'app/(site)/resources/edge-agent-development/page.jsx',
}

function read(relativePath) {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

async function renderView() {
  const source = read('app/(site)/resources/xiaohongshu-community/XiaohongshuCommunityView.jsx')
  const { code } = await transform(source, {
    filename: 'XiaohongshuCommunityView.jsx',
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  })
  const loaded = { exports: {} }
  const Link = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)
  const localRequire = (request) => {
    if (request === 'react') return React
    if (request === 'react/jsx-runtime') return require('react/jsx-runtime')
    if (request === 'next/link') return Link
    throw new Error(`Unexpected import: ${request}`)
  }
  new Function('require', 'exports', 'module', code)(localRequire, loaded.exports, loaded)
  return renderToStaticMarkup(React.createElement(loaded.exports.default, { page: XIAOHONGSHU_COMMUNITY }))
}

test('xiaohongshu community page is a registered public resource', () => {
  const registry = STATIC_PAGE_REGISTRY.find((page) => page.path === XIAOHONGSHU_COMMUNITY_PATH)
  assert.equal(registry?.indexable, true)
  assert.equal(registry?.sitemap, true)
  assert.equal(registry?.canonical, XIAOHONGSHU_COMMUNITY_PATH)

  const registrySource = read('lib/content/contentRegistry.js')
  assert.match(registrySource, /slug: 'xiaohongshu-community'/)
  assert.match(registrySource, /href: '\/resources\/xiaohongshu-community'/)
  assert.match(registrySource, /title: '专供小红书社群'/)
  assert.equal(isResourceDirectoryItem({ href: XIAOHONGSHU_COMMUNITY_PATH, category: 'resource' }), true)

  const home = HOME_RESOURCE_ITEMS.find((item) => item.href === XIAOHONGSHU_COMMUNITY_PATH)
  assert.ok(home)
  assert.equal(home.resourceType, 'ai-dev')
  assert.deepEqual(home.subjects, ['content_creation'])
  assert.match(home.title, /专供小红书社群/)
})

test('xiaohongshu community landing has three sections, real links, and honest placeholders', () => {
  assert.equal(XIAOHONGSHU_COMMUNITY.title, '专供小红书社群')
  assert.match(XIAOHONGSHU_COMMUNITY.purpose, /群公告/)
  assert.match(XIAOHONGSHU_COMMUNITY.honesty, /占位/)
  assert.deepEqual(
    XIAOHONGSHU_COMMUNITY.sections.map((section) => section.title),
    ['资讯精选', '提示词 / Prompt 技巧', '实用清单与入门路径'],
  )

  for (const section of XIAOHONGSHU_COMMUNITY.sections) {
    assert.ok(section.items.length >= 2 && section.items.length <= 4, section.id)
  }

  const items = xiaohongshuCommunityItems()
  const live = items.filter((item) => item.status === 'live')
  const placeholders = items.filter((item) => item.status === 'placeholder')
  assert.ok(live.length >= 6)
  assert.ok(placeholders.length >= 2)
  assert.equal(items.some((item) => /x-mutual-aid|circles\/xiaohongshu/.test(item.href || '')), false)

  for (const item of placeholders) {
    assert.equal(item.href, undefined)
    assert.match(item.note, /陆续补充/)
  }

  for (const item of live) {
    const pathname = item.href.split('#')[0]
    if (pathname === '/articles/research/companies/matrixlink-blogger-alliance') {
      assert.equal(existsSync(path.join(ROOT, 'research/companies/2026-05-22-matrixlink-blogger-alliance.md')), true)
      continue
    }
    assert.ok(LIVE_PAGES[pathname], item.href)
    assert.equal(existsSync(path.join(ROOT, LIVE_PAGES[pathname])), true, item.href)
  }

  const promptSource = read('app/(site)/prompt-center/page.jsx')
  assert.match(promptSource, /id: 'task-brief'/)
  assert.match(promptSource, /id: 'rewrite'/)

  const jsonLd = xiaohongshuCommunityJsonLd()
  assert.equal(jsonLd['@type'], 'CollectionPage')
  assert.equal(jsonLd.url, 'https://2aran.com/resources/xiaohongshu-community')
  assert.equal(jsonLd.mainEntity.itemListElement.length, live.length)
  assert.equal(jsonLd.mainEntity.itemListElement.some((entry) => /占位|陆续补充/.test(entry.name)), false)
})

test('xiaohongshu community page metadata and markup stay announcement-safe', async () => {
  const source = read('app/(site)/resources/xiaohongshu-community/page.jsx')
  assert.match(source, /title: XIAOHONGSHU_COMMUNITY\.title/)
  assert.match(source, /canonical: '\/resources\/xiaohongshu-community'/)
  assert.match(source, /url: '\/resources\/xiaohongshu-community'/)
  assert.match(source, /openGraph/)
  assert.match(source, /application\/ld\+json/)
  assert.doesNotMatch(source, /x-mutual-aid-circle/)
  assert.equal(XIAOHONGSHU_COMMUNITY.title, '专供小红书社群')
  assert.equal(XIAOHONGSHU_COMMUNITY.description.includes('专供小红书社群'), true)

  const html = await renderView()
  assert.match(html, /<h1[^>]*>专供小红书社群<\/h1>/)
  assert.match(html, /给小红书群公告用的资源入口/)
  assert.match(html, /资讯精选/)
  assert.match(html, /提示词 \/ Prompt 技巧/)
  assert.match(html, /实用清单与入门路径/)
  assert.match(html, /href="\/prompt-center"/)
  assert.match(html, /href="\/prompt-center#task-brief"/)
  assert.match(html, /href="\/topics\/ai-agents"/)
  assert.match(html, /href="\/articles\/research\/companies\/matrixlink-blogger-alliance"/)
  assert.match(html, />占位</)
  assert.match(html, /陆续补充/)
  assert.doesNotMatch(html, /x-mutual-aid/)
  assert.doesNotMatch(html, /circles\/xiaohongshu/)
  assert.equal((html.match(/aria-label="[^"]*，占位"/g) || []).length, 3)
})
