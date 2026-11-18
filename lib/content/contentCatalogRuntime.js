import { getOptionalRequestContext } from '@cloudflare/next-on-pages'
import { cache } from 'react'

// Read data belonging to this deployment. Never import the generated catalog into Edge.
// 一次请求内多处读取同一资源时复用结果；不跨请求缓存，发布后仍然即时可见。
export const readContentAsset = cache(async (pathname) => {
  const assets = getOptionalRequestContext()?.env?.ASSETS
  const response = assets
    ? await assets.fetch(new Request(`https://2aran.com${pathname}`))
    : await fetch(new URL(pathname, process.env.CONTENT_ASSET_ORIGIN || 'http://127.0.0.1:3000'), { cache: 'no-store' })
  if (!response.ok) throw new Error('Content catalog unavailable')
  return response.json()
})

export const readContentCatalog = cache(async () => {
  const catalog = await readContentAsset('/data/content-catalog.json')
  if (catalog.version !== 1 || !Array.isArray(catalog.entries) || !catalog.researchRedirects) throw new Error('Invalid content catalog')
  return catalog
})
