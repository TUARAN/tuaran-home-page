import { publicUrlFor } from './r2'

const DEFAULT_SITE_URL = 'https://2aran.com'

export const MAX_HOSTED_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_HOSTED_VIDEO_BYTES = 50 * 1024 * 1024

export const HOSTED_MEDIA_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
}

export function hostedMediaKind(contentType) {
  return String(contentType || '').startsWith('video/') ? 'video' : 'image'
}

export function hostedMediaMaxBytes(contentType) {
  return hostedMediaKind(contentType) === 'video'
    ? MAX_HOSTED_VIDEO_BYTES
    : MAX_HOSTED_IMAGE_BYTES
}

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
  return name || `2aran ${hostedMediaKind(row?.content_type) === 'video' ? '视频' : '图片'}`
}

export function rowToHostedImage(row, origin = '') {
  const id = String(row?.id || '')
  const contentType = row.content_type || ''
  const mediaType = hostedMediaKind(contentType)
  return {
    id,
    url: publicUrlFor(row.object_key),
    sharePath: hostedImageSharePath(id),
    shareUrl: hostedImageShareUrl(id, origin),
    objectKey: row.object_key,
    fileName: row.file_name || '',
    contentType,
    mediaType,
    isVideo: mediaType === 'video',
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
