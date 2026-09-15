const fs = require('fs')
const path = require('path')

const { MIB, formatMiB } = require('./worker-size.cjs')

const PLATFORM_RAW_LIMIT_BYTES = 64 * MIB
const REPOSITORY_RAW_LIMIT_BYTES = 48 * MIB
const WARNING_DELTA_BYTES = 128 * 1024
const REGRESSION_MIN_BYTES = 512 * 1024
const REGRESSION_MIN_RATIO = 0.05

function loadWorkerSizeBaseline(root, target) {
  const baselinePath = path.join(root, 'scripts', 'worker-size-baselines.json')
  if (!fs.existsSync(baselinePath)) return null
  const baselines = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  return baselines[target] || null
}

function evaluateWorkerSize({ measurement, baseline }) {
  const warnings = []
  const errors = []
  const delta = baseline
    ? {
        rawBytes: measurement.rawBytes - baseline.rawBytes,
        gzipBytes: measurement.gzipBytes - baseline.gzipBytes,
        rawRatio: baseline.rawBytes > 0
          ? (measurement.rawBytes - baseline.rawBytes) / baseline.rawBytes
          : null,
      }
    : null

  if (measurement.rawBytes >= REPOSITORY_RAW_LIMIT_BYTES) {
    errors.push(
      `Worker raw size ${formatMiB(measurement.rawBytes)} reached the repository limit ${formatMiB(REPOSITORY_RAW_LIMIT_BYTES)}`,
    )
  }

  if (!baseline) {
    warnings.push('Worker size baseline is missing; run the explicit baseline update command after a reviewed build')
  } else {
    const materialRegression = delta.rawBytes >= REGRESSION_MIN_BYTES
      && delta.rawRatio >= REGRESSION_MIN_RATIO

    if (materialRegression) {
      errors.push(
        `Worker raw size grew by ${formatMiB(delta.rawBytes)} (${(delta.rawRatio * 100).toFixed(1)}%) from the reviewed baseline`,
      )
    } else if (delta.rawBytes >= WARNING_DELTA_BYTES || delta.gzipBytes >= WARNING_DELTA_BYTES) {
      warnings.push(
        `Worker size increased from baseline: raw ${formatSignedMiB(delta.rawBytes)}, gzip ${formatSignedMiB(delta.gzipBytes)}`,
      )
    }
  }

  return {
    baseline,
    delta,
    limits: {
      platformRawBytes: PLATFORM_RAW_LIMIT_BYTES,
      repositoryRawBytes: REPOSITORY_RAW_LIMIT_BYTES,
      warningDeltaBytes: WARNING_DELTA_BYTES,
      regressionMinBytes: REGRESSION_MIN_BYTES,
      regressionMinRatio: REGRESSION_MIN_RATIO,
    },
    warnings,
    errors,
  }
}

function formatSignedMiB(bytes) {
  const sign = bytes > 0 ? '+' : ''
  return `${sign}${formatMiB(bytes)}`
}

module.exports = {
  PLATFORM_RAW_LIMIT_BYTES,
  REPOSITORY_RAW_LIMIT_BYTES,
  WARNING_DELTA_BYTES,
  REGRESSION_MIN_BYTES,
  REGRESSION_MIN_RATIO,
  evaluateWorkerSize,
  loadWorkerSizeBaseline,
}
