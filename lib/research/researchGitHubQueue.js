const DEFAULT_REPO = 'TUARAN/tuaran-home-page'
const RESEARCH_PATH_RE = /^research\/(companies|topics|people)\/(\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md)$/
const STATUSES = new Set(['draft', 'published', 'retired'])

export class ResearchGitHubError extends Error {
  constructor(code, message, status = 500) {
    super(message)
    this.name = 'ResearchGitHubError'
    this.code = code
    this.status = status
  }
}

export function githubResearchRepo(env = {}) {
  return String(env.A_SHARE_PUBLISH_REPO || env.GITHUB_REPOSITORY || process.env.A_SHARE_PUBLISH_REPO || process.env.GITHUB_REPOSITORY || DEFAULT_REPO)
    .replace(/^https?:\/\/(www\.)?github\.com\//, '')
    .replace(/\.git$/, '')
}

export function githubResearchToken(env = {}) {
  return String(
    env.GITHUB_SYNC_TOKEN
      || env.A_SHARE_PUBLISH_TOKEN
      || env.GITHUB_TOKEN
      || process.env.GITHUB_SYNC_TOKEN
      || process.env.A_SHARE_PUBLISH_TOKEN
      || process.env.GITHUB_TOKEN
      || '',
  ).trim()
}

export function parseResearchSourcePath(sourcePath) {
  const match = RESEARCH_PATH_RE.exec(String(sourcePath || '').trim())
  if (!match) return null
  const filename = match[2]
  return {
    category: match[1],
    filename,
    slug: filename.slice(11, -3),
    sourcePath: match[0],
  }
}

export function decodeGitHubFileContent(payload) {
  if (payload?.encoding && payload.encoding !== 'base64') {
    throw new ResearchGitHubError('UNSUPPORTED_ENCODING', 'GitHub 返回了无法解码的文件编码。', 502)
  }
  const encoded = String(payload?.content || '').replace(/\s+/g, '')
  if (!encoded) throw new ResearchGitHubError('EMPTY_FILE', 'GitHub 上的调研文件是空的。', 422)
  const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function listResearchFilesFromTree(tree = []) {
  const files = []
  for (const item of tree) {
    if (item?.type && item.type !== 'blob') continue
    const parsed = parseResearchSourcePath(item?.path)
    if (parsed) files.push({ ...parsed, gitSha: item.sha || '' })
  }
  files.sort((left, right) => right.filename.localeCompare(left.filename) || left.slug.localeCompare(right.slug))
  return files
}

export function extractResearchTitleFromMarkdown(raw) {
  const text = String(raw || '')
  if (!text.startsWith('---')) return ''
  const end = text.indexOf('\n---', 3)
  if (end === -1) return ''
  const match = /^title:\s*(.*)$/m.exec(text.slice(3, end))
  if (!match) return ''
  let value = match[1].trim()
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2)
    || (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1)
  }
  return value.slice(0, 300)
}

export function storedResearchTitle(row) {
  const direct = String(row?.title || '').trim()
  if (direct) return direct.slice(0, 300)
  if (!row?.metadata_json) return ''
  try {
    const title = JSON.parse(row.metadata_json)?.title
    return typeof title === 'string' ? title.trim().slice(0, 300) : ''
  } catch {
    return ''
  }
}

export function withStoredResearchTitles(files, documents = []) {
  const byPath = new Map(documents.map((row) => [row.source_path, row]))
  return files.map((file) => ({
    ...file,
    title: String(file.title || '').trim() || storedResearchTitle(byPath.get(file.sourcePath)),
  }))
}

export async function fillMissingResearchTitles(items, loadRaw) {
  const missing = items.filter((item) => !String(item.title || '').trim())
  if (!missing.length) return items
  const entries = await Promise.all(missing.map(async (item) => {
    try {
      return [item.sourcePath, extractResearchTitleFromMarkdown(await loadRaw(item))]
    } catch {
      return [item.sourcePath, '']
    }
  }))
  const byPath = new Map(entries)
  return items.map((item) => {
    const title = String(item.title || '').trim() || byPath.get(item.sourcePath) || ''
    return title === item.title ? item : { ...item, title }
  })
}

export async function hashResearchSource(raw) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(raw || '')))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function cachedResearchLoader(loadRaw) {
  const cache = new Map()
  return async (item) => {
    if (cache.has(item.sourcePath)) return cache.get(item.sourcePath)
    const raw = await loadRaw(item)
    cache.set(item.sourcePath, raw)
    return raw
  }
}

