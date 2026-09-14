#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { STATIC_PAGE_REGISTRY } from '../lib/staticPageRegistry.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SNAPSHOT_PATH = path.join(ROOT, 'seo', 'route-audit.snapshot.json')
const CURRENT_PATH = path.join(ROOT, 'tmp', 'seo-route-audit.current.json')
const PAGE_FILE_RE = /\/page\.(?:js|jsx|mjs)$/
const ROUTE_GROUP_RE = /^\(.*\)$/

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(target) : [target]
  }))
  return nested.flat()
}

export function routeFromPageFile(file, root = ROOT) {
  const appRoot = path.join(root, 'app')
  const stashedAdminRoot = path.join(root, '.public-pages-build-excluded', 'app-admin-group')
  const relative = file.startsWith(`${stashedAdminRoot}${path.sep}`)
    ? `(admin)/${path.relative(stashedAdminRoot, file).replaceAll(path.sep, '/')}`
    : path.relative(appRoot, file).replaceAll(path.sep, '/')
  const segments = relative.split('/').slice(0, -1).filter((segment) => !ROUTE_GROUP_RE.test(segment))
  return `/${segments.join('/')}`.replace(/\/$/, '') || '/'
}

function displayPageFile(file) {
  const stashedAdminRoot = path.join(ROOT, '.public-pages-build-excluded', 'app-admin-group')
  if (file.startsWith(`${stashedAdminRoot}${path.sep}`)) {
    return `app/(admin)/${path.relative(stashedAdminRoot, file).replaceAll(path.sep, '/')}`
  }
  return path.relative(ROOT, file).replaceAll(path.sep, '/')
}

function literalValues(source, field) {
  const expression = new RegExp(`${field}\\s*:\\s*(['\"\\x60])([^'\"\\x60]+)\\1`, 'g')
  return [...source.matchAll(expression)].map((match) => match[2])
}

