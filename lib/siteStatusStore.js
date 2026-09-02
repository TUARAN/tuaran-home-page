import { normalizeMonitorState, normalizeSiteStatus, operationalSiteStatus } from './siteStatusCore'

export const SITE_STATUS_OBJECT_KEY = 'site-status/current.json'
export const SITE_STATUS_MONITOR_OBJECT_KEY = 'site-status/monitor.json'

async function readJson(bucket, key) {
  if (!bucket) return null
  const object = await bucket.get(key)
  if (!object) return null
  try {
    return await object.json()
  } catch {
    return JSON.parse(await object.text())
  }
}

async function writeJson(bucket, key, value) {
  if (!bucket) throw new Error('SITE_STATUS_STORAGE_UNAVAILABLE')
  await bucket.put(key, JSON.stringify(value), {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
  })
}

export function getSiteStatusBucket(env) {
  return env?.CONTENT_FEED || null
}

export async function readSiteStatus(bucket, now = Date.now()) {
  const value = await readJson(bucket, SITE_STATUS_OBJECT_KEY)
  return value ? normalizeSiteStatus(value, now) : operationalSiteStatus(now)
}

export async function writeSiteStatus(bucket, value, now = Date.now()) {
  const normalized = normalizeSiteStatus({ ...value, updatedAt: now }, now)
  await writeJson(bucket, SITE_STATUS_OBJECT_KEY, normalized)
  return normalized
}

export async function readSiteStatusMonitor(bucket) {
  return normalizeMonitorState(await readJson(bucket, SITE_STATUS_MONITOR_OBJECT_KEY))
}

export async function writeSiteStatusMonitor(bucket, value) {
  const normalized = normalizeMonitorState(value)
  await writeJson(bucket, SITE_STATUS_MONITOR_OBJECT_KEY, normalized)
  return normalized
}
