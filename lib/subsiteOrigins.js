// Explicit trust boundary. Never allow arbitrary *.2aran.com or preview hosts.
// Bind and review each deployment before enabling these endpoints in production.
export const ACCOUNT_SUBSITE_ORIGINS = Object.freeze([
  'https://weekly.2aran.com',
  'https://syncblog.2aran.com',
  'https://poemcn.2aran.com',
])

export function isAccountOrigin(origin) {
  return origin === 'https://2aran.com' || ACCOUNT_SUBSITE_ORIGINS.includes(origin)
}
