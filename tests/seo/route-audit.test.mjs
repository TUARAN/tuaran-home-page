import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { STATIC_PAGE_REGISTRY, listStaticPageSitemapEntries } from '../../lib/staticPageRegistry.mjs'
import { inspectRoute, routeFromPageFile } from '../../scripts/audit-route-seo.mjs'

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(target) : [target]
  })
}

test('route filenames normalize app groups without losing dynamic segments', () => {
  const root = '/repo'
  assert.equal(routeFromPageFile('/repo/app/(site)/about/page.jsx', root), '/about')
  assert.equal(routeFromPageFile('/repo/app/(site)/articles/[slug]/page.jsx', root), '/articles/[slug]')
  assert.equal(routeFromPageFile('/repo/app/(site)/page.jsx', root), '/')
  assert.equal(routeFromPageFile('/repo/.public-pages-build-excluded/app-admin-group/admin/seo/page.jsx', root), '/admin/seo')
})

test('static registry has unique canonicals and keeps noindex routes out of sitemap', () => {
  assert.equal(new Set(STATIC_PAGE_REGISTRY.map((page) => page.path)).size, STATIC_PAGE_REGISTRY.length)
  assert.ok(STATIC_PAGE_REGISTRY.every((page) => page.indexable || !page.sitemap))
  const sitemapUrls = new Set(listStaticPageSitemapEntries().map((entry) => entry.url))
  assert.ok(sitemapUrls.has('https://2aran.com/about'))
  assert.ok(!sitemapUrls.has('https://2aran.com/account'))
  assert.ok(!sitemapUrls.has('https://2aran.com/rank'))
})

test('SEO registry stays on the server side and cannot enter a client route bundle', () => {
  const appRoot = path.resolve('app')
  const importers = walk(appRoot)
    .filter((file) => /\.(?:js|jsx|mjs)$/.test(file))
    .filter((file) => readFileSync(file, 'utf8').includes('staticPageRegistry'))
    .map((file) => path.relative(process.cwd(), file).replaceAll(path.sep, '/'))

  assert.deepEqual(importers, ['app/(site)/sitemap-static/sitemap.js'])
  const registrySource = readFileSync(path.resolve('lib/staticPageRegistry.mjs'), 'utf8')
  assert.equal(registrySource.includes("'use client'"), false)
})

test('auditor reports missing signals and policy conflicts with stable rule ids', () => {
  const file = path.resolve('app/(site)/sample/page.jsx')
  const missing = inspectRoute({
    route: '/sample',
    file,
    source: 'export const metadata = { title: "Sample" }; export default function Page() {}',
    registryEntry: { path: '/sample', canonical: '/sample', indexable: true, sitemap: true },
  })
  assert.deepEqual(missing.issues.map((entry) => entry.rule), [
    'canonical.missing',
    'og.missing',
    'jsonld.missing',
  ])

  const conflict = inspectRoute({
    route: '/private',
    file,
    source: `export const metadata = { alternates: { canonical: '/other' }, openGraph: { url: '/third' } }`,
    registryEntry: { path: '/private', canonical: '/private', indexable: false, sitemap: false },
  })
  assert.deepEqual(conflict.issues.map((entry) => entry.rule), [
    'canonical.conflict',
    'og.canonical-conflict',
    'noindex.missing',
  ])
})
