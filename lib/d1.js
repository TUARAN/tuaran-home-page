import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

export function getD1() {
  const ctx = getOptionalRequestContext()
  const db = ctx?.env?.DB
  if (!db) {
    throw new Error('D1 binding DB is missing (Cloudflare Pages env.DB)')
  }
  return db
}
