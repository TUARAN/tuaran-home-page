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
      contentKey: `research:${file.category}:${file.slug}`,
      d1Status: row?.status || null,
      revision: Number(row?.revision) || 0,
      reason,
    })
  }
  return { pending, publishedCount }
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

export async function listGitHubResearchFiles(env) {
  const token = githubResearchToken(env)
  if (!token) {
    throw new ResearchGitHubError(
      'GITHUB_TOKEN_MISSING',
      '后台未配置 GitHub 令牌，无法读取仓库里的调研。请配置 GITHUB_SYNC_TOKEN 或 A_SHARE_PUBLISH_TOKEN。',
      503,
    )
  }
  const repo = githubResearchRepo(env)
  const tree = await githubJson(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`, token)
  let files = listResearchFilesFromTree(tree?.tree || [])
  if (!files.length && tree?.truncated) {
    const listings = await Promise.all(['companies', 'topics', 'people'].map((category) => listDirectoryFiles(repo, token, category)))
    files = listResearchFilesFromTree(listings.flat().map((item) => ({ path: item.path || `research/${item.name}`, type: item.type === 'file' ? 'blob' : item.type, sha: item.sha })))
  }
  return { repo, files, tokenConfigured: true }
}

export async function listGitHubRecentResearchPaths(env, { perPage = 12 } = {}) {
  const token = githubResearchToken(env)
  const repo = githubResearchRepo(env)
  const commits = await githubJson(`https://api.github.com/repos/${repo}/commits?sha=main&path=research&per_page=${perPage}`, token)
  const paths = new Set()
  for (const commit of Array.isArray(commits) ? commits.slice(0, perPage) : []) {
    const sha = commit?.sha
    if (!sha) continue
    const detail = await githubJson(`https://api.github.com/repos/${repo}/commits/${sha}`, token)
    for (const file of detail?.files || []) {
      if (parseResearchSourcePath(file.filename)) paths.add(file.filename)
    }
  }
  return [...paths]
}

export async function buildResearchApprovalQueue(env, documents) {
  const { repo, files } = await listGitHubResearchFiles(env)
  let recentlyTouched = []
  try {
    recentlyTouched = await listGitHubRecentResearchPaths(env, { perPage: 6 })
  } catch {
    recentlyTouched = []
  }
  const { pending, publishedCount } = classifyResearchQueue(files, documents, recentlyTouched)
  return { repo, files, pending, publishedCount }
}

export async function fetchGitHubResearchFile(env, sourcePath) {
  const parsed = parseResearchSourcePath(sourcePath)
  if (!parsed) throw new ResearchGitHubError('INVALID_SOURCE_PATH', '源路径必须是 research/<分类>/<日期>-<slug>.md。', 400)
  const token = githubResearchToken(env)
  if (!token) {
    throw new ResearchGitHubError(
      'GITHUB_TOKEN_MISSING',
      '后台未配置 GitHub 令牌，无法读取这篇调研。',
      503,
    )
  }
  const repo = githubResearchRepo(env)
  const payload = await githubJson(`https://api.github.com/repos/${repo}/contents/${parsed.sourcePath}?ref=main`, token)
  return { ...parsed, raw: decodeGitHubFileContent(payload), gitSha: payload.sha || '' }
}
