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
const workerRoot = path.join(root, '.vercel', 'output', 'static', '_worker.js')
const buildLogPath = path.join(workerRoot, 'nop-build-log.json')

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
