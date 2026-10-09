import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSION = '0.1.0'
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(projectRoot, 'tools', 'oa-batch-submit-extension')
const outputDir = path.join(projectRoot, 'output')
const archiveName = `protal-todo-assistant-extension-v${VERSION}.zip`
const archivePath = path.join(outputDir, archiveName)
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'protal-todo-assistant-'))
const packageDir = path.join(temporaryRoot, 'protal-todo-assistant-extension')

const PACKAGE_FILES = [
  'manifest.json',
  'background.js',
  'automation-core.js',
  'content.js',
  'README.md',
]

try {
  await mkdir(packageDir, { recursive: true })
  for (const file of PACKAGE_FILES) {
    await cp(path.join(sourceDir, file), path.join(packageDir, file))
  }

  await mkdir(outputDir, { recursive: true })
  await rm(archivePath, { force: true })
  execFileSync('zip', ['-X', '-q', '-r', archivePath, path.basename(packageDir)], { cwd: temporaryRoot })
  process.stdout.write(`已生成 ${path.relative(projectRoot, archivePath)}\n`)
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
