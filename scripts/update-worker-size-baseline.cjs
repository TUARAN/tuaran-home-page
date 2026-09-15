#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const target = process.argv[2]

if (!['public', 'admin'].includes(target)) {
  throw new Error('Usage: npm run worker-size:baseline -- public|admin')
}

const reportPath = path.join(root, '.vercel', 'output', `worker-size-${target}.json`)
const baselinePath = path.join(root, 'scripts', 'worker-size-baselines.json')

if (!fs.existsSync(reportPath)) {
  throw new Error(`Worker size report not found for ${target}: ${reportPath}`)
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
if (report.target !== target || !Number.isFinite(report.totals?.rawBytes) || !Number.isFinite(report.totals?.gzipBytes)) {
  throw new Error(`Invalid worker size report: ${reportPath}`)
}

const baselines = fs.existsSync(baselinePath)
  ? JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  : {}

baselines[target] = {
  rawBytes: report.totals.rawBytes,
  gzipBytes: report.totals.gzipBytes,
  recordedAt: new Date().toISOString(),
}

fs.writeFileSync(baselinePath, `${JSON.stringify(baselines, null, 2)}\n`)
console.log(`[worker-size-baseline] updated ${target}: raw ${report.totals.rawBytes} bytes; gzip ${report.totals.gzipBytes} bytes`)
