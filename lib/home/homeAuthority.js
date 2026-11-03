/**
 * 首页与导航的主线 / 观察分层。
 * 旁支内容保持可访问，只在推荐打分和入口顺序上后置。
 */

export const HOME_CORE_SUBJECTS = ['ai_dev', 'web_cloud', 'site_engineering', 'workbuddy']

export const HOME_OBSERVATION_SUBJECTS = [
  'business_market',
  'web3',
  'life_family',
  'humanities_history',
  'people_profiles',
  'workplace_org',
]

export const HOME_OBSERVATION_SERIES = ['a_share_research', 'crypto_research']

export const HOME_LINE_RANK = {
  core: 0,
  supporting: 1,
  observation: 2,
}

export const HOME_LINE_BONUS = {
  core: 2,
  supporting: 0.4,
  observation: -2,
}

export const HOME_OBSERVATION_ENTRY_LINKS = [
  { href: '/web3', label: '市场与 Web3', labelEn: 'Markets & Web3' },
  { href: '/a-share-research', label: 'A股调研', labelEn: 'A-share research' },
  { href: '/crypto-research', label: '加密调研', labelEn: 'Crypto research' },
  { href: '/articles?subject=life_family', label: '生活与家庭', labelEn: 'Life & family' },
  { href: '/articles?subject=humanities_history', label: '人文与历史', labelEn: 'Humanities' },
]

const OBSERVATION_HREF_RE = /\/a-share-research|\/crypto-research|\/articles\/research\/companies\/a-share-|\/articles\/research\/topics\/crypto-/

export function homeContentLine(item = {}) {
  const subjects = Array.isArray(item.subjects) ? item.subjects : []
  const series = String(item.series || '')
  const href = String(item.href || item.slug || '')
  if (HOME_OBSERVATION_SERIES.includes(series) || OBSERVATION_HREF_RE.test(href)) return 'observation'
  if (subjects.some((subject) => HOME_OBSERVATION_SUBJECTS.includes(subject))) return 'observation'
  if (subjects.some((subject) => HOME_CORE_SUBJECTS.includes(subject))) return 'core'
  return 'supporting'
}
