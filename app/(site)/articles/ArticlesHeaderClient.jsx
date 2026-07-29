'use client'

import { useSearchParams } from 'next/navigation'

const PAGE_COPY = {
  picks: {
    title: '推荐入口',
  },
  all: {
    title: '文章与分析',
  },
  column: {
    title: '创作库',
  },
  posts: {
    title: '精选文章',
  },
  works: {
    title: '多维页面',
  },
  research: {
    title: '分析',
  },
  companies: {
    title: '公司观察',
  },
  topics: {
    title: '专题',
  },
  people: {
    title: '人物',
  },
  resources: {
    title: '资源库',
  },
}

const TAB_KEYS = Object.keys(PAGE_COPY)

function normalizeTabFromParams(params) {
  const fromUrl = params?.get('tab')
  if (TAB_KEYS.includes(fromUrl)) return fromUrl
  if (params?.get('resource_type') || params?.get('resource_group')) return 'resources'
  if (params?.get('company_type')) return 'companies'
  if (params?.get('topic_type')) return 'topics'
  if (params?.get('people_type')) return 'people'
  return 'picks'
}

export default function ArticlesHeaderClient() {
  const searchParams = useSearchParams()
  const activeTab = normalizeTabFromParams(searchParams)
  const pageCopy = PAGE_COPY[activeTab] || PAGE_COPY.all

  return (
    <header className="mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
            {pageCopy.title}
          </h1>
          <p className="mt-2 text-[13.5px] leading-[1.8] text-[#5c5e52] dark:text-[#9aa5b6] md:whitespace-nowrap">
            工程实践、作者判断与公开资料核验放在一起，明确区分事实、推断和待确认信息。
          </p>
        </div>
      </div>
    </header>
  )
}