export function classifyResearchQueue(files, documents = [], recentlyTouched = []) {
  const byPath = new Map(documents.map((row) => [row.source_path, row]))
  const recent = new Set(recentlyTouched)
  const pending = []
  let publishedCount = 0
  for (const file of files) {
    const row = byPath.get(file.sourcePath)
    if (row?.status === 'published') publishedCount += 1
    let reason = null
    if (!row) reason = 'new'
    else if (row.status !== 'published') reason = row.status
    else if (recent.has(file.sourcePath)) reason = 'updated'
    if (!reason) continue
    pending.push({
      ...file,
      title: String(file.title || '').trim() || storedResearchTitle(row),
      contentKey: `research:${file.category}:${file.slug}`,
      d1Status: row?.status || null,
      revision: Number(row?.revision) || 0,
      reason,
    })
  }
  return { pending, publishedCount }
}

export async function dropUnchangedPublishedUpdates(pending, documents = [], loadRaw) {
  const byPath = new Map(documents.map((row) => [row.source_path, row]))
  const updated = pending.filter((item) => item.reason === 'updated')
  if (!updated.length) return pending
  const verdicts = new Map(await Promise.all(updated.map(async (item) => {
    const storedHash = String(byPath.get(item.sourcePath)?.source_hash || '')
    if (!storedHash) return [item.sourcePath, 'keep']
    try {
      const hash = await hashResearchSource(await loadRaw(item))
      return [item.sourcePath, hash === storedHash ? 'drop' : 'keep']
    } catch {
      return [item.sourcePath, 'keep']
    }
  })))
  return pending.filter((item) => item.reason !== 'updated' || verdicts.get(item.sourcePath) !== 'drop')
}

export function publicationStatus(value, fallback = 'published') {
  return STATUSES.has(value) ? value : fallback
}

async function githubJson(url, token, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'user-agent': 'tuaran-home-page/research-queue',
        ...(options.headers || {}),
      },
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const detail = data?.message || `HTTP ${response.status}`
      const status = response.status === 401 || response.status === 403 ? 503 : 502
      throw new ResearchGitHubError('GITHUB_API', `GitHub API ${response.status}：${detail}`, status)
    }
    return data
  } catch (error) {
    if (error instanceof ResearchGitHubError) throw error
    throw new ResearchGitHubError('GITHUB_API', String(error?.message || error), 502)
  } finally {
    clearTimeout(timer)
  }
}

async function listDirectoryFiles(repo, token, category) {
  const data = await githubJson(`https://api.github.com/repos/${repo}/contents/research/${category}?ref=main`, token)
  return Array.isArray(data) ? data : []
}

const INDEX_CACHE_TTL_MS = 60_000
const FILE_CACHE_TTL_MS = 60_000
const FILE_CACHE_LIMIT = 40
const fileCache = new Map()
let indexCache = null

function readTimedCache(map, key) {
  const hit = map.get(key)
  if (!hit) return null
  if (Date.now() >= hit.expiresAt) {
    map.delete(key)
    return null
  }
  return hit.value
}

function writeTimedCache(map, key, value, ttl, limit) {
  if (map.size >= limit) {
    const first = map.keys().next().value
    if (first !== undefined) map.delete(first)
  }
  map.set(key, { value, expiresAt: Date.now() + ttl })
}

export function resetResearchGitHubCaches() {
  indexCache = null
  fileCache.clear()
}

export function requireGitHubResearchToken(env) {
  const token = githubResearchToken(env)
  if (!token) {
    throw new ResearchGitHubError(
      'GITHUB_TOKEN_MISSING',
      '后台未配置 GitHub 令牌，无法读取仓库里的调研。请配置 GITHUB_SYNC_TOKEN 或 A_SHARE_PUBLISH_TOKEN。',
      503,
    )
  }
  return token
}

