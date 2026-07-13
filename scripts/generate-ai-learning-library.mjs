import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

const projectRoot = process.cwd()
const sourceRoot = path.resolve(
  process.env.AI_LEARNING_LIBRARY_DIR || path.join(projectRoot, '..', 'AI-Learning-Library'),
)
const sourcePath = path.join(sourceRoot, 'src', 'App.jsx')
const outputPath = path.join(projectRoot, 'lib', 'aiLearningLibraryData.js')

const source = await readFile(sourcePath, 'utf8')
const marker = 'const books = '
const start = source.indexOf(marker)
if (start < 0) throw new Error('Cannot find books array in AI-Learning-Library/src/App.jsx')

const arrayStart = source.indexOf('[', start + marker.length)
const arrayEnd = source.indexOf('\n];', arrayStart)
if (arrayStart < 0 || arrayEnd < 0) throw new Error('Cannot parse books array')

const arrayLiteral = source.slice(arrayStart, arrayEnd + 2)
const books = vm.runInNewContext(`(${arrayLiteral})`, Object.create(null), { timeout: 1000 })
const sourceCommit = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

const output = `/**
 * 由 scripts/generate-ai-learning-library.mjs 从本地 AI-Learning-Library 生成。
 * 不要手工编辑；更新源项目后运行 npm run library:sync。
 */
export const AI_LEARNING_LIBRARY_META = ${JSON.stringify({
  sourceRepo: 'https://github.com/TUARAN/AI-Learning-Library',
  sourceSite: 'https://matrix-ai-pdfs.pages.dev/',
  sourceCommit,
  generatedAt: new Date().toISOString(),
  copyrightNotice: '仅分享学习，无商业用途，侵权删除。',
}, null, 2)}

export const AI_LEARNING_BOOKS = ${JSON.stringify(books, null, 2)}
`

await writeFile(outputPath, output)
console.log(`[ai-learning-library] generated ${books.length} books at ${path.relative(projectRoot, outputPath)}`)
