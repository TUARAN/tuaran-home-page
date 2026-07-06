import { createHash } from 'node:crypto'
import { createReadStream, existsSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourceDir = path.join(root, 'desktop-dist')

const artifacts = [
  {
    platform: 'macOS Apple Silicon',
    file: '2aran-desktop-macos-arm64-v0.1.0.dmg',
  },
  {
    platform: 'macOS Intel',
    file: '2aran-desktop-macos-x64-v0.1.0.dmg',
  },
  {
    platform: 'Windows',
    file: '2aran-desktop-windows-v0.1.0.exe',
  },
]

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`
}

function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(file)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

let found = 0

for (const item of artifacts) {
  const filePath = path.join(sourceDir, item.file)
  if (!existsSync(filePath)) {
    console.warn(`[desktop] ${item.platform} artifact not found: desktop-dist/${item.file}`)
    continue
  }

  found += 1
  const size = statSync(filePath).size
  const digest = await sha256(filePath)
  console.log(`[desktop] ${item.platform}: desktop-dist/${item.file} (${formatMiB(size)}) sha256=${digest}`)
}

if (!found) {
  console.error('[desktop] no desktop artifacts found in desktop-dist/')
  process.exit(1)
}

console.log('[desktop] installers are intentionally not copied to public/; upload large artifacts to R2 downloads/.')
