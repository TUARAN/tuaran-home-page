import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../../', import.meta.url)

test('desktop installers redirect to the public object after unlock', async () => {
  const route = await readFile(new URL('app/api/resources/deliver/route.js', root), 'utf8')
  assert.match(route, /publicUrlFor/)
  assert.match(route, /if \(!embedded && object\)/)
  const redirectAt = route.indexOf('status: 302')
  const streamAt = route.indexOf("new Response(body")
  assert.ok(redirectAt > 0 && streamAt > redirectAt)
})

test('desktop download links follow the delivery redirect', async () => {
  const chooser = await readFile(
    new URL('app/(site)/resources/2aran-desktop/DesktopDownloadChooser.jsx', root),
    'utf8',
  )
  assert.doesNotMatch(chooser, /\sdownload\b/)
  assert.match(chooser, /href=\{recommended\.href\}/)
  assert.match(chooser, /href=\{item\.href\}/)
})
