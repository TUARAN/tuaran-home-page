import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

// Read this deployment's static XML without bundling research / node:fs into Edge.
export async function readDiscoveryAsset(request, pathname) {
  const url = new URL(pathname, request.url)
  const assets = getOptionalRequestContext()?.env?.ASSETS
  const response = assets
    ? await assets.fetch(new Request(url))
    : await fetch(url, { cache: 'no-store' }) // next dev / next start
  if (!response.ok) throw new Error(`Discovery asset unavailable: ${pathname}`)
  return response.text()
}

// Static assets are cached by Pages. Do not cache the published list or serve
// stale discovery responses after an article has been unpublished.
export const DISCOVERY_HEADERS = { 'Cache-Control': 'no-store' }
