export const ADMIN_SITE_ORIGIN = 'https://admin.2aran.com'

/** Public pages call the admin host. Local and admin pages stay on the current origin. */
export function adminSiteUrl(path, hostname = '') {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'admin.2aran.com') return normalized
  return `${ADMIN_SITE_ORIGIN}${normalized}`
}
