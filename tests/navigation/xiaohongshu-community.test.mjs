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
  assert.match(registrySource, /title: '专供小红书社群「硅基前沿」'/)
  assert.equal(isResourceDirectoryItem({ href: XIAOHONGSHU_COMMUNITY_PATH, category: 'resource' }), true)

  const home = HOME_RESOURCE_ITEMS.find((item) => item.href === XIAOHONGSHU_COMMUNITY_PATH)
  assert.ok(home)
  assert.equal(home.resourceType, 'ai-dev')
  assert.deepEqual(home.subjects, ['content_creation'])
  assert.match(home.title, /专供小红书社群/)
  assert.match(home.title, /硅基前沿/)
  assert.match(home.summary, /硅基前沿/)
  assert.match(home.summary, /种草笔记/)
  assert.match(home.summary, /今日想安利/)
  assert.equal(home.updated, '2026-11-05')
  assert.match(home.tagLabel, /硅基前沿/)
})

test('xiaohongshu community landing has three sections, real links, and honest placeholders', () => {
  assert.equal(XIAOHONGSHU_COMMUNITY.title, '专供小红书社群「硅基前沿」')
  assert.equal(XIAOHONGSHU_COMMUNITY.groupName, '硅基前沿')
  assert.match(XIAOHONGSHU_COMMUNITY.purpose, /群公告/)
  assert.match(XIAOHONGSHU_COMMUNITY.purpose, /硅基前沿/)
  assert.match(XIAOHONGSHU_COMMUNITY.honesty, /陆续补充/)
  assert.deepEqual(
    XIAOHONGSHU_COMMUNITY.sections.map((section) => section.title),
    ['今日想安利', '上手小抄', '一起慢慢学'],
  )
  assert.doesNotMatch(
    XIAOHONGSHU_COMMUNITY.sections.flatMap((section) => section.items).map((item) => `${item.title} ${item.note} ${item.cover}`).join('\n'),
    /AI 智能体|前端周看|开发资源|Prompt|智能体|DevOps/,
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
  assert.equal(XIAOHONGSHU_COMMUNITY.title, '专供小红书社群「硅基前沿」')
  assert.equal(XIAOHONGSHU_COMMUNITY.description.includes('专供小红书社群'), true)
  assert.equal(XIAOHONGSHU_COMMUNITY.description.includes('硅基前沿'), true)

  const html = await renderView()
  assert.match(html, /<h1[^>]*>专供小红书社群「硅基前沿」<\/h1>/)
  assert.match(html, /硅基前沿/)
  assert.match(html, /群公告贴这里/)
  assert.match(html, /今日想安利/)
  assert.match(html, /上手小抄/)
  assert.match(html, /一起慢慢学/)
  assert.match(html, /让它自己去跑一趟/)
  assert.match(html, /可以直接抄的说话稿/)
  assert.match(html, /columns-2/)
  assert.match(html, /rounded-\[18px\]/)
  assert.match(html, /\/images\/xiaohongshu-community\/page-bg\.svg/)
  assert.match(html, /\/images\/xiaohongshu-community\/hero\.svg/)
  assert.match(html, /\/images\/xiaohongshu-community\/cover-blush\.svg/)
  for (const file of [
    'public/images/xiaohongshu-community/page-bg.svg',
    'public/images/xiaohongshu-community/hero.svg',
    'public/images/xiaohongshu-community/cover-blush.svg',
    'public/images/xiaohongshu-community/cover-peach.svg',
    'public/images/xiaohongshu-community/cover-coral.svg',
    'public/images/xiaohongshu-community/cover-lilac.svg',
    'public/images/xiaohongshu-community/cover-apricot.svg',
    'public/images/xiaohongshu-community/cover-rose.svg',
  ]) {
    assert.equal(existsSync(path.join(ROOT, file)), true, file)
  }
  assert.doesNotMatch(html, /xhscdn|ci\.xiaohongshu\.com/)
  assert.match(html, /href="\/prompt-center"/)
  assert.match(html, /href="\/prompt-center#task-brief"/)
  assert.match(html, /href="\/topics\/ai-agents"/)
  assert.match(html, /href="\/articles\/research\/companies\/matrixlink-blogger-alliance"/)
  assert.match(html, /陆续补充/)
  assert.doesNotMatch(html, />占位</)
  assert.doesNotMatch(html, /AI 智能体|前端周看|Prompt|开发资源/)
  assert.doesNotMatch(html, /x-mutual-aid/)
  assert.doesNotMatch(html, /circles\/xiaohongshu/)
  assert.doesNotMatch(html, /xiaohongshu\.com/)
  assert.doesNotMatch(html, /(?:赞|收藏|喜欢)\s*\d|\d+\s*(?:万\s*)?(?:赞|收藏|喜欢)/)
  assert.match(html, /aria-hidden="true"/)
  assert.equal((html.match(/aria-label="[^"]*，陆续补充"/g) || []).length, 3)
})
