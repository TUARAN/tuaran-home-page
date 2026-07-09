import { publicUrlFor } from './r2'

const DEFAULT_SITE_URL = 'https://2aran.com'

export function getSiteBaseUrl() {
  const base = process.env.NEXTAUTH_URL || DEFAULT_SITE_URL
  return String(base || DEFAULT_SITE_URL).replace(/\/+$/, '')
}

export function hostedImageSharePath(id) {
  return `/i/${encodeURIComponent(String(id || ''))}`
}

export function hostedImageShareUrl(id, origin = '') {
  const base = origin ? String(origin).replace(/\/+$/, '') : getSiteBaseUrl()
  return `${base}${hostedImageSharePath(id)}`
}

export function hostedImageTitle(row) {
  const name = String(row?.file_name || '').trim()
  return name || '2aran 图床图片'
}

export function rowToHostedImage(row, origin = '') {
  const id = String(row?.id || '')
  return {
    id,
    url: publicUrlFor(row.object_key),
    sharePath: hostedImageSharePath(id),
    shareUrl: hostedImageShareUrl(id, origin),
    objectKey: row.object_key,
    fileName: row.file_name || '',
    contentType: row.content_type || '',
    sizeBytes: Number(row.size_bytes || 0),
    width: row.width == null ? null : Number(row.width),
    height: row.height == null ? null : Number(row.height),
    createdAt: row.created_at,
  }
}

export async function getHostedImageById(db, id) {
  const imageId = String(id || '').trim()
  if (!db || !imageId) return null
  return db.prepare('SELECT * FROM hosted_images WHERE id = ?1').bind(imageId).first()
}
