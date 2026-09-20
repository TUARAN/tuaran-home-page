import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageSource = await readFile(
  new URL('../../app/(site)/notifications/page.jsx', import.meta.url),
  'utf8'
)
const clientSource = await readFile(
  new URL('../../app/(site)/notifications/NotificationsClient.jsx', import.meta.url),
  'utf8'
)
const apiSource = await readFile(
  new URL('../../app/api/notifications/route.js', import.meta.url),
  'utf8'
)
const headerSource = await readFile(
  new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url),
  'utf8'
)
const navSource = await readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8')
const mobileNavSource = await readFile(new URL('../../lib/siteMobileNav.js', import.meta.url), 'utf8')

test('notification center page is noindex and renders the client', () => {
  assert.match(pageSource, /robots: \{ index: false, follow: false \}/)
  assert.match(pageSource, /<NotificationsClient \/>/)
})

test('notification center lists notifications with unread state and load more', () => {
  assert.match(clientSource, /全部标为已读/)
  assert.match(clientSource, /加载更多/)
  assert.match(clientSource, /PAGE_SIZE = 10/)
  assert.match(clientSource, /item\.readAt/)
})

test('notifications API supports pagination and returns total', () => {
  assert.match(apiSource, /LIMIT \?2 OFFSET \?3/)
  assert.match(apiSource, /COUNT\(\*\) AS total/)
  assert.match(apiSource, /total:/)
})

test('notification center is reachable without activating the community channel', () => {
  assert.match(headerSource, /href="\/notifications"/)
  assert.match(headerSource, /查看全部通知/)
  assert.doesNotMatch(navSource, /p\?\.startsWith\('\/notifications'\)/)
  assert.match(mobileNavSource, /pathname\?\.startsWith\('\/notifications'\)/)
})
