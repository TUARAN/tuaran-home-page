import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

/** R2 binding（壁纸/可下载文件）。仿 lib/d1.js 的取法。 */
export function getR2() {
  const ctx = getOptionalRequestContext()
  const bucket = ctx?.env?.MEDIA
  if (!bucket) {
    throw new Error('R2 binding MEDIA is missing (Cloudflare Pages env.MEDIA)')
  }
  return bucket
}

/** 壁纸公开访问基址（末尾无斜杠），来自 wrangler.toml 的 R2_PUBLIC_BASE。 */
export function getPublicBase() {
  const ctx = getOptionalRequestContext()
  const env = ctx?.env
  const base = env?.R2_PUBLIC_BASE || process.env.R2_PUBLIC_BASE || ''
  return base.replace(/\/+$/, '')
}

/** 由 object_key 拼出公开 URL；无公开域名时返回空串。 */
export function publicUrlFor(objectKey) {
  const base = getPublicBase()
  if (!base || !objectKey) return ''
  return `${base}/${objectKey}`
}
