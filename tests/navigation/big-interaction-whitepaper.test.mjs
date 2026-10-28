import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('whitepaper exposes chapter progress and a visible reading count', async () => {
  const [page, nav] = await Promise.all([
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/ChapterNav.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(page, /<ContentPvBeacon category="resource" slug="big-interaction-whitepaper" display prefix="·" \/>/)
  assert.match(page, /<ChapterNav chapters=\{chapters\} \/>/)
  assert.match(page, /id="framework"/)
  assert.match(page, /id="boundaries"/)
  assert.match(page, /大睡理论/)
  assert.match(page, /理解边界/)
  assert.match(nav, /role="progressbar"/)
  assert.match(nav, /aria-current=\{chapter\.id === activeId \? 'true' : undefined\}/)
})