export async function listGitHubResearchFiles(env) {
  const token = requireGitHubResearchToken(env)
  const repo = githubResearchRepo(env)
  const tree = await githubJson(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`, token)
  let files = listResearchFilesFromTree(tree?.tree || [])
  if (!files.length && tree?.truncated) {
    const listings = await Promise.all(['companies', 'topics', 'people'].map((category) => listDirectoryFiles(repo, token, category)))
    files = listResearchFilesFromTree(listings.flat().map((item) => ({ path: item.path || `research/${item.name}`, type: item.type === 'file' ? 'blob' : item.type, sha: item.sha })))
  }
  return { repo, files, tokenConfigured: true }
}

export function githubCompareRange(commits = []) {
  const items = (Array.isArray(commits) ? commits : []).filter((item) => item?.sha)
  if (!items.length) return null
  return {
    head: items[0].sha,
    base: items[items.length - 1]?.parents?.[0]?.sha || null,
  }
}

export function researchPathsFromChangedFiles(files = []) {
  const paths = []
  const seen = new Set()
  for (const file of files) {
    for (const name of [file?.filename, file?.previous_filename]) {
      const parsed = parseResearchSourcePath(name)
      if (!parsed || seen.has(parsed.sourcePath)) continue
      seen.add(parsed.sourcePath)
      paths.push(parsed.sourcePath)
    }
  }
  return paths
}

export async function listGitHubRecentResearchPaths(env, { perPage = 12 } = {}) {
  const token = requireGitHubResearchToken(env)
  const repo = githubResearchRepo(env)
  const commits = await githubJson(`https://api.github.com/repos/${repo}/commits?sha=main&path=research&per_page=${perPage}`, token)
  const range = githubCompareRange(Array.isArray(commits) ? commits.slice(0, perPage) : [])
  if (!range) return []
  if (!range.base || range.base === range.head) {
    const detail = await githubJson(`https://api.github.com/repos/${repo}/commits/${range.head}`, token)
    return researchPathsFromChangedFiles(detail?.files)
  }
  const compare = await githubJson(`https://api.github.com/repos/${repo}/compare/${range.base}...${range.head}`, token)
  if (compare?.truncated) {
    const details = await Promise.all(
      (Array.isArray(commits) ? commits.slice(0, perPage) : []).map((commit) => (
        githubJson(`https://api.github.com/repos/${repo}/commits/${commit.sha}`, token)
      )),
    )
    return researchPathsFromChangedFiles(details.flatMap((detail) => detail?.files || []))
  }
  return researchPathsFromChangedFiles(compare?.files)
}

export async function loadGitHubResearchIndex(env, { refresh = false } = {}) {
  if (refresh) resetResearchGitHubCaches()
  if (indexCache && Date.now() < indexCache.expiresAt) return indexCache.value
  requireGitHubResearchToken(env)
  const [listing, recentlyTouched] = await Promise.all([
    listGitHubResearchFiles(env),
    listGitHubRecentResearchPaths(env, { perPage: 6 }).catch(() => []),
  ])
  const value = { ...listing, recentlyTouched, fetchedAt: Date.now() }
  indexCache = { value, expiresAt: Date.now() + INDEX_CACHE_TTL_MS }
  return value
}

export async function buildResearchApprovalQueue(env, documents, { refresh = false } = {}) {
  const { repo, files, recentlyTouched, fetchedAt } = await loadGitHubResearchIndex(env, { refresh })
  const titledFiles = withStoredResearchTitles(files, documents)
  const classified = classifyResearchQueue(titledFiles, documents, recentlyTouched)
  const loadRaw = cachedResearchLoader(async (item) => {
    const file = await fetchGitHubResearchFile(env, item.sourcePath)
    return file.raw
  })
  const pending = await fillMissingResearchTitles(
    await dropUnchangedPublishedUpdates(classified.pending, documents, loadRaw),
    loadRaw,
  )
  const pendingPaths = new Set(pending.map((item) => item.sourcePath))
  const libraryCount = titledFiles.filter((item) => !pendingPaths.has(item.sourcePath)).length
  return { repo, files: titledFiles, pending, publishedCount: classified.publishedCount, libraryCount, fetchedAt }
}

export function paginatePublishedResearch(queue, { page = 1, pageSize = 40, query = '' } = {}) {
  const pendingPaths = new Set((queue?.pending || []).map((item) => item.sourcePath))
  const normalizedQuery = String(query || '').trim().toLowerCase()
  const library = (queue?.files || []).filter((item) => {
    if (pendingPaths.has(item.sourcePath)) return false
    if (!normalizedQuery) return true
    return [item.title, item.slug, item.filename, item.sourcePath]
      .some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
  })
  const safePageSize = Math.min(100, Math.max(10, Math.trunc(Number(pageSize)) || 40))
  const safePage = Math.max(1, Math.trunc(Number(page)) || 1)
  const start = (safePage - 1) * safePageSize
  const items = library.slice(start, start + safePageSize)
  return {
    items,
    total: library.length,
    page: safePage,
    pageSize: safePageSize,
    hasMore: start + items.length < library.length,
  }
}

export async function fetchGitHubResearchFile(env, sourcePath, { refresh = false } = {}) {
  const parsed = parseResearchSourcePath(sourcePath)
  if (!parsed) throw new ResearchGitHubError('INVALID_SOURCE_PATH', '源路径必须是 research/<分类>/<日期>-<slug>.md。', 400)
  if (!refresh) {
    const cached = readTimedCache(fileCache, parsed.sourcePath)
    if (cached) return cached
  }
  const token = requireGitHubResearchToken(env)
  const repo = githubResearchRepo(env)
  const payload = await githubJson(`https://api.github.com/repos/${repo}/contents/${parsed.sourcePath}?ref=main`, token)
  const value = { ...parsed, raw: decodeGitHubFileContent(payload), gitSha: payload.sha || '' }
  writeTimedCache(fileCache, parsed.sourcePath, value, FILE_CACHE_TTL_MS, FILE_CACHE_LIMIT)
  return value
}
