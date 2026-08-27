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

function printWorkerSizeReport({ label, workerRoot, hardLimitBytes, top = 10 }) {
  const measurement = measureWorker(workerRoot)
  const headroom = hardLimitBytes - measurement.gzipBytes
  console.log(
    `[worker-size] ${label}: gzip ${formatMiB(measurement.gzipBytes)}; raw ${formatMiB(measurement.rawBytes)}; headroom ${formatMiB(headroom)}`,
  )
  for (const file of measurement.files.slice(0, top)) {
    console.log(
      `[worker-size] ${(file.gzipBytes / 1024).toFixed(1)} KiB gzip ${path.relative(workerRoot, file.filePath)}`,
    )
  }
  return measurement
}

module.exports = {
  MIB,
  collectWorkerFiles,
  formatMiB,
  measureWorker,
  printWorkerSizeReport,
}
