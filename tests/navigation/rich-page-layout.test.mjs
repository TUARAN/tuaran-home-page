import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ENGINEERING_WORKS,
  INTERACTIVE_DIRECTORY_WORKS,
  getRichPagePresentation,
} from '../../lib/site/engineeringWorks.js'

test('every interactive directory work uses the independent full-width page frame', () => {
  assert.equal(getRichPagePresentation(null).id, 'site')
  assert.ok(INTERACTIVE_DIRECTORY_WORKS.length > 0)
  for (const work of INTERACTIVE_DIRECTORY_WORKS) {
    assert.equal(getRichPagePresentation(work).id, 'feature', work.href)
  }
  assert.equal(
    getRichPagePresentation(ENGINEERING_WORKS.find((work) => work.id === 'codex-reset')).id,
    'site',
  )
})

test('the interactive directory keeps the site header and full width', async () => {
  const [chrome, directory, showcase, css] = await Promise.all([
    readFile(new URL('../../app/(site)/components/LayoutChromeControls.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/rich-pages/RichPagesDirectory.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/ShowcaseDirectory.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/globals.css', import.meta.url), 'utf8'),
  ])
  assert.match(chrome, /isInteractivePage = pathname === '\/rich-pages' \|\|/)
  assert.match(chrome, /isFeaturePage && !isInteractivePage/)
  assert.match(chrome, /if \(hideChrome \|\| isInteractivePage \|\| pathname === '\/'\) return null/)
  assert.match(directory, /fullWidth: true/)
  assert.match(showcase, /config\.fullWidth \? 'w-full' : 'max-w-\[1240px\]'/)
  assert.match(css, /\.rich-page-frame--feature > :where\(main, div\):first-of-type \{[\s\S]*?max-width: none !important/)
})
