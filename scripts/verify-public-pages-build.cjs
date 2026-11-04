#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const { formatMiB, printWorkerSizeReport, writeWorkerSizeReport } = require('./worker-size.cjs')
const {
  REPOSITORY_RAW_LIMIT_BYTES,
  evaluateWorkerSize,
  loadWorkerSizeBaseline,
} = require('./worker-size-policy.cjs')

const root = path.resolve(__dirname, '..')
const staticRoot = path.join(root, '.vercel', 'output', 'static')
const workerRoot = path.join(staticRoot, '_worker.js')
const buildLogPath = path.join(workerRoot, 'nop-build-log.json')
const PAGES_FILE_LIMIT_BYTES = 25 * 1024 * 1024

function findOversizedStaticFiles(directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '_worker.js') continue
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      findOversizedStaticFiles(target, found)
    } else if (entry.isFile() && fs.statSync(target).size > PAGES_FILE_LIMIT_BYTES) {
      found.push(target)
    }
  }
  return found
}

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

const oversizedStaticFiles = findOversizedStaticFiles(staticRoot)
if (oversizedStaticFiles.length) {
  throw new Error(
    `Public Pages static file exceeds 25 MiB:\n- ${oversizedStaticFiles
      .map((file) => path.relative(staticRoot, file))
      .join('\n- ')}`,
  )
}

const measurement = printWorkerSizeReport({
  label: 'public',
  workerRoot,
  hardLimitBytes: REPOSITORY_RAW_LIMIT_BYTES,
})
const evaluation = evaluateWorkerSize({
  measurement,
  baseline: loadWorkerSizeBaseline(root, 'public'),
})
writeWorkerSizeReport({ label: 'public', workerRoot, measurement, evaluation })

for (const warning of evaluation.warnings) console.warn(`[worker-size] warning: ${warning}`)
if (evaluation.errors.length) {
  throw new Error(`Public Worker size policy failed:\n- ${evaluation.errors.join('\n- ')}`)
}

console.log(
  `[verify-public-pages-build] ${routes.length} Edge routes; raw budget headroom ${formatMiB(REPOSITORY_RAW_LIMIT_BYTES - measurement.rawBytes)}`,
)
