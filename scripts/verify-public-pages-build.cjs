#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const { MIB, formatMiB, printWorkerSizeReport } = require('./worker-size.cjs')

const root = path.resolve(__dirname, '..')
const workerRoot = path.join(root, '.vercel', 'output', 'static', '_worker.js')
const buildLogPath = path.join(workerRoot, 'nop-build-log.json')
const PUBLIC_WORKER_BUDGET = 2.75 * MIB

if (!fs.existsSync(buildLogPath)) {
  throw new Error(`Public Pages build log not found: ${buildLogPath}`)
}

const buildLog = JSON.parse(fs.readFileSync(buildLogPath, 'utf8'))
const routes = (buildLog.buildFiles?.functions?.edge || [])
  .map((entry) => entry.route?.path)
  .filter(Boolean)
const leakedAdminRoutes = routes.filter(
  (route) => route === '/admin' || route.startsWith('/admin/') || route.startsWith('/api/admin/'),
)

if (leakedAdminRoutes.length) {
  throw new Error(`Public Pages build unexpectedly contains Admin routes: ${leakedAdminRoutes.join(', ')}`)
}

const { gzipBytes } = printWorkerSizeReport({
  label: 'public',
  workerRoot,
  hardLimitBytes: PUBLIC_WORKER_BUDGET,
})

if (gzipBytes >= PUBLIC_WORKER_BUDGET) {
  throw new Error(
    `Public Worker gzip estimate ${formatMiB(gzipBytes)} exceeds the repository budget ${formatMiB(PUBLIC_WORKER_BUDGET)}`,
  )
}

console.log(
  `[verify-public-pages-build] ${routes.length} Edge routes; budget headroom ${formatMiB(PUBLIC_WORKER_BUDGET - gzipBytes)}`,
)
