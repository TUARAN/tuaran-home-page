import { ENGINEERING_WORKS } from './engineeringWorks'
import { RESEARCH_REVIEW_READY_PATHS } from './research/catalog'

const CURATED_ARTICLE_PATHS = [
  '/articles/ai-project-complexity-governance',
  '/articles/mcp-https-vs-stdio-architecture-design',
  '/articles/openclaw-pr-anthropic-image-normalization',
]

export const ADSENSE_REVIEW_RICH_PAGE_PATHS = ENGINEERING_WORKS
  .filter((work) => work.reviewReady)
  .map((work) => work.href)

export const ADSENSE_REVIEW_PATHS = [
  '/',
  ...CURATED_ARTICLE_PATHS,
  ...RESEARCH_REVIEW_READY_PATHS,
  ...ADSENSE_REVIEW_RICH_PAGE_PATHS,
]

export const ADSENSE_REVIEW_PATH_SET = new Set(ADSENSE_REVIEW_PATHS)

function normalizePathname(pathname) {
  const value = String(pathname || '/')
  if (value === '/') return value
  return value.replace(/\/+$/, '')
}

export function isAdsenseReviewPath(pathname) {
  return ADSENSE_REVIEW_PATH_SET.has(normalizePathname(pathname))
}
