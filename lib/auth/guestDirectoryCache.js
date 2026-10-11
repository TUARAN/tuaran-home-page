import { getGuestDirectoryStats, listGuestDirectory } from './guestDirectory.js'

// Per-isolate, bounded cache. Call only AFTER owner authorization on every request.
// A cold isolate still uses the indexed page query and single-row stats query.
export function createGuestDirectoryCache({ now = Date.now, ttl = 60_000, maxEntries = 100 } = {}) {
  const databases = new WeakMap()
  return async function read(db, options = {}, fresh = false) {
    let cache = databases.get(db)
    if (!cache) {
      cache = new Map()
      databases.set(db, cache)
    }
    const key = JSON.stringify([options.limit || 30, options.status || 'all', options.cursor || ''])
    const time = now()
    if (fresh) cache.clear()
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= time) cache.delete(key)
    }
    if (cache.has(key)) return cache.get(key).promise

    while (cache.size >= maxEntries) cache.delete(cache.keys().next().value)
    const entry = { expiresAt: time + ttl }
    entry.promise = Promise.all([
      listGuestDirectory(db, options),
      getGuestDirectoryStats(db),
    ]).then(([directory, stats]) => ({ ...directory, stats, generatedAt: now() }))
    cache.set(key, entry)
    try {
      return await entry.promise
    } catch (error) {
      if (cache.get(key) === entry) cache.delete(key)
      throw error
    }
  }
}
