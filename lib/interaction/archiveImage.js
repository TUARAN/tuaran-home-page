const PUBLIC_ARCHIVE_PREFIX = '/resources/big-interaction-whitepaper/archive/'

export function archiveImageView(image) {
  if (typeof image === 'string') {
    const src = image.trim()
    return src ? { src, href: src } : null
  }
  if (!image || typeof image !== 'object') return null

  const url = typeof image.url === 'string' ? image.url.trim() : ''
  const localPath = typeof image.localPath === 'string' ? image.localPath.trim() : ''
  const local = localPath.startsWith(PUBLIC_ARCHIVE_PREFIX) ? localPath : ''
  const src = local || url
  if (!src) return null
  return { src, href: src }
}
