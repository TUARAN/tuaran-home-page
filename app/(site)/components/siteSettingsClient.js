'use client'

let cachedSettings = null
let pendingSettings = null

export async function getPublicSiteSettings() {
  if (cachedSettings) return cachedSettings
  if (!pendingSettings) {
    pendingSettings = fetch('/api/site-settings', {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP_${response.status}`)
        const data = await response.json()
        cachedSettings = data?.settings || {
          ads: { scriptEnabled: false, manualSlotsEnabled: false, reviewMode: true },
        }
        return cachedSettings
      })
      .catch(() => {
        cachedSettings = { ads: { scriptEnabled: false, manualSlotsEnabled: false, reviewMode: true } }
        return cachedSettings
      })
      .finally(() => {
        pendingSettings = null
      })
  }
  return pendingSettings
}
