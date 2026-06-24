import { articles } from '../app/(site)/articles/articlesData'
import { getLatestFeedItems, FEED_TYPE_META } from '../app/(site)/feed/data'
import { compareSortKeyDesc } from './research/datetime'
import { CATEGORY_META, COMPANY_TYPE_META, TOPIC_TYPE_META, listResearch } from './research/loader'
import { HOME_RESOURCE_ITEMS } from './homeResourceItems'
import { getDailyPickSeed, pickWithLatest, seededShuffle } from './pickWithLatest'

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
    id: `column:${article.slug || article.href || article.title}`,
    href,
    external: isExternalHref(href),
    section: 'column',
    sectionLabel: '专栏',
    tagLabel: getArticleCategory(article),
    title: article.title,
    date: article.date,
    sortKey: article.date ? `${article.date}T00:00:00` : '',
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
    id: `research:${entry.category}:${entry.slug}`,
    href: `/articles/research/${entry.category}/${entry.slug}`,
    section: 'research',
    sectionLabel: '调研',
    tagLabel: buildResearchTagLabel(entry),
    title: entry.title,
    date: entry.dateLabel || entry.date,
    sortKey: entry.sortKey,
    summary: entry.tldr || entry.summary,
  }
}

function toResourcePick(item) {
  return {
    id: `resource:${item.href}`,
    href: item.href,
    section: 'resources',
    sectionLabel: '资源',
    tagLabel: item.tagLabel.replace(/^资源库 · /, '').replace(/^资料库 · /, ''),
    title: item.title,
    date: item.date,
    sortKey: item.date ? `${item.date}T00:00:00` : '',
    summary: item.summary,
  }
}

export function getHomeArticlePicks() {
  const items = [...articles]
    .sort((a, b) => compareSortKeyDesc(a.date ? `${a.date}T00:00:00` : '', b.date ? `${b.date}T00:00:00` : '', a.slug, b.slug))
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

function toFeedPick(item, isLatest) {
  return {
    id: `feed:${item.id}`,
    href: `/feed#${item.id}`,
    section: 'feed',
    sectionLabel: '灵感',
    tagLabel: FEED_TYPE_META[item.type]?.label || '灵感',
    title: item.title,
    date: item.date,
    sortKey: item.date ? `${item.date}T${item.time || '00:00'}:00` : '',
    summary: item.summary,
    isLatest,
  }
}

/** 首页推荐位：注入最新一条「灵感」，最新标记置顶。 */
export function getHomeFeedPicks(count = 1) {
  return getLatestFeedItems(count).map((item, index) => toFeedPick(item, index === 0))
}

export const HOME_SECTION_MORE_LINKS = [
  { label: '专栏', labelEn: 'Column', href: '/articles?tab=posts', section: 'column' },
  { label: '调研', labelEn: 'Research', href: '/articles?tab=research', section: 'research' },
  { label: '资源', labelEn: 'Archive', href: '/articles?tab=resources', section: 'resources' },
]

/** 合并专栏 / 调研 / 资源推荐，最新条目置顶，其余按日种子随机。 */
export function getHomeFeaturedPicks() {
  const merged = [
    ...getHomeFeedPicks(),
    ...getHomeArticlePicks(),
    ...getHomeResearchPicks(),
    ...getHomeResourcePicks(),
  ]

  const latest = merged
    .filter((item) => item.isLatest)
    .sort((a, b) => compareSortKeyDesc(a.sortKey, b.sortKey, a.id, b.id))

  const rest = merged.filter((item) => !item.isLatest)
  const shuffledRest = seededShuffle(rest, getDailyPickSeed('home-featured'))

  return [...latest, ...shuffledRest]
}
