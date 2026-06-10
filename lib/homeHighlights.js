import { CATEGORY_META, COMPANY_TYPE_META, TOPIC_TYPE_META, listResearch } from './research/loader'
import { HOME_RESOURCE_ITEMS } from './homeResourceItems'
import { getDailyPickSeed, pickWithLatest } from './pickWithLatest'

/** 首页调研推荐阅读条数 */
export const HOME_RESEARCH_PICK_COUNT = 4
/** 其中固定展示的最新调研条数 */
export const HOME_RESEARCH_LATEST_COUNT = 1

/** 首页资料推荐阅读条数（全部随机，资料页无「新文章」概念） */
export const HOME_RESOURCE_PICK_COUNT = 4

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
