import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOTS = ['app', 'lib'].map((directory) => path.resolve(process.cwd(), directory))
const SOURCE_EXTENSIONS = new Set(['.css', '.js', '.jsx', '.ts', '.tsx', '.mdx'])
const VALID_OPACITY_STEPS = new Set(Array.from({ length: 21 }, (_, index) => index * 5))
const OPACITY_CLASS_RE = /\b(?:[\w-]+:)*(?:bg|text|border|ring|from|via|to)-(?:\[[^\]\n]+\]|[a-z][a-z0-9-]*)\/(\d{1,3})\b/g
const SITE_TOKEN_DEFINITION_RE = /(--site-[a-z0-9-]+)\s*:/g
const SITE_TOKEN_REFERENCE_RE = /var\((--site-[a-z0-9-]+)(?:\s*,[^)]*)?\)/g

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return listSourceFiles(fullPath)
    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [fullPath] : []
  }))
  return nested.flat()
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length
}

const failures = []
const tokenDefinitions = new Set()
const tokenReferences = []
const files = (await Promise.all(ROOTS.map(listSourceFiles))).flat()

for (const file of files) {
  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(SITE_TOKEN_DEFINITION_RE)) tokenDefinitions.add(match[1])
  for (const match of source.matchAll(SITE_TOKEN_REFERENCE_RE)) {
    tokenReferences.push({
      file: path.relative(process.cwd(), file),
      line: lineNumberAt(source, match.index),
      token: match[1],
    })
  }
  for (const match of source.matchAll(OPACITY_CLASS_RE)) {
    const opacity = Number(match[1])
    if (VALID_OPACITY_STEPS.has(opacity)) continue
    failures.push({
      file: path.relative(process.cwd(), file),
      line: lineNumberAt(source, match.index),
      token: match[0],
      suggestion: match[0].replace(/\/(\d+)$/, (_, value) => `/[${Number(value) / 100}]`),
    })
  }
}

const missingTokens = tokenReferences.filter((reference) => !tokenDefinitions.has(reference.token))

if (failures.length) {
  console.error('[tailwind-opacity] unsupported opacity modifiers found:')
  for (const failure of failures) {
    console.error(`  ${failure.file}:${failure.line} ${failure.token} -> ${failure.suggestion}`)
  }
  console.error('Use a built-in 5-point opacity step or arbitrary syntax such as text-white/[0.68].')
  process.exit(1)
}

console.log('[tailwind-opacity] opacity modifiers ok')

if (missingTokens.length) {
  console.error('[theme-token] undefined site theme tokens found:')
  for (const failure of missingTokens) {
    console.error(`  ${failure.file}:${failure.line} var(${failure.token})`)
  }
  process.exit(1)
}

console.log('[theme-token] site theme tokens ok')
