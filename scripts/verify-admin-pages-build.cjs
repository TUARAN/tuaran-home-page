#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const root = path.resolve(__dirname, '..')
const workerRoot = path.join(root, '.vercel', 'output', 'static', '_worker.js')
const buildLogPath = path.join(workerRoot, 'nop-build-log.json')
const FREE_WORKER_LIMIT = 3 * 1024 * 1024

const REQUIRED_ROUTES = [
  '/admin',
  '/admin/context-memory',
  '/admin/long-compass',
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

function collectWorkerFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) collectWorkerFiles(filePath, files)
    else if (entry.name !== 'nop-build-log.json') files.push(filePath)
  }
  return files
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

const missingRoutes = REQUIRED_ROUTES.filter((route) => !routes.includes(route))
if (missingRoutes.length) {
  throw new Error(`Admin Pages build is missing required runtime routes: ${missingRoutes.join(', ')}`)
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

const gzipBytes = collectWorkerFiles(workerRoot).reduce(
  (total, filePath) => total + zlib.gzipSync(fs.readFileSync(filePath), { level: 9 }).length,
  0,
)

if (gzipBytes >= FREE_WORKER_LIMIT) {
  throw new Error(
    `Admin Worker gzip estimate ${(gzipBytes / 1024 / 1024).toFixed(3)} MiB exceeds the 3 MiB free-plan limit`,
  )
}

console.log(
  `[verify-admin-pages-build] ${routes.length} Edge routes; ${clientApiReferences.size} client API references checked; gzip estimate ${(gzipBytes / 1024 / 1024).toFixed(3)} MiB; headroom ${((FREE_WORKER_LIMIT - gzipBytes) / 1024 / 1024).toFixed(3)} MiB`,
)
