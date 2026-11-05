const PUBLIC_ARCHIVE_PREFIX = '/resources/big-interaction-whitepaper/archive/'

export function archiveShanghaiDate(createdAt) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return String(createdAt || '').slice(0, 10)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type) => parts.find((part) => part.type === type)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

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
