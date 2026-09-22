import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const siteDir = fileURLToPath(new URL('../../app/(site)/', import.meta.url))

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(entryPath)
    return /\.(js|jsx)$/.test(entry.name) ? [entryPath] : []
  }))
  return files.flat()
}

test('public page containers use the site background instead of a fixed light color', async () => {
  const files = await sourceFiles(siteDir)
  const violations = []

  for (const file of files) {
    // SpaceX's dark timeline is an intentionally immersive canvas.
    if (file.endsWith('/spacex/SpaceXTimelineClient.jsx')) continue
    const source = await readFile(file, 'utf8')
    for (const match of source.matchAll(/<main\b[^>]*className="([^"]*)"/g)) {
      if (/(?:^|\s)bg-\[#[\da-fA-F]{6}\]/.test(match[1])) {
        violations.push(path.relative(siteDir, file))
      }
    }
  }

  assert.deepEqual(violations, [])
})

test('CSS module page canvases with former paper colors follow the site theme', async () => {
  const modules = [
    'guoqi-guodan/guoqi-guodan.module.css',
    'network-access-guide/network-access-guide.module.css',
    'quiz/quiz.module.css',
    'workbuddy-harness/workbuddy-harness.module.css',
    'works/works-museum.module.css',
  ]

  for (const modulePath of modules) {
    const source = await readFile(path.join(siteDir, modulePath), 'utf8')
    const root = source.match(/\.(?:page|root)\s*\{([^}]*)\}/)?.[1]
    assert.ok(root?.includes('var(--page-bg)'), `${modulePath} should use the site background`)
  }
})

test('web-llm does not shadow the site background token', async () => {
  const stylesheet = await readFile(new URL('../../app/(web-llm)/web-llm/webllm.css', import.meta.url), 'utf8')
  assert.doesNotMatch(stylesheet, /--page-bg\s*:/)
  assert.match(stylesheet, /#web-llm-app-shell\s*\{[^}]*background:\s*var\(--page-bg\)/)
})
