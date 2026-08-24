export const X_ARTICLE_TASK_SETTING_KEY = 'automation.x_article_extension.current_task'
export const X_ARTICLE_LAST_RUN_KEY = 'automation.x_article_extension.last_run'
export const X_ARTICLE_SECRET_HEADER = 'x-x-article-extension-secret'

export function shanghaiDateKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function stableNumber(value) {
  let hash = 2166136261
  for (const character of String(value || '')) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function normalizeXArticleCandidates(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      contentKey: String(row.content_key || row.contentKey || '').trim(),
      title: String(row.title || '').trim(),
      summary: String(row.summary || '').trim(),
      href: String(row.href || '').trim(),
      type: String(row.content_type || row.type || '').trim(),
    }))
    .filter((item) => ['article', 'research'].includes(item.type))
    .filter((item) => item.contentKey && item.title && /^\/articles\//.test(item.href))
    .sort((left, right) => left.contentKey.localeCompare(right.contentKey))
}

export function pickDailyXArticle(rows, { dateKey = shanghaiDateKey(), previousContentKey = '' } = {}) {
  const candidates = normalizeXArticleCandidates(rows)
  if (!candidates.length) return null
  const withoutPrevious = candidates.length > 1
    ? candidates.filter((item) => item.contentKey !== previousContentKey)
    : candidates
  return withoutPrevious[stableNumber(dateKey) % withoutPrevious.length]
}

export function normalizeXArticleReport(input) {
  const status = String(input?.status || '').trim().toLowerCase()
  if (!['published', 'failed', 'uncertain'].includes(status)) return { error: 'INVALID_STATUS' }
  const taskId = String(input?.taskId || '').trim().slice(0, 240)
  if (!taskId) return { error: 'TASK_ID_REQUIRED' }
  const rawUrl = String(input?.xArticleUrl || '').trim().slice(0, 1000)
  let xArticleUrl = ''
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl)
      if (parsed.protocol === 'https:' && ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(parsed.hostname)) {
        xArticleUrl = parsed.toString()
      }
    } catch {}
  }
  return {
    report: {
      taskId,
      status,
      detail: String(input?.detail || '').trim().slice(0, 2000),
      xArticleUrl,
      attempt: Math.max(1, Math.min(100, Number(input?.attempt) || 1)),
    },
  }
}
