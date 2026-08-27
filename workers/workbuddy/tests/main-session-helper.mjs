import { readFileSync } from 'node:fs'

// Execute the actual Edge route with its existing main-site services injected.
// Next.js resolves the extensionless production imports at build time.
export function mainSessionRoute(services) {
  const source = readFileSync(new URL('../../../app/api/workbuddy/session/route.js', import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '').replace(/\bexport /g, '')
  return new Function(...Object.keys(services), `${source}\nreturn GET`)(...Object.values(services))
}
