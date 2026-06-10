import { CATEGORY_META, COMPANY_TYPE_META, TOPIC_TYPE_META, listResearch } from './research/loader'
import { HOME_RESOURCE_ITEMS } from './homeResourceItems'

/**
 * 首页调研直达：按展示顺序填写 category + slug。
 * 改这里即可调整首页「调研」区块的推荐阅读，无需动 page.jsx。
 */
export const HOME_RESEARCH_PICKS = [
  { category: 'companies', slug: 'shenzhen-zhihuiyun-tech' },
  { category: 'topics', slug: 'cloudflare-d1-vs-supabase' },
  { category: 'topics', slug: '15-minutes-understand-large-language-models' },
  { category: 'people', slug: 'dangnian-mingyue' },
]

/**
 * 首页资料直达：按展示顺序填写 href（与资料库条目一致）。
 */
export const HOME_RESOURCE_PICKS = [
  '/classical-masterpieces',
  '/china-politics',
  '/ru-shi-dao',
  '/history/ming-qing',
]

function buildResearchTagLabel(entry) {
  const baseLabel = CATEGORY_META[entry.category]?.label || entry.category
  const companyLabel = entry.companyType && COMPANY_TYPE_META[entry.companyType]?.label
  const topicLabel = entry.topicType && TOPIC_TYPE_META[entry.topicType]?.label
  const subLabel = companyLabel || topicLabel
  return subLabel ? `${baseLabel} · ${subLabel}` : baseLabel
}

export function getHomeResearchPicks() {
  const catalog = new Map(
    listResearch()
      .filter((entry) => !entry.encrypted)
      .map((entry) => [`${entry.category}:${entry.slug}`, entry]),
  )

  return HOME_RESEARCH_PICKS.map(({ category, slug }) => {
    const entry = catalog.get(`${category}:${slug}`)
    if (!entry) return null
    return {
      id: `${category}:${slug}`,
      href: `/articles/research/${category}/${slug}`,
      tagLabel: buildResearchTagLabel(entry),
      title: entry.title,
      date: entry.date,
      summary: entry.tldr || entry.summary,
    }
  }).filter(Boolean)
}

export function getHomeResourcePicks() {
  const catalog = new Map(HOME_RESOURCE_ITEMS.map((item) => [item.href, item]))

  return HOME_RESOURCE_PICKS.map((href) => {
    const item = catalog.get(href)
    if (!item) return null
    return {
      id: href,
      href: item.href,
      tagLabel: item.tagLabel,
      title: item.title,
      date: item.date,
      summary: item.summary,
    }
  }).filter(Boolean)
}