function redirectTarget(source) {
  return source.match(/(?:permanentRedirect|redirect)\(\s*['"]([^'"]+)['"]/)?.[1] || null
}

function normalizeCanonical(value, expected) {
  if (!value) return value
  try {
    const base = expected?.startsWith('http') ? new URL(expected).origin : 'https://2aran.com'
    const url = new URL(value, base)
    return `${url.origin}${url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '')}`
  } catch {
    return value
  }
}

function issue(rule, route, severity, message) {
  return { id: `${rule}:${route}`, rule, route, severity, message }
}

function richPageNoindexIds(source) {
  const entries = [...source.matchAll(/^  (?:'([^']+)'|([a-zA-Z][\w-]*)):\s*\{/gm)]
  const ids = new Set()
  entries.forEach((match, index) => {
    const block = source.slice(match.index, entries[index + 1]?.index ?? source.length)
    if (/\brobots\s*:\s*\{[\s\S]*?\bindex\s*:\s*false/.test(block)) ids.add(match[1] || match[2])
  })
  return ids
}

export function inspectRoute({ route, file, source, registryEntry, configuredNoindex = false }) {
  const relativeFile = displayPageFile(file)
  const isAdmin = relativeFile.startsWith('app/(admin)/') || route === '/admin' || route.startsWith('/admin/')
  const redirect = redirectTarget(source)
  const richFactory = /createRichPageMetadata\s*\(/.test(source)
  const generatedMetadata = /export\s+(?:async\s+)?function\s+generateMetadata/.test(source)
  const canonicalValues = literalValues(source, 'canonical')
  const openGraphStart = source.search(/\bopenGraph\s*:\s*\{/)
  const openGraphTail = openGraphStart >= 0 ? source.slice(openGraphStart) : ''
  const nextMetadataField = openGraphTail.search(/\n\s*(?:twitter|robots|verification|icons|alternates)\s*:/)
  const openGraphBlock = nextMetadataField > 0 ? openGraphTail.slice(0, nextMetadataField) : openGraphTail.slice(0, 1200)
  const ogUrls = literalValues(openGraphBlock, 'url').filter((value) => !value.includes('${'))
  const hasCanonical = richFactory || /\bcanonical\s*:/.test(source)
  const explicitNoindex = /\bindex\s*:\s*false/.test(source)
  const explicitIndex = /\bindex\s*:\s*true/.test(source)
  const hasOpenGraph = richFactory || /\bopenGraph\s*:/.test(source)
  const hasJsonLd = richFactory
    || /application\/ld\+json/.test(source)
    || /RichPageJsonLd|createRichPageJsonLd/.test(source)
  const dynamic = route.includes('[')
  const kind = redirect
    ? 'redirect'
    : isAdmin
      ? 'private'
      : richFactory
        ? 'rich-page'
        : dynamic
          ? 'dynamic'
          : 'static'
  const expectedIndexable = registryEntry?.indexable ?? (!isAdmin && !configuredNoindex && !explicitNoindex)
  const findings = []

  if (kind === 'static' && !registryEntry) {
    findings.push(issue('registry.missing', route, 'error', '普通静态页面未登记到统一注册表。'))
  }

  if (!redirect && !isAdmin && !hasCanonical) {
    findings.push(issue('canonical.missing', route, 'warning', '页面没有声明 canonical。'))
  }

  const concreteCanonicals = canonicalValues.filter((value) => !value.includes('${'))
  if (registryEntry && concreteCanonicals.some((value) => normalizeCanonical(value, registryEntry.canonical) !== normalizeCanonical(registryEntry.canonical))) {
    findings.push(issue('canonical.conflict', route, 'error', `canonical 与注册表不一致：${concreteCanonicals.join(', ')}`))
  }

  const declaredCanonical = registryEntry?.canonical || concreteCanonicals[0]
  if (declaredCanonical && ogUrls[0] && normalizeCanonical(declaredCanonical) !== normalizeCanonical(ogUrls[0], declaredCanonical)) {
    findings.push(issue('og.canonical-conflict', route, 'error', `Open Graph URL (${ogUrls[0]}) 与 canonical (${declaredCanonical}) 不一致。`))
  }

  if (registryEntry?.indexable === false && !explicitNoindex) {
    findings.push(issue('noindex.missing', route, 'error', '注册表要求 noindex，但页面未显式声明 index: false。'))
  }

  if (registryEntry?.indexable === true && explicitNoindex && !generatedMetadata) {
    findings.push(issue('noindex.conflict', route, 'error', '可索引注册路由声明了 index: false。'))
  }

  if (!redirect && !isAdmin && expectedIndexable && !hasOpenGraph) {
    findings.push(issue('og.missing', route, 'warning', '可索引页面只会继承全站 OG，缺少页面级 Open Graph。'))
  }

  if (!redirect && !isAdmin && expectedIndexable && !hasJsonLd) {
    findings.push(issue('jsonld.missing', route, 'warning', '可索引页面缺少页面级 JSON-LD。'))
  }

  if (!redirect && explicitNoindex && hasJsonLd && !generatedMetadata) {
    findings.push(issue('jsonld.noindex-conflict', route, 'error', '静态 noindex 页面同时输出页面级 JSON-LD。'))
  }

  if (registryEntry?.sitemap && explicitNoindex && !generatedMetadata) {
    findings.push(issue('sitemap.noindex-conflict', route, 'error', 'Sitemap 注册项同时声明了 noindex。'))
  }

  if (registryEntry?.indexable === false && registryEntry.sitemap) {
    findings.push(issue('registry.sitemap-conflict', route, 'error', 'noindex 注册项不能进入 Sitemap。'))
  }

  return {
    route: {
      path: route,
      file: relativeFile,
      kind,
      ...(redirect ? { redirect } : {}),
      registered: Boolean(registryEntry),
      indexable: redirect || isAdmin ? false : expectedIndexable,
      sitemap: Boolean(registryEntry?.sitemap),
      signals: {
        canonical: hasCanonical,
        canonicalValues,
        noindex: isAdmin ? 'inherited' : configuredNoindex ? 'registry' : explicitNoindex ? (generatedMetadata ? 'conditional-or-explicit' : 'explicit') : explicitIndex ? 'index' : 'inherited',
        openGraph: hasOpenGraph,
        jsonLd: hasJsonLd,
        ogUrls,
      },
    },
    issues: findings,
  }
}

export async function buildRouteSeoSnapshot({ root = ROOT } = {}) {
  const appRoot = path.join(root, 'app')
  const liveAdminEntry = path.join(appRoot, '(admin)', 'admin', 'page.jsx')
  const stashedAdminRoot = path.join(root, '.public-pages-build-excluded', 'app-admin-group')
  const registry = new Map(STATIC_PAGE_REGISTRY.map((page) => [page.path, page]))
  const richPageSeoSource = await readFile(path.join(root, 'lib', 'richPageSeo.js'), 'utf8')
  const richNoindexIds = richPageNoindexIds(richPageSeoSource)
  const sourceRoots = [appRoot]
  if (!existsSync(liveAdminEntry) && existsSync(stashedAdminRoot)) sourceRoots.push(stashedAdminRoot)
  const pageFiles = (await Promise.all(sourceRoots.map(walk))).flat().filter((file) => PAGE_FILE_RE.test(file)).sort()
  const inspections = await Promise.all(pageFiles.map(async (file) => {
    const route = routeFromPageFile(file, root)
    const source = await readFile(file, 'utf8')
    const richPageId = source.match(/createRichPageMetadata\(\s*['"]([^'"]+)['"]\s*\)/)?.[1]
    return inspectRoute({
      route,
      file,
      source,
      registryEntry: registry.get(route),
      configuredNoindex: Boolean(richPageId && richNoindexIds.has(richPageId)),
    })
  }))
  const routes = inspections.map((entry) => entry.route).sort((a, b) => a.path.localeCompare(b.path) || a.file.localeCompare(b.file))
  const issues = inspections.flatMap((entry) => entry.issues).sort((a, b) => a.id.localeCompare(b.id))

  const registeredRoutes = new Set(routes.filter((route) => route.registered).map((route) => route.path))
  for (const page of STATIC_PAGE_REGISTRY) {
    if (!registeredRoutes.has(page.path)) {
      issues.push(issue('registry.orphan', page.path, 'error', '注册表路由没有对应的普通静态 page 文件。'))
    }
  }


  const canonicalOwners = new Map()
  for (const route of routes.filter((entry) => entry.indexable && entry.kind !== 'redirect')) {
    const registryCanonical = registry.get(route.path)?.canonical
    const literalCanonical = route.signals.canonicalValues.find((value) => !value.includes('${'))
    const canonical = normalizeCanonical(registryCanonical || literalCanonical, registryCanonical)
    if (!canonical) continue
    const owners = canonicalOwners.get(canonical) || []
    owners.push(route.path)
    canonicalOwners.set(canonical, owners)
  }
  for (const [canonical, owners] of canonicalOwners) {
    if (owners.length < 2) continue
    for (const route of owners) {
      issues.push(issue('canonical.duplicate', route, 'error', `多个可索引路由共用 canonical ${canonical}：${owners.join(', ')}`))
    }
  }
  issues.sort((a, b) => a.id.localeCompare(b.id))

  const count = (predicate) => routes.filter(predicate).length
  return {
    schemaVersion: 1,
    summary: {
      routes: routes.length,
      redirects: count((route) => route.kind === 'redirect'),
      private: count((route) => route.kind === 'private'),
      registeredStatic: count((route) => route.kind === 'static' && route.registered),
      indexable: count((route) => route.indexable),
      canonical: count((route) => route.signals.canonical),
      openGraph: count((route) => route.signals.openGraph),
      jsonLd: count((route) => route.signals.jsonLd),
      errors: issues.filter((entry) => entry.severity === 'error').length,
      warnings: issues.filter((entry) => entry.severity === 'warning').length,
    },
    routes,
    issues,
  }
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function summarizeChanges(before, after) {
  const beforeIssues = new Set((before?.issues || []).map((entry) => entry.id))
  const afterIssues = new Set(after.issues.map((entry) => entry.id))
  const added = [...afterIssues].filter((id) => !beforeIssues.has(id))
  const resolved = [...beforeIssues].filter((id) => !afterIssues.has(id))
  const beforeRoutes = new Set((before?.routes || []).map((entry) => `${entry.path}:${entry.file}`))
  const afterRoutes = new Set(after.routes.map((entry) => `${entry.path}:${entry.file}`))
  const routeChanges = [...afterRoutes].filter((id) => !beforeRoutes.has(id)).length
    + [...beforeRoutes].filter((id) => !afterRoutes.has(id)).length
  return { added, resolved, routeChanges }
}

export async function runAudit({ update = false, output = CURRENT_PATH } = {}) {
  const snapshot = await buildRouteSeoSnapshot()
  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(output, stableJson(snapshot))

  if (update) {
    await mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true })
    await writeFile(SNAPSHOT_PATH, stableJson(snapshot))
    console.log(`SEO route snapshot updated: ${path.relative(ROOT, SNAPSHOT_PATH)}`)
    console.log(JSON.stringify(snapshot.summary))
    return { ok: true, snapshot }
  }

  if (!existsSync(SNAPSHOT_PATH)) {
    console.error('SEO route snapshot is missing. Run: npm run seo:routes:update')
    return { ok: false, snapshot }
  }

  const baseline = JSON.parse(await readFile(SNAPSHOT_PATH, 'utf8'))
  const matches = stableJson(baseline) === stableJson(snapshot)
  if (!matches) {
    const changes = summarizeChanges(baseline, snapshot)
    console.error('SEO route audit changed; review the current snapshot before accepting it.')
    console.error(`Current: ${path.relative(ROOT, output)}`)
    console.error(`New issues: ${changes.added.length}; resolved issues: ${changes.resolved.length}; route changes: ${changes.routeChanges}`)
    for (const id of changes.added.slice(0, 12)) console.error(`  + ${id}`)
    for (const id of changes.resolved.slice(0, 12)) console.error(`  - ${id}`)
    console.error('Accept reviewed changes with: npm run seo:routes:update')
    return { ok: false, snapshot }
  }

  console.log(`SEO route audit matches snapshot: ${snapshot.summary.routes} routes, ${snapshot.summary.errors} errors, ${snapshot.summary.warnings} warnings.`)
  return { ok: true, snapshot }
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const outputIndex = process.argv.indexOf('--output')
  const output = outputIndex >= 0 && process.argv[outputIndex + 1]
    ? path.resolve(ROOT, process.argv[outputIndex + 1])
    : CURRENT_PATH
  const result = await runAudit({ update: args.has('--update'), output })
  if (!result.ok) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
