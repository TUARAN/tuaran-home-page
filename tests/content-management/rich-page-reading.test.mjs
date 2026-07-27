import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ENGINEERING_WORKS,
  getRichPagePvKey,
} from '../../lib/engineeringWorks.js'

const RICH_PAGE_FRAME_PATH = new URL(
  '../../app/(site)/components/RichPageFrame.jsx',
  import.meta.url,
)
const CONTENT_REGISTRY_PATH = new URL('../../lib/contentRegistry.js', import.meta.url)
const DIRECTORY_PATH = new URL(
  '../../app/(site)/components/GroupedDirectoryPage.jsx',
  import.meta.url,
)

test('every rich page resolves to a registered reading-count category', async () => {
  const registry = await readFile(CONTENT_REGISTRY_PATH, 'utf8')

  for (const work of ENGINEERING_WORKS) {
    const key = getRichPagePvKey(work)
    assert.match(key, /^(rich-page|resource)\/[a-z0-9-]+$/)
  }

  assert.match(registry, /CONTENT_PV_CATEGORIES = new Set\(\[[^\]]*'rich-page'/)
  assert.match(registry, /ENGINEERING_WORKS\.flatMap/)
  assert.match(registry, /getRichPagePvKey\(work\)/)
})

test('rich pages report visits and the directory batch-loads counts', async () => {
  const [frame, directory] = await Promise.all([
    readFile(RICH_PAGE_FRAME_PATH, 'utf8'),
    readFile(DIRECTORY_PATH, 'utf8'),
  ])

  assert.match(frame, /getRichPagePvKey\(work\)/)
  assert.match(frame, /<ContentPvBeacon category=\{pvCategory\} slug=\{pvSlug\} \/>/)
  assert.match(directory, /fetch\(`\/api\/research-pv\?keys=/)
  assert.match(directory, /阅读量 \$\{formatPv\(pv\)\}/)
})
