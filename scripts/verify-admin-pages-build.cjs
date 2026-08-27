#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { MIB, formatMiB, printWorkerSizeReport } = require('./worker-size.cjs')

const root = path.resolve(__dirname, '..')
const workerRoot = path.join(root, '.vercel', 'output', 'static', '_worker.js')
const buildLogPath = path.join(workerRoot, 'nop-build-log.json')
const ADMIN_WORKER_BUDGET = 2.5 * MIB

const REQUIRED_EDGE_ROUTES = [
  '/admin/planning',
  '/api/admin/deepseek-tasks/local-sync',
  '/api/admin/planning',
  '/api/admin/planning/import',
  '/api/me',
  '/api/nav-config',
  '/api/notifications',
  '/api/private-records',
  '/api/site-settings',
]

const REQUIRED_PRERENDERED_ROUTES = [
  '/admin',
  '/admin/context-memory',
]

const ALLOWED_DYNAMIC_ADMIN_PAGES = new Set([
  '/admin/article-distribution',
  '/admin/articles/[id]/edit',
  '/admin/planning',
  '/admin/soft-sticker',
  '/admin/stock-analysis/[slug]',
])

// PortfolioConsole mentions this planned endpoint as documentation; it does not
// execute a request. Keep explicit exceptions narrow so new missing APIs fail.
const NON_RUNTIME_API_REFERENCES = new Set(['/api/subscribe'])

function isAllowedRoute(route) {
  return route === '/middleware'
    || route.startsWith('/admin')
    || route.startsWith('/api/admin')
    || route.startsWith('/api/auth')
    || ['/api/me', '/api/nav-config', '/api/notifications', '/api/private-records', '/api/site-settings'].includes(route)
}

function collectClientApiReferences(directory, references = new Set()) {
  if (!fs.existsSync(directory)) return references
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      collectClientApiReferences(filePath, references)
      continue
    }
    if (!entry.name.endsWith('.js')) continue
    const source = fs.readFileSync(filePath, 'utf8')
    for (const match of source.matchAll(/\/api\/[A-Za-z0-9_./\[\]-]+/g)) {
      references.add(match[0].replace(/\/$/, ''))
    }
  }
  return references
}

if (!fs.existsSync(buildLogPath)) {
  throw new Error(`Admin Pages build log not found: ${buildLogPath}`)
}

const buildLog = JSON.parse(fs.readFileSync(buildLogPath, 'utf8'))
const routes = (buildLog.buildFiles?.functions?.edge || [])
  .map((entry) => entry.route?.path)
  .filter(Boolean)
const prerenderedRoutes = new Set(
  (buildLog.buildFiles?.functions?.prerendered || []).flatMap((entry) => {
    const routePath = entry.route?.path
    const overrides = entry.route?.overrides || []
    if (!routePath) return overrides
    return [routePath.replace(/\.(?:html|rsc)$/, ''), ...overrides]
  }),
)

const missingRoutes = REQUIRED_EDGE_ROUTES.filter((route) => !routes.includes(route))
if (missingRoutes.length) {
  throw new Error(`Admin Pages build is missing required runtime routes: ${missingRoutes.join(', ')}`)
}

const missingPrerenderedRoutes = REQUIRED_PRERENDERED_ROUTES.filter((route) => !prerenderedRoutes.has(route))
if (missingPrerenderedRoutes.length) {
  throw new Error(`Admin Pages build is missing required prerendered routes: ${missingPrerenderedRoutes.join(', ')}`)
}

const unexpectedDynamicAdminPages = routes.filter(
  (route) => route.startsWith('/admin') && !ALLOWED_DYNAMIC_ADMIN_PAGES.has(route),
)
if (unexpectedDynamicAdminPages.length) {
  throw new Error(`Admin pages unexpectedly entered the Worker: ${unexpectedDynamicAdminPages.join(', ')}`)
}

const unexpectedRoutes = routes.filter((route) => !isAllowedRoute(route))
if (unexpectedRoutes.length) {
  throw new Error(`Admin Pages build unexpectedly contains public routes: ${unexpectedRoutes.join(', ')}`)
}

const clientApiReferences = collectClientApiReferences(
  path.join(root, '.vercel', 'output', 'static', '_next', 'static'),
)
const missingClientApis = [...clientApiReferences].filter(
  (apiPath) => !NON_RUNTIME_API_REFERENCES.has(apiPath) && !routes.includes(apiPath),
)
if (missingClientApis.length) {
  throw new Error(`Admin client references API routes missing from the build: ${missingClientApis.join(', ')}`)
}

const { gzipBytes } = printWorkerSizeReport({
  label: 'admin',
  workerRoot,
  hardLimitBytes: ADMIN_WORKER_BUDGET,
})

if (gzipBytes >= ADMIN_WORKER_BUDGET) {
  throw new Error(
    `Admin Worker gzip estimate ${formatMiB(gzipBytes)} exceeds the repository budget ${formatMiB(ADMIN_WORKER_BUDGET)}`,
  )
}

console.log(
  `[verify-admin-pages-build] ${routes.length} Edge routes; ${prerenderedRoutes.size} prerendered route aliases; ${clientApiReferences.size} client API references checked; budget headroom ${formatMiB(ADMIN_WORKER_BUDGET - gzipBytes)}`,
)
