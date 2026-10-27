/**
 * Canonical "site latest" for the unpacked X Interaction Assistant.
 * Keep in sync with tools/x-reply-clipboard-extension/manifest.json.
 */
export const X_EXTENSION_LATEST_VERSION = '3.32.29'

export function compareExtensionVersions(left, right) {
  const parse = (value) => (/^\d+(?:\.\d+){2,3}$/u.test(String(value || ''))
    ? String(value).split('.').map(Number)
    : null)
  const a = parse(left)
  const b = parse(right)
  if (!a || !b) return 0
  for (let index = 0; index < 4; index += 1) {
    const delta = (a[index] || 0) - (b[index] || 0)
    if (delta) return Math.sign(delta)
  }
  return 0
}

export function isExtensionVersionOutdated(installed, latest = X_EXTENSION_LATEST_VERSION) {
  if (!latest) return false
  if (!installed) return true
  return compareExtensionVersions(latest, installed) > 0
}
