import {
  AI_EXPERIMENT_WORK_ITEMS,
  DOMAIN_ASSETS,
  PRODUCT_WORK_ITEMS,
  WORK_STRATEGY_PARAGRAPHS,
  getWorkStatusLabel,
} from '../../../lib/workItems'

export const maintainedDomains = PRODUCT_WORK_ITEMS.map((item) => ({
  name: item.title,
  href: item.href,
  domains: item.domains || [],
  category: item.role,
  focus: item.summary,
  status: getWorkStatusLabel(item.status),
}))

export const domainAssets = DOMAIN_ASSETS

export const domainStrategyParagraphs = WORK_STRATEGY_PARAGRAPHS

export const opcVibeProjects = AI_EXPERIMENT_WORK_ITEMS.map((item) => ({
  name: item.title,
  href: item.href,
  category: item.role,
  focus: item.summary,
  stack: item.tags?.join(' · ') || item.type,
}))
