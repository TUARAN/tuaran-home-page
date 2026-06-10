import { articles } from '../app/(site)/articles/articlesData'
import { CATEGORY_META, COMPANY_TYPE_META, TOPIC_TYPE_META, listResearch } from './research/loader'
import { HOME_RESOURCE_ITEMS } from './homeResourceItems'
import { getDailyPickSeed, pickWithLatest } from './pickWithLatest'

/** 首页专栏推荐阅读条数 */
export const HOME_ARTICLE_PICK_COUNT = 4
/** 其中固定展示的最新文章条数 */
export const HOME_ARTICLE_LATEST_COUNT = 1

/** 首页调研推荐阅读条数 */
export const HOME_RESEARCH_PICK_COUNT = 4
/** 其中固定展示的最新调研条数 */
export const HOME_RESEARCH_LATEST_COUNT = 1

/** 首页资料推荐阅读条数（全部随机，资料页无「新文章」概念） */
export const HOME_RESOURCE_PICK_COUNT = 4

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function getArticleLink(article) {
  if (article?.slug === 'diary-self-reflection') return '/diary'
  if (article?.href) return article.href
  return `/articles/${article.slug}`
}

function getArticleCategory(article) {
  if (article?.homeCategory) return article.homeCategory
  if (article?.slug === 'ocr-comparison-paddleocr-vl') return 'AI'
  if (article?.slug === 'content-os-blogger-matrix-alliance') return '创作'
  if (article?.slug === 'blogger-future-community') return '社区'
  if (article?.slug === 'diary-self-reflection') return '随笔'
  return '工程化'
}

function toArticlePick(article) {
  const href = getArticleLink(article)
  return {
    id: article.slug || article.href || article.title,
    href,
    external: isExternalHref(href),
    tagLabel: `专栏 · ${getArticleCategory(article)}`,
    title: article.title,
    date: article.date,
    summary: article.summary,
  }
}

function buildResearchTagLabel(entry) {
  const baseLabel = CATEGORY_META[entry.category]?.label || entry.category
  const companyLabel = entry.companyType && COMPANY_TYPE_META[entry.companyType]?.label
  const topicLabel = entry.topicType && TOPIC_TYPE_META[entry.topicType]?.label
  const subLabel = companyLabel || topicLabel
  return subLabel ? `${baseLabel} · ${subLabel}` : baseLabel
}

function toResearchPick(entry) {
  return {
    id: `${entry.category}:${entry.slug}`,
    href: `/articles/research/${entry.category}/${entry.slug}`,
    tagLabel: buildResearchTagLabel(entry),
    title: entry.title,
    date: entry.date,
    summary: entry.tldr || entry.summary,
  }
}

function toResourcePick(item) {
  return {
    id: item.href,
    href: item.href,
    tagLabel: item.tagLabel,
    title: item.title,
    date: item.date,
    summary: item.summary,
  }
}

export function getHomeArticlePicks() {
  const items = [...articles]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map(toArticlePick)

  return pickWithLatest({
    items,
    count: HOME_ARTICLE_PICK_COUNT,
    latestCount: HOME_ARTICLE_LATEST_COUNT,
    seed: getDailyPickSeed('home-articles'),
  })
}

export function getHomeResearchPicks() {
  const items = listResearch()
    .filter((entry) => !entry.encrypted)
    .map(toResearchPick)

  return pickWithLatest({
    items,
    count: HOME_RESEARCH_PICK_COUNT,
    latestCount: HOME_RESEARCH_LATEST_COUNT,
    seed: getDailyPickSeed('home-research'),
  })
}

export function getHomeResourcePicks() {
  const items = HOME_RESOURCE_ITEMS.map(toResourcePick)

  return pickWithLatest({
    items,
    count: HOME_RESOURCE_PICK_COUNT,
    latestCount: 0,
    seed: getDailyPickSeed('home-resources'),
  })
}
