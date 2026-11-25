import { RESEARCH_ENTRY_META } from '../research/catalog.js'

// 主线页的「最近更新」按标签与标题关键词从调研目录里取最新篇目，
// 避免手工维护的精选列表停在几个月前。
const HUB_RECENT_PATTERNS = {
  'ai-agents': /AI ?Agent|智能体|Agent|MCP|Claude|Codex|WorkBuddy|CodeBuddy|OpenClaw|大模型|LLM|GPT|Buddy/i,
  openclaw: /OpenClaw/i,
  'frontend-cloud': /Cloudflare|Next\.?js|React|前端|D1|Workers|Vercel|SolidJS|站点工程/i,
  books: /出版|图书|ISBN|书号|Seedance|笔名|署名|涂智岩/i,
}

export function listHubRecent(slug, limit = 6) {
  const pattern = HUB_RECENT_PATTERNS[slug]
  if (!pattern) return []
  return Object.values(RESEARCH_ENTRY_META)
    .filter((meta) => !meta.encrypted && meta.date && meta.category === 'topics')
    .filter((meta) => pattern.test(`${meta.title} ${(meta.tags || []).join(' ')}`))
    .sort((a, b) => `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`))
    .slice(0, limit)
    .map((meta) => ({
      href: `/articles/research/${meta.category}/${meta.slug}`,
      label: meta.title,
      note: meta.summary || '',
      date: meta.date,
      tag: (meta.tags || [])[0] || '',
    }))
}

export function latestHubDate(hub, recent) {
  const dates = [...recent.map((item) => item.date), ...hub.leads.map((lead) => lead.date)]
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date || ''))
    .sort()
  return dates[dates.length - 1] || ''
}
