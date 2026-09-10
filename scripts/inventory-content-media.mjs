#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = fileURLToPath(new URL('../', import.meta.url))
const outputIndex = process.argv.indexOf('--output')
if (outputIndex < 0 || !process.argv[outputIndex + 1]) throw new Error('Usage: node scripts/inventory-content-media.mjs --output /absolute/path/media-inventory.json')
const directories = ['feed', 'images', 'videos', 'audio']
function walk(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) return walk(filename)
    return entry.isFile() ? [filename] : []
  })
}
const files = directories.flatMap((directory) => walk(path.join(root, 'public', directory))).map((filename) => {
  const data = fs.readFileSync(filename)
  return {
    path: path.relative(root, filename), url: '/' + path.relative(path.join(root, 'public'), filename),
    bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'),
    references: [], migrationStatus: 'unreviewed',
  }
}).sort((a, b) => b.bytes - a.bytes)

// Literal reference inventory is evidence, not proof of reachability. Runtime
// URL builders and external links still need review before any deletion.
const skipped = []
for (const directory of ['app', 'lib', 'research', 'data', 'docs']) {
  for (const filename of walk(path.join(root, directory))) {
    if (!/\.(?:js|jsx|mjs|md|json|css)$/.test(filename) || filename.endsWith('.enc.json')) continue
    const relative = path.relative(root, filename)
    if (fs.statSync(filename).size > 2 * 1024 * 1024) { skipped.push(relative); continue }
    const source = fs.readFileSync(filename, 'utf8')
    for (const item of files) {
      const basename = path.basename(item.path)
      if (!source.includes(item.url) && !source.includes(basename)) continue
      source.split('\n').forEach((line, index) => {
        if (line.includes(item.url) || line.includes(basename)) item.references.push({ file: relative, line: index + 1 })
      })
    }
  }
}
const byHash = new Map()
for (const item of files) byHash.set(item.sha256, [...(byHash.get(item.sha256) || []), item.path])
const report = {
  version: 1, status: 'inventory only; no uploads, reference edits or deletions',
  scanMethod: 'literal URL or basename references; encrypted JSON and source files over 2 MiB excluded',
  totalFiles: files.length, totalBytes: files.reduce((total, item) => total + item.bytes, 0),
  directories: Object.fromEntries(directories.map((directory) => {
    const group = files.filter((item) => item.path.startsWith(`public/${directory}/`))
    return [directory, { files: group.length, bytes: group.reduce((total, item) => total + item.bytes, 0) }]
  })),
  duplicates: [...byHash.values()].filter((group) => group.length > 1), skipped, files,
}
const output = path.resolve(process.argv[outputIndex + 1])
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
console.log(`[media-inventory] ${report.totalFiles} files; ${(report.totalBytes / 1024 / 1024).toFixed(2)} MiB; ${report.duplicates.length} duplicate groups; ${output}`)
