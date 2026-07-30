const SITE_URL = 'https://2aran.com'

function compact(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export function buildArticleOgUrl({
  key = '',
  version = '',
  title,
  description,
  category = '文章',
  date = '',
} = {}) {
  const compactKey = compact(key, 180)
  if (compactKey) {
    const keyedParams = new URLSearchParams({ key: compactKey })
    const compactVersion = compact(version, 40)
    if (compactVersion) keyedParams.set('v', compactVersion)
    return `${SITE_URL}/social-card?${keyedParams.toString()}`
  }

  const params = new URLSearchParams({
    title: compact(title, 72) || '涂阿燃的网络日志',
    description: compact(description, 72),
    category: compact(category, 18) || '文章',
    date: compact(date, 20),
  })

  return `${SITE_URL}/social-card?${params.toString()}`
}
