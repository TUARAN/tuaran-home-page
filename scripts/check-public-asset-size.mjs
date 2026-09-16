import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { evaluatePublicAssets, formatMiB, MAX_FILE_BYTES } from './public-asset-policy.mjs'

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

const files = []
for (const file of await walk(PUBLIC_DIR)) {
  const info = await stat(file)
  files.push({
    file: path.relative(PUBLIC_DIR, file),
    size: info.size,
  })
}

const result = evaluatePublicAssets(files)
for (const warning of result.warnings) {
  console.warn(`[asset-size] warning: ${warning}`)
}
if (result.errors.length) {
  for (const error of result.errors) {
    console.error(`[asset-size] ${error}`)
  }
  process.exit(1)
}

console.log(
  `[asset-size] public/ assets ok: ${result.fileCount} files, every file is <= ${formatMiB(MAX_FILE_BYTES)}.`,
)
