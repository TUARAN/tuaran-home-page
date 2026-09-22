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
const commentsSource = await readFile(
  new URL('../../app/(site)/components/ArticleComments.jsx', import.meta.url),
  'utf8'
)
const arrivalSource = await readFile(
  new URL('../../app/(site)/components/NotificationArrival.jsx', import.meta.url),
  'utf8'
)
const providerSource = await readFile(
  new URL('../../app/(site)/components/SessionProvider.jsx', import.meta.url),
  'utf8'
)
const weeklySource = await readFile(new URL('../../app/(admin)/admin/content-weekly/ContentWeeklyClient.jsx', import.meta.url), 'utf8')
const opsSource = await readFile(new URL('../../app/(admin)/admin/ops/OpsConsole.jsx', import.meta.url), 'utf8')
const commentsApiSource = await readFile(
  new URL('../../app/api/comments/route.js', import.meta.url),
  'utf8'
)

test('notification center page is noindex and renders the client', () => {
  assert.match(pageSource, /robots: \{ index: false, follow: false \}/)
  assert.match(pageSource, /<NotificationsClient \/>/)
})

test('notification center lists notifications with unread state and load more', () => {
  assert.match(clientSource, /全部标为已读/)
  assert.match(clientSource, /加载更多/)
  assert.match(clientSource, /PAGE_SIZE = 10/)
  assert.match(clientSource, /item\.readAt/)
  assert.match(clientSource, /notification-inbox-item/)
  assert.match(clientSource, /destinationLabel/)
  assert.match(clientSource, /typeLabel/)
})

test('notifications API maps titles, destinations, and never returns a null href', () => {
  assert.match(apiSource, /presentNotification/)
  assert.match(apiSource, /destinationLabel/)
  assert.match(apiSource, /typeLabel/)
  assert.doesNotMatch(apiSource, /href: null/)
})

test('notifications API supports pagination and returns total', () => {
  assert.match(apiSource, /LIMIT \? OFFSET \?/)
  assert.match(apiSource, /COUNT\(\*\) AS total/)
  assert.match(apiSource, /total:/)
})

test('notification center is reachable without activating the community channel', () => {
  assert.match(headerSource, /href="\/notifications"/)
  assert.match(headerSource, /查看全部通知/)
  assert.match(headerSource, /item\.href \|\| '\/notifications'/)
  assert.doesNotMatch(headerSource, /item\.href \|\| '\/community'/)
  assert.doesNotMatch(navSource, /p\?\.startsWith\('\/notifications'\)/)
  assert.match(mobileNavSource, /pathname\?\.startsWith\('\/notifications'\)/)
})

test('article comments only surface this article’s interaction notices and scroll to the hash', () => {
  assert.match(commentsSource, /isInteractionNotification/)
  assert.match(commentsSource, /item\.articleKey === articleKey/)
  assert.match(arrivalSource, /is-notification-target/)
  assert.match(commentsSource, /#comment-\(\\d\+\)/)
  assert.match(commentsSource, /discussion-notification-dot/)
  assert.doesNotMatch(commentsSource, /IntersectionObserver/)
  assert.match(commentsSource, /commentId/)
  assert.match(commentsApiSource, /searchParams\.get\('commentId'\)/)
  assert.match(commentsApiSource, /c\.article_key = \?1 AND c\.id = \?2/)
  assert.match(apiSource, /article_key = \?/)
})

test('recent notifications show unread items and reading waits for the destination', () => {
  assert.match(providerSource, /unreadOnly=1&limit=2/)
  assert.match(headerSource, /items\.filter\(\(item\) => !item\.readAt\)/)
  assert.match(apiSource, /notificationOpenHref/)
  assert.match(arrivalSource, /targetInView/)
  assert.match(arrivalSource, /dataset\.notificationReady/)
  assert.match(arrivalSource, /markNotificationsRead\(\{ id: notificationId \}\)/)
  assert.doesNotMatch(headerSource, /markNotificationsRead\?\.\(\{ id: item\.id \}\)/)
  assert.match(weeklySource, /notificationTargetReady=\{!loading && !error/)
  assert.match(opsSource, /notificationTargetReady=\{!loading && !error/)
})
