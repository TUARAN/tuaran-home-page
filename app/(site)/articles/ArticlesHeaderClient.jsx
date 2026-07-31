'use client'

import { useSearchParams } from 'next/navigation'

const GROUP_TITLES = {
  all: '统一内容目录',
  article: '文章',
  analysis: '深度分析',
  practice: '工程实践',
  resource: '资源与档案',
}

const LEGACY_GROUPS = {
  column: 'article',
  posts: 'article',
  research: 'analysis',
  companies: 'analysis',
  people: 'analysis',
  topics: 'analysis',
  tech: 'analysis',
  business: 'analysis',
  other: 'analysis',
  works: 'practice',
  'engineering-cases': 'practice',
  'build-logs': 'practice',
  resources: 'resource',
}

function normalizeGroup(params) {
  const group = params?.get('group')
  if (GROUP_TITLES[group]) return group
  const kind = params?.get('kind')
  if (kind === 'article') return 'article'
  if (['practice', 'guide', 'interactive'].includes(kind)) return 'practice'
  if (['resource', 'archive'].includes(kind)) return 'resource'
  if (['analysis', 'profile', 'fact_check'].includes(kind)) return 'analysis'
  if (params?.get('entity') || params?.get('company_industry') || params?.get('company_role')) return 'analysis'
  const delivery = params?.get('delivery')
  if (['subscribe', 'download', 'watch_listen', 'external'].includes(delivery)) return 'resource'
  if (delivery === 'interact') return 'practice'
  return LEGACY_GROUPS[params?.get('tab')] || 'all'
}

export default function ArticlesHeaderClient() {
  const searchParams = useSearchParams()
  const activeGroup = normalizeGroup(searchParams)

  return (
    <header className="mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
            {GROUP_TITLES[activeGroup]}
          </h1>
          <p className="mt-2 text-[13.5px] leading-[1.8] text-[#5c5e52] dark:text-[#9aa5b6] md:whitespace-nowrap">
            从主题开始浏览，再按内容类型细分；分析对象和资源获取方式会在需要时出现。
          </p>
        </div>
      </div>
    </header>
  )
}
