import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const removed = []

for (const name of fs.readdirSync(root)) {
  if (!name.startsWith('.next-')) continue
  fs.rmSync(path.join(root, name), { recursive: true, force: true })
  removed.push(name)
}

if (removed.length === 0) {
  console.log('no isolated .next-* directories')
} else {
  console.log(`removed ${removed.length}: ${removed.join(', ')}`)
}
