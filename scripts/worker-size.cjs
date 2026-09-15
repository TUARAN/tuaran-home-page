const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const MIB = 1024 * 1024

function collectWorkerFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) collectWorkerFiles(filePath, files)
    else if (entry.name !== 'nop-build-log.json') files.push(filePath)
  }
  return files
}

function measureWorker(workerRoot) {
  const files = collectWorkerFiles(workerRoot).map((filePath) => {
    const contents = fs.readFileSync(filePath)
    return {
      filePath,
      rawBytes: contents.length,
      gzipBytes: zlib.gzipSync(contents, { level: 9 }).length,
    }
  })
  files.sort((left, right) => right.gzipBytes - left.gzipBytes)
  return {
    files,
    rawBytes: files.reduce((total, file) => total + file.rawBytes, 0),
    gzipBytes: files.reduce((total, file) => total + file.gzipBytes, 0),
  }
}

function formatMiB(bytes) {
  return `${(bytes / MIB).toFixed(3)} MiB`
}

function printWorkerSizeReport({ label, workerRoot, hardLimitBytes, top = 20 }) {
  const measurement = measureWorker(workerRoot)
  console.log(
    `[worker-size] ${label}: raw ${formatMiB(measurement.rawBytes)}; gzip ${formatMiB(measurement.gzipBytes)}; raw headroom ${formatMiB(hardLimitBytes - measurement.rawBytes)}`,
  )
  for (const file of measurement.files.slice(0, top)) {
    console.log(
      `[worker-size] ${(file.gzipBytes / 1024).toFixed(1)} KiB gzip ${path.relative(workerRoot, file.filePath)}`,
    )
  }
  return measurement
}

function writeWorkerSizeReport({ label, workerRoot, measurement, evaluation, top = 20 }) {
  const outputPath = path.resolve(workerRoot, '..', '..', `worker-size-${label}.json`)
  const report = {
    generatedAt: new Date().toISOString(),
    target: label,
    totals: {
      rawBytes: measurement.rawBytes,
      gzipBytes: measurement.gzipBytes,
    },
    limits: evaluation.limits,
    baseline: evaluation.baseline,
    delta: evaluation.delta,
    warnings: evaluation.warnings,
    errors: evaluation.errors,
    files: measurement.files.slice(0, top).map((file) => ({
      path: path.relative(workerRoot, file.filePath),
      rawBytes: file.rawBytes,
      gzipBytes: file.gzipBytes,
    })),
  }
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`[worker-size] wrote ${path.relative(path.resolve(workerRoot, '..', '..', '..'), outputPath)}`)
  return outputPath
}

module.exports = {
  MIB,
  collectWorkerFiles,
  formatMiB,
  measureWorker,
  printWorkerSizeReport,
  writeWorkerSizeReport,
}
