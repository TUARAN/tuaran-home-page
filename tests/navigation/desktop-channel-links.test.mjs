import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const headerSource = await readFile(
  new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url),
  'utf8'
)

test('desktop channel triggers link to their first visible submenu entry', () => {
  assert.match(headerSource, /const landingItem = sections\[0\]\?\.items\[0\]/)
  assert.match(headerSource, /const landingHref = landingItem\?\.href \|\| channel\.href/)
  assert.match(headerSource, /<Link[\s\S]*?href=\{landingHref\}[\s\S]*?className=\{\[[\s\S]*?'site-nav-trigger'/)
  assert.match(headerSource, /onMouseEnter=\{handleMouseEnter\}/)
})
