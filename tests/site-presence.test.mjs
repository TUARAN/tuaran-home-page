import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('site presence throttles D1 writes and keeps a bounded active window', async () => {
  const [route, migration, presence] = await Promise.all([
    read('../app/api/presence/route.js'),
    read('../migrations/0099_site_presence.sql'),
    read('../lib/sitePresence.js'),
  ])

  assert.match(route, /ON CONFLICT\(visitor_key\) DO UPDATE/)
  assert.match(route, /site_presence\.last_seen < \?3/)
  assert.match(route, /SELECT COUNT\(\*\) AS count/)
  assert.doesNotMatch(route, /DELETE FROM site_presence/)
  assert.match(route, /cache-control': 'no-store'/)
  assert.match(migration, /CREATE TABLE IF NOT EXISTS site_presence/)
  assert.match(migration, /idx_site_presence_last_seen/)
  assert.match(presence, /SITE_PRESENCE_HEARTBEAT_MS = 10 \* 60 \* 1000/)
  assert.match(presence, /SITE_PRESENCE_WINDOW_MS = 25 \* 60 \* 1000/)
  assert.match(presence, /SITE_PRESENCE_MIN_WRITE_INTERVAL_MS = 8 \* 60 \* 1000/)
})

test('only the home page sends presence heartbeats and displays the count', async () => {
  const [layout, provider, footer, home] = await Promise.all([
    read('../app/(site)/layout.jsx'),
    read('../app/(site)/components/SitePresenceProvider.jsx'),
    read('../app/(site)/components/SiteFooter.jsx'),
    read('../app/(site)/page.jsx'),
  ])

  assert.doesNotMatch(layout, /SitePresenceProvider/)
  assert.match(home, /<SitePresenceProvider>/)
  assert.match(provider, /fetch\('\/api\/presence'/)
  assert.match(provider, /document\.visibilityState !== 'visible'/)
  assert.match(footer, /当前 \$\{onlineCount\} 人在线/)
  assert.match(home, /<SiteFooter[^>]*showOnline/)
  assert.match(home, /md:hidden[\s\S]*<OnlinePresenceStatus/)
})
