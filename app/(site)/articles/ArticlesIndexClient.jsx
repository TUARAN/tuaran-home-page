'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSessionAccount } from '../components/SessionProvider'
import { compareSortKeyDesc, researchSortKey } from '../../../lib/research/datetime'

import CanvasOriginBadge from '../components/CanvasOriginBadge'
import {
  getCompanyTypeFilters,
  getPeopleTypeFilters,
  getTopicTypeFilters,
} from '../../../lib/research/categories'

const CHANNEL_DEFS = [
  { key: 'picks', label: '推荐' },
  { key: 'all', label: '全部' },
  { key: 'column', label: '专栏' },
  { key: 'research', label: '分析' },
  { key: 'resources', label: '资源' },
]

const COLUMN_TAB_DEFS = [
  { key: 'column', label: '全部专栏' },
  { key: 'posts', label: '精选文章' },
  { key: 'works', label: '多维页面' },
]

// 各分类标签的配色（浅色 + 暗色）
const KIND_TAG_CLASS = {
  posts: 'border-[#d9d4e2] bg-white/60 text-[#625a6f] dark:border-[#3a372f] dark:bg-[#24231f] dark:text-[#d7d4ca]',
  works: 'border-[#cfc3e2] bg-[#f3eff9] text-[#72539b] dark:border-[#4f472f] dark:bg-[#302c1f] dark:text-[#d7d0ad]',
  companies: 'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#3a372f] dark:bg-[#24231f] dark:text-[#d7d4ca]',
  topics: 'border-[#c7dce4] bg-[#edf6f8] text-[#3f6878] dark:border-[#3a372f] dark:bg-[#24231f] dark:text-[#d7d4ca]',
  people: 'border-[#ddd1e1] bg-[#f6eff7] text-[#765778] dark:border-[#3a372f] dark:bg-[#24231f] dark:text-[#d7d4ca]',
  resources: 'border-[#d6d0df] bg-[#f4f2f8] text-[#625d70] dark:border-[#3a372f] dark:bg-[#24231f] dark:text-[#d7d4ca]',
}

const RESEARCH_KIND_KEYS = ['companies', 'topics', 'people']
const RESEARCH_KINDS = new Set(RESEARCH_KIND_KEYS)
const TAB_KEYS = ['picks', 'all', 'column', 'posts', 'works', 'research', 'companies', 'people', 'tech', 'other', 'topics', 'resources']

function getChannelForTab(activeTab) {
  if (activeTab === 'picks') return 'picks'
  if (activeTab === 'all') return 'all'
  if (activeTab === 'column' || activeTab === 'posts' || activeTab === 'works') return 'column'
  if (activeTab === 'resources') return 'resources'
  if (activeTab === 'research' || RESEARCH_KINDS.has(activeTab) || activeTab === 'tech' || activeTab === 'other') return 'research'
  return 'all'
}

// D1 内容索引（/api/content?source=manual）的手工登记条目 → 列表 item。
// 让构建之后新登记的内容 metadata 不经部署直接出现在索引里；feed 类不进本页。
const MANUAL_ENTRY_KIND = {
  article: { kind: 'posts', tagLabel: '文章' },
  research: null, // 按 category 细分
  resource: { kind: 'resources', tagLabel: '资源库' },
}
const MANUAL_RESEARCH_TAG = { companies: '公司观察', topics: '专题分析', people: '人物' }

function manualEntriesToItems(entries, existingItems) {
  if (!Array.isArray(entries) || !entries.length) return []
  const seenHrefs = new Set(existingItems.map((item) => item.href))
  const out = []
  for (const entry of entries) {
    if (!entry?.href || !entry?.title || seenHrefs.has(entry.href)) continue
    let kind = null
    let tagLabel = ''
    if (entry.type === 'research' && MANUAL_RESEARCH_TAG[entry.category]) {
      kind = entry.category
      tagLabel = MANUAL_RESEARCH_TAG[entry.category]
    } else if (MANUAL_ENTRY_KIND[entry.type]) {
      kind = MANUAL_ENTRY_KIND[entry.type].kind
      tagLabel = MANUAL_ENTRY_KIND[entry.type].tagLabel
    }
    if (!kind) continue
    const pvKey =
      entry.type === 'research' && MANUAL_RESEARCH_TAG[entry.category] && entry.slug
        ? `${entry.category}/${entry.slug}`
        : entry.type === 'resource' && entry.slug
        ? `resource/${entry.slug}`
        : ''
    out.push({
      id: `content-db:${entry.contentKey}`,
      kind,
      tagLabel,
      ...(kind === 'resources' ? { resourceType: 'other' } : {}),
      title: entry.title,
      summary: entry.summary || '',
      date: entry.date || '',
      sortKey: researchSortKey(entry.date),
      href: entry.href,
      ...(pvKey ? { pvKey, pv: null } : {}),
    })
  }
  return out
}

const QUICK_LINKS = [
  { label: '掘金专栏', href: 'https://tuaran.github.io/auto-sync-blog/', external: true },
]

const RESEARCH_TYPE_DEFS = [
  { key: 'research', label: '全部分析' },
  { key: 'companies', label: '公司' },
  { key: 'people', label: '人物' },
  { key: 'tech', label: '技术' },
  { key: 'other', label: '其他' },
]

// 公司 / 主题分类的 filter defs 由 lib/research/loader.js 派生，避免双源维护。
// 新增 / 删除分类只改 loader 一处即可。
const COMPANY_TYPE_DEFS = getCompanyTypeFilters()
const COMPANY_TYPE_KEYS = COMPANY_TYPE_DEFS.map((t) => t.key)

const TOPIC_TYPE_DEFS = getTopicTypeFilters()
const TOPIC_TYPE_KEYS = TOPIC_TYPE_DEFS.map((t) => t.key)
const OTHER_TOPIC_TYPE_DEFS = TOPIC_TYPE_DEFS
  .filter((t) => t.key !== 'tech')
  .map((t) => (t.key === 'all' ? { ...t, label: '全部其他' } : t))

const PEOPLE_TYPE_DEFS = getPeopleTypeFilters()
const PEOPLE_TYPE_KEYS = PEOPLE_TYPE_DEFS.map((t) => t.key)

const RESOURCE_TYPE_DEFS = [
  { key: 'all', label: '全部资源' },
  { key: 'ai-dev', label: 'AI 与开发' },
  { key: 'ai-music', label: 'AI 音乐' },
  { key: 'humanities-politics', label: '人文与政经' },
  { key: 'rss', label: 'RSS 订阅' },
  { key: 'twitter', label: '推特资讯' },
  { key: 'youtube', label: 'YouTube 收藏' },
  { key: 'workplace', label: '职场资源' },
  { key: 'visual-assets', label: '壁纸下载' },
]

const RESOURCE_TYPE_KEYS = RESOURCE_TYPE_DEFS.map((t) => t.key)
const RESOURCE_GROUP_DEFS = [
  { key: 'all', label: '全部资源', typeKeys: RESOURCE_TYPE_KEYS.filter((key) => key !== 'all') },
  { key: 'content', label: '内容资源', allLabel: '全部内容', typeKeys: ['ai-dev', 'ai-music', 'humanities-politics', 'workplace'] },
  { key: 'external', label: '国外资源', allLabel: '全部国外资源', typeKeys: ['rss', 'twitter', 'youtube'] },
  { key: 'downloads', label: '下载资源', allLabel: '全部下载', typeKeys: ['visual-assets'] },
]
const RESOURCE_GROUP_KEYS = RESOURCE_GROUP_DEFS.map((t) => t.key)
const RESOURCE_TYPE_ALIASES = {
  classics: 'humanities-politics',
  humanities: 'humanities-politics',
  politics: 'humanities-politics',
  books: 'humanities-politics',
  'twitter-bookmarks': 'twitter',
  'youtube-bookmarks': 'youtube',
  'external-archive': 'all',
  'llm-tutorials': 'ai-dev',
  'ai-tools': 'ai-dev',
  'dev-resources': 'ai-dev',
  'codex-learning': 'ai-dev',
  music: 'ai-music',
  wallpapers: 'visual-assets',
}

const PAGE_SIZE = 24

function normalizeResourceType(value) {
  if (RESOURCE_TYPE_KEYS.includes(value)) return value
  return RESOURCE_TYPE_ALIASES[value] || 'all'
}

function normalizeResourceGroup(value) {
  return RESOURCE_GROUP_KEYS.includes(value) ? value : 'all'
}

function getResourceTypeDefsForGroup(groupKey) {
  const group = RESOURCE_GROUP_DEFS.find((item) => item.key === groupKey) || RESOURCE_GROUP_DEFS[0]
  const label = group.key === 'all' ? '全部资源' : group.allLabel
  return [
    { key: 'all', label },
    ...RESOURCE_TYPE_DEFS.filter((item) => group.typeKeys.includes(item.key)),
  ]
}

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function formatPv(pv) {
  if (pv === null || typeof pv === 'undefined') return '-'
  const n = Number(pv)
  if (!Number.isFinite(n) || n < 0) return '-'
  if (n === 0) return '0'
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(n)
}

export default function ArticlesIndexClient({ items: staticItems }) {
  const { isOwner } = useSessionAccount()
  const [items, setItems] = useState(staticItems)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pvCounts, setPvCounts] = useState({})
  const [pvLoaded, setPvLoaded] = useState(false)
  function normalizeTabFromParams(params) {
    const fromUrl = params?.get('tab')
    if (fromUrl === 'topics') return params?.get('topic_type') === 'tech' ? 'tech' : 'other'
    if (TAB_KEYS.includes(fromUrl)) return fromUrl
    if (params?.get('resource_type') || params?.get('resource_group')) return 'resources'
    if (params?.get('company_type')) return 'companies'
    if (params?.get('topic_type')) return params.get('topic_type') === 'tech' ? 'tech' : 'other'
    if (params?.get('people_type')) return 'people'
    return 'all'
  }
  const initialTab = (() => {
    return normalizeTabFromParams(searchParams)
  })()
  const initialCompanyType = (() => {
    const fromUrl = searchParams?.get('company_type')
    return COMPANY_TYPE_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialTopicType = (() => {
    const fromUrl = searchParams?.get('topic_type')
    return TOPIC_TYPE_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialPeopleType = (() => {
    const fromUrl = searchParams?.get('people_type')
    return PEOPLE_TYPE_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialResourceType = (() => {
    const fromUrl = searchParams?.get('resource_type')
    return normalizeResourceType(fromUrl)
  })()
  const initialResourceGroup = (() => {
    return normalizeResourceGroup(searchParams?.get('resource_group'))
  })()
  const initialQuery = searchParams?.get('q') || ''
  const [tab, setTab] = useState(initialTab)
  const [companyType, setCompanyType] = useState(initialCompanyType)
  const [topicType, setTopicType] = useState(initialTopicType)
  const [peopleType, setPeopleType] = useState(initialPeopleType)
  const [resourceType, setResourceType] = useState(initialResourceType)
  const [resourceGroup, setResourceGroup] = useState(initialResourceGroup)
  const [query, setQuery] = useState(initialQuery)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const requestedPvKeys = useRef(new Set())
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch('/api/articles', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
      fetch('/api/content?source=manual', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ]).then(([articlesData, contentData]) => {
      if (!alive) return
      const dbArticles = Array.isArray(articlesData?.articles) ? articlesData.articles : []
      const base = [...staticItems, ...dbArticles]
      const manualItems = manualEntriesToItems(contentData?.entries, base)
      if (!dbArticles.length && !manualItems.length) return
      const merged = [...base, ...manualItems]
        .sort((a, b) => compareSortKeyDesc(a.sortKey, b.sortKey, a.id, b.id))
      setItems(merged)
    })
    return () => { alive = false }
  }, [staticItems])

  useEffect(() => {
    const nextTab = normalizeTabFromParams(searchParams)
    if (nextTab !== tab) {
      setTab(nextTab)
    }
    const companyTypeFromUrl = searchParams?.get('company_type')
    const nextCompanyType = COMPANY_TYPE_KEYS.includes(companyTypeFromUrl) ? companyTypeFromUrl : 'all'
    if (nextCompanyType !== companyType) {
      setCompanyType(nextCompanyType)
    }
    const topicTypeFromUrl = searchParams?.get('topic_type')
    const nextTopicType = TOPIC_TYPE_KEYS.includes(topicTypeFromUrl) ? topicTypeFromUrl : 'all'
    if (nextTopicType !== topicType) {
      setTopicType(nextTopicType)
    }
    const peopleTypeFromUrl = searchParams?.get('people_type')
    const nextPeopleType = PEOPLE_TYPE_KEYS.includes(peopleTypeFromUrl) ? peopleTypeFromUrl : 'all'
    if (nextPeopleType !== peopleType) {
      setPeopleType(nextPeopleType)
    }
    const resourceTypeFromUrl = searchParams?.get('resource_type')
    const nextResourceType = normalizeResourceType(resourceTypeFromUrl)
    if (nextResourceType !== resourceType) {
      setResourceType(nextResourceType)
    }
    const nextResourceGroup = normalizeResourceGroup(searchParams?.get('resource_group'))
    if (nextResourceGroup !== resourceGroup) {
      setResourceGroup(nextResourceGroup)
    }
    const queryFromUrl = searchParams?.get('q') || ''
    if (queryFromUrl !== query) {
      setQuery(queryFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function buildArticlesUrl(
    nextTab,
    nextCompanyType,
    nextTopicType,
    nextPeopleType,
    nextResourceType,
    nextResourceGroup,
    nextQuery,
  ) {
    const params = new URLSearchParams()
    if (nextTab !== 'all') params.set('tab', nextTab)
    if (nextTab === 'companies' && nextCompanyType !== 'all') params.set('company_type', nextCompanyType)
    if (nextTab === 'other' && nextTopicType !== 'all') params.set('topic_type', nextTopicType)
    if (nextTab === 'people' && nextPeopleType !== 'all') params.set('people_type', nextPeopleType)
    if (nextTab === 'resources' && nextResourceType !== 'all') params.set('resource_type', nextResourceType)
    if (nextTab === 'resources' && nextResourceGroup !== 'all') params.set('resource_group', nextResourceGroup)
    const normalizedQuery = String(nextQuery || '').trim()
    if (normalizedQuery) params.set('q', normalizedQuery)
    const queryString = params.toString()
    return queryString ? `/articles?${queryString}` : '/articles'
  }

  function selectTab(next) {
    setTab(next)
    const nextCompanyType = next === 'companies' ? companyType : 'all'
    const nextTopicType = next === 'other' ? topicType : 'all'
    const nextPeopleType = next === 'people' ? peopleType : 'all'
    const nextResourceType = next === 'resources' ? resourceType : 'all'
    const nextResourceGroup = next === 'resources' ? resourceGroup : 'all'
    if (next !== 'companies') setCompanyType('all')
    if (next !== 'other') setTopicType('all')
    if (next !== 'people') setPeopleType('all')
    if (next !== 'resources') {
      setResourceType('all')
      setResourceGroup('all')
    }
    const url = buildArticlesUrl(next, nextCompanyType, nextTopicType, nextPeopleType, nextResourceType, nextResourceGroup, query)
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  function selectChannel(channelKey) {
    if (channelKey === activeChannel) return
    if (channelKey === 'picks') selectTab('picks')
    else if (channelKey === 'all') selectTab('all')
    else if (channelKey === 'column') selectTab('column')
    else if (channelKey === 'research') selectTab('research')
    else if (channelKey === 'resources') selectTab('resources')
  }

  function selectCompanyType(next) {
    setTab('companies')
    setCompanyType(next)
    const url = buildArticlesUrl('companies', next, 'all', 'all', 'all', 'all', query)
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  function selectTopicType(next) {
    setTab('other')
    setTopicType(next)
    const url = buildArticlesUrl('other', 'all', next, 'all', 'all', 'all', query)
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  function selectPeopleType(next) {
    setTab('people')
    setPeopleType(next)
    const url = buildArticlesUrl('people', 'all', 'all', next, 'all', 'all', query)
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  function selectResourceType(next) {
    setTab('resources')
    setResourceType(next)
    const url = buildArticlesUrl('resources', 'all', 'all', 'all', next, resourceGroup, query)
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  function selectResourceGroup(next) {
    const group = RESOURCE_GROUP_DEFS.find((item) => item.key === next) || RESOURCE_GROUP_DEFS[0]
    const nextType = group.typeKeys.includes(resourceType) ? resourceType : 'all'
    setTab('resources')
    setResourceGroup(next)
    setResourceType(nextType)
    const url = buildArticlesUrl('resources', 'all', 'all', 'all', nextType, next, query)
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  function submitSearch(event) {
    event.preventDefault()
    const url = buildArticlesUrl(tab, companyType, topicType, peopleType, resourceType, resourceGroup, query)
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  function clearSearch() {
    setQuery('')
    const url = buildArticlesUrl(tab, companyType, topicType, peopleType, resourceType, resourceGroup, '')
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  const counts = useMemo(() => {
    const base = Object.fromEntries(TAB_KEYS.map((k) => [k, 0]))
    base.all = items.length
    for (const item of items) {
      if (typeof base[item.kind] === 'number') base[item.kind] += 1
      if (RESEARCH_KINDS.has(item.kind)) base.research += 1
      if (item.kind === 'topics' && item.topicType === 'tech') base.tech += 1
      if (item.kind === 'topics' && item.topicType !== 'tech') base.other += 1
    }
    base.column = (base.posts || 0) + (base.works || 0)
    return base
  }, [items])

  const activeChannel = getChannelForTab(tab)

  const breadcrumb = useMemo(() => {
    if (tab === 'all') return null
    const parts = []
    const channel = CHANNEL_DEFS.find((c) => c.key === activeChannel)
    if (channel && channel.key !== 'all') parts.push(channel.label)

    if (activeChannel === 'column') {
      const col = COLUMN_TAB_DEFS.find((t) => t.key === tab)
      if (col && col.key !== 'column') parts.push(col.label)
    }
    if (activeChannel === 'research') {
      const researchTab = RESEARCH_TYPE_DEFS.find((t) => t.key === tab)
      if (researchTab && researchTab.key !== 'research') parts.push(researchTab.label)
      else if (tab === 'research') parts.push('全部分析')
      if (tab === 'companies' && companyType !== 'all') {
        parts.push(COMPANY_TYPE_DEFS.find((t) => t.key === companyType)?.label || companyType)
      }
      if (tab === 'other' && topicType !== 'all') {
        parts.push(OTHER_TOPIC_TYPE_DEFS.find((t) => t.key === topicType)?.label || topicType)
      }
      if (tab === 'people' && peopleType !== 'all') {
        parts.push(PEOPLE_TYPE_DEFS.find((t) => t.key === peopleType)?.label || peopleType)
      }
    }
    if (activeChannel === 'resources') {
      const group = RESOURCE_GROUP_DEFS.find((item) => item.key === resourceGroup)
      if (group && group.key !== 'all') parts.push(group.label)
      const res = RESOURCE_TYPE_DEFS.find((t) => t.key === resourceType)
      if (res && res.key !== 'all') parts.push(res.label)
      else parts.push(group && group.key !== 'all' ? group.allLabel : '全部资源')
    }
    return parts.length ? parts.join(' / ') : null
  }, [tab, activeChannel, companyType, topicType, peopleType, resourceType, resourceGroup])

  const visible = useMemo(() => {
    if (tab === 'picks' && !query.trim()) return []

    const tabItems =
      tab === 'all' || tab === 'picks'
        ? items
        : tab === 'column'
        ? items.filter((item) => item.kind === 'posts' || item.kind === 'works')
        : tab === 'research'
        ? items.filter((item) => RESEARCH_KINDS.has(item.kind))
        : tab === 'tech'
        ? items.filter((item) => item.kind === 'topics' && item.topicType === 'tech')
        : tab === 'other'
        ? items.filter((item) => item.kind === 'topics' && item.topicType !== 'tech')
        : items.filter((item) => item.kind === tab)
    let typeFiltered = tabItems
    if (tab === 'companies' && companyType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.companyType === companyType)
    }
    if (tab === 'other' && topicType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.topicType === topicType)
    }
    if (tab === 'people' && peopleType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.peopleType === peopleType)
    }
    if (tab === 'resources' && resourceGroup !== 'all') {
      const group = RESOURCE_GROUP_DEFS.find((item) => item.key === resourceGroup)
      typeFiltered = typeFiltered.filter((item) => group?.typeKeys.includes(item.resourceType))
    }
    if (tab === 'resources' && resourceType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.resourceType === resourceType)
    }
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return typeFiltered

    return typeFiltered.filter((item) => {
      const combined = [item.title, item.summary, item.tagLabel, item.date, item.kind]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return combined.includes(normalizedQuery)
    })
  }, [items, tab, companyType, topicType, peopleType, resourceType, resourceGroup, query])

  const paginatedItems = useMemo(
    () => visible.slice(0, visibleCount),
    [visible, visibleCount],
  )

  const visiblePvKeys = useMemo(
    () => Array.from(new Set(paginatedItems.map((item) => item.pvKey).filter(Boolean))),
    [paginatedItems],
  )

  const visiblePvKeySignature = visiblePvKeys.join(',')

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [tab, companyType, topicType, peopleType, resourceType, resourceGroup, query])

  useEffect(() => {
    const keys = (visiblePvKeySignature ? visiblePvKeySignature.split(',') : [])
      .filter((key) => !requestedPvKeys.current.has(key))
    if (!keys.length) {
      setPvLoaded(true)
      return
    }

    keys.forEach((key) => requestedPvKeys.current.add(key))
    setPvLoaded(false)
    let cancelled = false
    async function loadPv() {
      try {
        const res = await fetch(`/api/research-pv?keys=${encodeURIComponent(keys.join(','))}`)
        if (!res.ok) {
          keys.forEach((key) => requestedPvKeys.current.delete(key))
          return
        }
        const data = await res.json()
        if (!cancelled && data?.counts) setPvCounts(data.counts)
      } catch {
        // 统计接口不可用时保留静态 frontmatter 里的 pv。
        keys.forEach((key) => requestedPvKeys.current.delete(key))
      } finally {
        if (!cancelled) setPvLoaded(true)
      }
    }

    loadPv()
    return () => {
      cancelled = true
    }
  }, [visiblePvKeySignature])

  const companyTypeCounts = useMemo(() => {
    const base = Object.fromEntries(COMPANY_TYPE_KEYS.map((k) => [k, 0]))
    const companyItems = items.filter((item) => item.kind === 'companies')
    base.all = companyItems.length
    for (const item of companyItems) {
      if (item.companyType && typeof base[item.companyType] === 'number') {
        base[item.companyType] += 1
      }
    }
    return base
  }, [items])

  const topicTypeCounts = useMemo(() => {
    const base = Object.fromEntries(TOPIC_TYPE_KEYS.map((k) => [k, 0]))
    const topicItems = items.filter((item) => item.kind === 'topics' && item.topicType !== 'tech')
    base.all = topicItems.length
    for (const item of topicItems) {
      if (item.topicType && typeof base[item.topicType] === 'number') {
        base[item.topicType] += 1
      }
    }
    return base
  }, [items])

  const peopleTypeCounts = useMemo(() => {
    const base = Object.fromEntries(PEOPLE_TYPE_KEYS.map((k) => [k, 0]))
    const peopleItems = items.filter((item) => item.kind === 'people')
    base.all = peopleItems.length
    for (const item of peopleItems) {
      if (item.peopleType && typeof base[item.peopleType] === 'number') {
        base[item.peopleType] += 1
      }
    }
    return base
  }, [items])

  const resourceTypeCounts = useMemo(() => {
    const base = Object.fromEntries(RESOURCE_TYPE_KEYS.map((k) => [k, 0]))
    const resourceItems = items.filter((item) => item.kind === 'resources')
    base.all = resourceItems.length
    for (const item of resourceItems) {
      if (item.resourceType && typeof base[item.resourceType] === 'number') {
        base[item.resourceType] += 1
      }
    }
    return base
  }, [items])

  const resourceGroupCounts = useMemo(() => {
    const resourceItems = items.filter((item) => item.kind === 'resources')
    const base = Object.fromEntries(RESOURCE_GROUP_KEYS.map((key) => [key, 0]))
    base.all = resourceItems.length
    for (const group of RESOURCE_GROUP_DEFS) {
      if (group.key === 'all') continue
      base[group.key] = resourceItems.filter((item) => group.typeKeys.includes(item.resourceType)).length
    }
    return base
  }, [items])

  const visibleResourceTypeDefs = useMemo(
    () => getResourceTypeDefsForGroup(resourceGroup),
    [resourceGroup],
  )

  const readingHighlights = useMemo(() => {
    const publicItems = items.filter((item) => !item.encrypted)
    const latestItems = publicItems.slice(0, 3)
    const latestIds = new Set(latestItems.map((item) => item.id || item.href))
    return [
      {
        title: '最新内容',
        desc: '刚发布的文章、分析与工程记录。',
        items: latestItems,
      },
      {
        title: '推荐分析',
        desc: '技术、市场与公司观察中的作者判断。',
        items: publicItems
          .filter((item) => !latestIds.has(item.id || item.href) && RESEARCH_KINDS.has(item.kind))
          .slice(0, 3),
      },
      {
        title: '代表作品',
        desc: '个人判断、多维页面和长期项目。',
        items: publicItems
          .filter((item) => !latestIds.has(item.id || item.href) && (item.kind === 'posts' || item.kind === 'works'))
          .slice(0, 3),
      },
    ].filter((section) => section.items.length > 0)
  }, [items])

  const picksCount = useMemo(
    () => readingHighlights.reduce((sum, section) => sum + section.items.length, 0),
    [readingHighlights],
  )

  const showReadingHighlights = tab === 'picks' && !query.trim()
  const showArticleList = tab !== 'picks' || Boolean(query.trim())
  const hasAdvancedFilters = activeChannel !== 'all' && activeChannel !== 'picks'
  const currentFilterLabel = breadcrumb || CHANNEL_DEFS.find((channel) => channel.key === activeChannel)?.label || '全部'

  function AdvancedFiltersContent({ orientation = 'inline' }) {
    return (
      <>
        {activeChannel === 'column' ? (
          <FilterRow label="专栏类型" ariaLabel="专栏类型" orientation={orientation}>
            {COLUMN_TAB_DEFS.map((t) => (
              <FilterChip
                key={t.key}
                label={t.label}
                count={counts[t.key] ?? 0}
                active={tab === t.key}
                onClick={() => selectTab(t.key)}
              />
            ))}
            <Link
              href="/rich-pages"
              className="ml-1 shrink-0 text-xs text-[var(--site-accent)] no-underline transition-colors hover:text-[var(--site-accent-strong)] dark:text-[#c5afe8] dark:hover:text-[#e1d4f5]"
            >
              多维页面专页 →
            </Link>
          </FilterRow>
        ) : null}

        {activeChannel === 'research' ? (
          <>
            <FilterRow label="内容类型" ariaLabel="分析内容类型" orientation={orientation}>
              {RESEARCH_TYPE_DEFS.map((t) => (
                <FilterChip
                  key={t.key}
                  label={t.label}
                  count={counts[t.key] ?? 0}
                  active={tab === t.key}
                  onClick={() => selectTab(t.key)}
                />
              ))}
            </FilterRow>
            {tab === 'companies' ? (
              <FilterRow label="公司分类" ariaLabel="公司观察分类" orientation={orientation}>
                {COMPANY_TYPE_DEFS.map((t) => (
                  <FilterChip
                    key={t.key}
                    label={t.label}
                    count={companyTypeCounts[t.key] ?? 0}
                    active={companyType === t.key}
                    onClick={() => selectCompanyType(t.key)}
                  />
                ))}
              </FilterRow>
            ) : null}
            {tab === 'other' ? (
              <FilterRow label="其他分类" ariaLabel="其他内容分类" orientation={orientation}>
                {OTHER_TOPIC_TYPE_DEFS.map((t) => (
                  <FilterChip
                    key={t.key}
                    label={t.label}
                    count={topicTypeCounts[t.key] ?? 0}
                    active={topicType === t.key}
                    onClick={() => selectTopicType(t.key)}
                  />
                ))}
              </FilterRow>
            ) : null}
            {tab === 'people' ? (
              <FilterRow label="人物分类" ariaLabel="人物内容分类" orientation={orientation}>
                {PEOPLE_TYPE_DEFS.map((t) => (
                  <FilterChip
                    key={t.key}
                    label={t.label}
                    count={peopleTypeCounts[t.key] ?? 0}
                    active={peopleType === t.key}
                    onClick={() => selectPeopleType(t.key)}
                  />
                ))}
              </FilterRow>
            ) : null}
          </>
        ) : null}

        {activeChannel === 'resources' ? (
          <>
            <FilterRow label="资源类型" ariaLabel="资源类型" orientation={orientation}>
              {RESOURCE_GROUP_DEFS.map((group) => (
                <FilterChip
                  key={group.key}
                  label={group.label}
                  count={resourceGroupCounts[group.key] ?? 0}
                  active={resourceGroup === group.key}
                  onClick={() => selectResourceGroup(group.key)}
                />
              ))}
            </FilterRow>
            <FilterRow label="资源分类" ariaLabel="资源分类" orientation={orientation}>
              {visibleResourceTypeDefs.map((t) => (
              <FilterChip
                key={t.key}
                label={t.label}
                count={t.key === 'all' ? resourceGroupCounts[resourceGroup] ?? 0 : resourceTypeCounts[t.key] ?? 0}
                active={resourceType === t.key}
                onClick={() => selectResourceType(t.key)}
              />
            ))}
            </FilterRow>
          </>
        ) : null}

        {orientation !== 'stack' && breadcrumb ? <FilterBreadcrumb path={breadcrumb} /> : null}
      </>
    )
  }

  const listContent = showArticleList ? (
    <section
      className={[
        'space-y-4 transition-opacity duration-150',
        isPending ? 'opacity-60' : 'opacity-100',
      ].join(' ')}
      aria-busy={isPending}
    >
      {visible.length === 0 ? (
        <p className="text-sm text-[#666] dark:text-gray-400">
          {query ? '没有匹配的内容，试试更短关键词或切换分类。' : '该分类下暂无内容。'}
        </p>
      ) : (
        <div className="overflow-hidden border-y border-[#d9d2df] bg-white/45 dark:border-gray-800 dark:bg-[#101721]/65">
          {paginatedItems.map((item) => {
            const pvKey = item.pvKey || ''
            const hasLivePv = pvKey && Object.prototype.hasOwnProperty.call(pvCounts, pvKey)
            const livePv = hasLivePv ? pvCounts[pvKey] : item.pv
            const pvLoading = pvKey !== '' && !pvLoaded
            const nextItem = 'pv' in item ? { ...item, pv: livePv, pvLoading } : item
            return <ArticleRow key={item.id || `${item.kind}:${item.href}:${item.title}`} item={nextItem} />
          })}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#d9d2df] px-4 py-4 text-center dark:border-gray-800 sm:flex-row sm:text-left">
            <p className="mb-0 text-xs text-[#777184] dark:text-gray-400" aria-live="polite">
              已显示 {paginatedItems.length} / {visible.length} 条
            </p>
            {paginatedItems.length < visible.length ? (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, visible.length))}
                className="min-h-10 rounded-full border border-[#cfc6dc] bg-[#f4f0f8] px-5 text-sm font-medium text-[#49345f] transition hover:border-[var(--site-accent)] hover:bg-white hover:text-[#20172f] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-[#18202a] dark:hover:text-white"
              >
                加载更多
              </button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  ) : null

  return (
    <div className="articles-index-stone space-y-5">
      <section className="-mx-1 space-y-2.5 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel-strong)]/95 p-2.5 shadow-[0_8px_24px_rgba(76,58,96,0.08)] backdrop-blur-sm dark:border-gray-800 dark:bg-[#0f141b]/95 dark:shadow-none sm:space-y-3 sm:p-3">
        <nav
          aria-label="知识库频道"
          role="tablist"
          className="flex gap-1.5 overflow-x-auto rounded-lg border border-[#ddd6e7] bg-[#eee9f3] p-1 sm:grid sm:grid-cols-5 sm:overflow-visible dark:border-gray-800 dark:bg-[#151a22]"
        >
          {CHANNEL_DEFS.map((channel) => {
            const active = activeChannel === channel.key
            const count =
              channel.key === 'picks'
                ? picksCount
                : channel.key === 'all'
                ? counts.all
                : channel.key === 'column'
                ? counts.column
                : channel.key === 'research'
                ? counts.research
                : counts.resources
            return (
              <button
                key={channel.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectChannel(channel.key)}
                className={[
                  'inline-flex min-h-9 min-w-[5.75rem] shrink-0 items-center justify-center rounded-md px-2.5 py-2 text-sm transition-all duration-150 sm:min-w-0',
                  active
                    ? 'bg-white font-semibold text-[#20172f] shadow-sm ring-1 ring-[#d9cfe8] dark:bg-[#1e2630] dark:text-gray-100 dark:ring-transparent'
                    : 'text-[#696071] hover:bg-white/70 hover:text-[#20172f] dark:text-gray-400 dark:hover:bg-[#1e2630]/70 dark:hover:text-gray-100',
                ].join(' ')}
              >
                <span className="whitespace-nowrap">
                  {channel.label}
                  <span
                    className={[
                      'font-mono text-[11px] tabular-nums',
                      active ? 'text-[#817789] dark:text-gray-400' : 'text-[#9a93a3] dark:text-gray-500',
                    ].join(' ')}
                  >
                    ({count})
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索知识库：标题 / 摘要 / 标签"
            className="min-w-[220px] flex-1 rounded-md border border-[#cfc6dc] bg-white px-3 py-2 text-sm text-[#20172f] outline-none transition-colors placeholder:text-[#9a93a3] focus:border-[var(--site-accent)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500"
          />
          <button
            type="submit"
            className="rounded-md border border-[#cfc6dc] bg-[#f4f0f8] px-3 py-2 text-sm text-[#49345f] transition-colors hover:border-[var(--site-accent)] hover:text-[#20172f] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:text-white"
          >
            搜索
          </button>
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-md border border-transparent px-2 py-2 text-sm text-[#817789] transition-colors hover:text-[#20172f] dark:text-gray-400 dark:hover:text-gray-200"
            >
              清空
            </button>
          ) : null}
        </form>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e8e2ef] pt-2.5 text-xs text-[#665f70] dark:border-gray-800 dark:text-gray-400 sm:pt-3">
          {isOwner && tab === 'posts' ? (
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center rounded-md border border-[#cfc3e2] bg-[#f3eff9] px-2.5 py-1.5 font-medium text-[#49345f] no-underline transition-colors hover:border-[#ae9ac3] hover:text-[#20172f] dark:border-[#3c2f57] dark:bg-[#1f1830] dark:text-[#d8c5f3]"
            >
              写文章 ✎
            </Link>
          ) : null}
          {QUICK_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="no-external-arrow inline-flex items-center gap-1 no-underline transition-colors hover:text-[#20172f] dark:hover:text-gray-100"
              >
                <span>{link.label}</span>
                <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 2h6v6" />
                  <path d="M10 2L4 8" />
                  <path d="M9 8v2H2V3h2" />
                </svg>
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="no-underline transition-colors hover:text-[#20172f] dark:hover:text-gray-100"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
      </section>

      {hasAdvancedFilters ? (
        <div className="lg:grid lg:grid-cols-[236px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <aside className="hidden self-start rounded-lg border border-[#e8e2ef] bg-white/80 p-3 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto dark:border-gray-800 dark:bg-[#121821]">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#eee6f1] pb-2 dark:border-gray-800">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#958aa1] dark:text-gray-500">
                筛选
              </span>
              <span className="truncate text-xs font-medium text-[#20172f] dark:text-gray-100">
                {currentFilterLabel}
              </span>
            </div>
            <div className="space-y-3 text-xs">
              <AdvancedFiltersContent orientation="stack" />
            </div>
          </aside>

          <div className="mt-3 min-w-0 space-y-4 lg:mt-0 lg:space-y-0">
            <details
              open={filtersOpen}
              onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
              className="group rounded-lg border border-[#e8e2ef] bg-white/80 text-xs lg:hidden dark:border-gray-800 dark:bg-[#121821]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#958aa1] dark:text-gray-500">
                    当前
                  </span>
                  <span className="ml-2 font-medium text-[#20172f] dark:text-gray-100">
                    {currentFilterLabel}
                  </span>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d8d0e3] px-2.5 py-1 text-[12px] text-[#675d72] transition-colors group-open:border-[#b9a6c9] group-open:text-[#20172f] dark:border-gray-700 dark:text-gray-300 dark:group-open:border-gray-500 dark:group-open:text-gray-100">
                  <span className="group-open:hidden">展开筛选</span>
                  <span className="hidden group-open:inline">收起筛选</span>
                  <svg
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                    className="h-3 w-3 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 4.5 6 7.5 9 4.5" />
                  </svg>
                </span>
              </summary>
              <div className="space-y-3 border-t border-[#e8e2ef] px-3 py-3 dark:border-gray-800">
                <AdvancedFiltersContent orientation="inline" />
              </div>
            </details>

            {listContent}
          </div>
        </div>
      ) : (
        <>
          {showReadingHighlights ? <ReadingHighlights sections={readingHighlights} /> : null}
          {listContent}
        </>
      )}
    </div>
  )
}

function FilterRow({ label, ariaLabel, orientation = 'inline', children }) {
  if (orientation === 'stack') {
    return (
      <div className="min-w-0">
        <span className="mb-1.5 block text-[11px] font-medium tracking-[0.04em] text-[#82788e] dark:text-[#7f8aa0]">
          {label}
        </span>
        <nav aria-label={ariaLabel} className="flex min-w-0 flex-wrap items-center gap-1.5">
          {children}
        </nav>
      </div>
    )
  }
  return (
    <div className="grid min-w-0 grid-cols-[4.25rem_minmax(0,1fr)] items-start gap-x-3 sm:grid-cols-[4.75rem_minmax(0,1fr)]">
      <span className="pt-1.5 text-xs leading-5 text-[#82788e] dark:text-[#7f8aa0]">{label}</span>
      <nav aria-label={ariaLabel} className="flex min-w-0 flex-wrap items-center gap-1.5">
        {children}
      </nav>
    </div>
  )
}

function FilterBreadcrumb({ path }) {
  const parts = String(path || '')
    .split(' / ')
    .map((part) => part.trim())
    .filter(Boolean)
  if (!parts.length) return null

  return (
    <div className="mt-1 rounded-lg border border-[#e8e2ef] bg-white/90 px-3 py-2.5 dark:border-gray-800 dark:bg-[#121821]">
      <div className="flex items-start gap-3">
        <span className="shrink-0 pt-px font-mono text-[10px] uppercase tracking-[0.14em] text-[#958aa1] dark:text-gray-500">
          当前
        </span>
        <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-5 text-[#665f70] dark:text-gray-400">
          {parts.map((part, index) => (
            <li key={`${part}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden="true" className="text-[#cbc3d5] dark:text-gray-600">
                  /
                </span>
              ) : null}
              <span
                className={
                  index === parts.length - 1
                    ? 'font-medium text-[#20172f] dark:text-gray-100'
                    : 'text-[#716779] dark:text-gray-400'
                }
              >
                {part}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function FilterChip({ label, count, active, onClick, prefix }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
        active
          ? 'border-[#cfc3e2] bg-[#f3eff9] font-medium text-[#49345f] dark:border-[#3c2f57] dark:bg-[#1f1830] dark:text-[#d8c5f3]'
          : 'border-transparent text-[#696071] hover:bg-[#f4f0f8] hover:text-[#20172f] dark:text-[#9aa6b8] dark:hover:bg-[#151d27] dark:hover:text-gray-100',
      ].join(' ')}
    >
      {prefix ? (
        <span className="font-mono text-[9px] tracking-[0.08em] text-[#958aa1] dark:text-[#667287]">{prefix}</span>
      ) : null}
      <span className="whitespace-nowrap">
        {label}
        <span
          className={[
            'font-mono text-[10px] tabular-nums',
            active ? 'text-[#7e718d] dark:text-[#9da7b8]' : 'text-[#9a93a3] dark:text-[#667287]',
          ].join(' ')}
        >
          ({count})
        </span>
      </span>
    </button>
  )
}

function ArticleRow({ item }) {
  const external = isExternalHref(item.href)
  return (
    <Link
      href={item.href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="article-row group block border-b border-[#e8e2ef] bg-transparent no-underline transition-colors last:border-b-0 hover:bg-white/80 hover:no-underline dark:border-gray-800 dark:hover:bg-[#151d27]"
    >
      <div className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_136px] sm:px-5">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0 text-sm text-[#a39aac]">▪</span>
            {item.dateLabel || item.date ? (
              <span className="shrink-0 whitespace-nowrap text-xs text-[#958aa1] dark:text-gray-400">{item.dateLabel || item.date}</span>
            ) : null}
            <span aria-hidden="true" className="shrink-0 text-xs text-[#d9d2e2]">
              ·
            </span>
            <span
              className={[
                'inline-flex max-w-full min-w-0 shrink items-center truncate rounded-full border px-2 py-[1px] text-[11px]',
                KIND_TAG_CLASS[item.kind] || KIND_TAG_CLASS.people,
              ].join(' ')}
            >
              {item.tagLabel}
            </span>
            {item.encrypted ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d6c9e3] bg-[#f4f0f8] px-2 py-[1px] text-[11px] text-[#72539b] dark:border-[#3c2f57] dark:bg-[#1f1830] dark:text-[#c5afe8]">
                <svg
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className="h-2.5 w-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
                  <path d="M4.2 5.5V4a1.8 1.8 0 0 1 3.6 0v1.5" />
                </svg>
                加密
              </span>
            ) : null}
            {item.hasAssessment ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d9c99b] bg-[#fff8e8] px-2 py-[1px] text-[11px] font-medium text-[#7a5318] dark:border-[#594621] dark:bg-[#241f13] dark:text-[#f0d49a]">
                测评
              </span>
            ) : null}
            <CanvasOriginBadge canvasId={item.canvasId} href={item.href} size="sm" />
            {item.version ? (
              <span className="inline-flex shrink-0 items-center rounded-full border border-[#d6d0df] bg-white/70 px-2 py-[1px] text-[11px] text-[#625d70] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300">
                {item.version}
              </span>
            ) : null}
          </div>
          <h2
            title={item.title}
            className="ml-5 line-clamp-2 text-[17px] font-semibold leading-7 text-[#20172f] transition-colors group-hover:text-[#120b1f] dark:text-gray-100 dark:group-hover:text-white"
          >
            {item.title}
          </h2>
          {item.summary ? (
            <p className="ml-5 mt-2 line-clamp-2 text-sm leading-relaxed text-[#6b6472] transition-colors group-hover:text-[#3c3149] dark:text-gray-300 dark:group-hover:text-gray-200">
              {item.summary}
            </p>
          ) : null}
          <div className="ml-5 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#958aa1] dark:text-gray-400">
            <span>{external ? '阅读原文 →' : '阅读全文 →'}</span>
            {item.readingMinutes ? (
              <span className="font-mono text-[11px] text-[#aaa1b5] dark:text-gray-500">
                · {item.readingMinutes} min
              </span>
            ) : null}
            {'pv' in item ? (
              <span className="font-mono text-[11px] text-[#aaa1b5] dark:text-gray-500">
                · 阅读量 {item.pvLoading ? '-' : formatPv(item.pv)}
              </span>
            ) : null}
          </div>
        </div>
        {item.image ? (
          <div className="relative h-28 overflow-hidden rounded-md border border-[#ded8e4] bg-[#f3eff7] dark:border-gray-800 dark:bg-gray-950 sm:h-24 sm:w-[136px]">
            {/*
              统一用客户端直连 <img>，不走 Next /_next/image 优化器：
              - 在线文章封面是站长填写的任意 HTTPS 地址，本就不能受静态域名白名单限制；
              - 研究类封面经 wsrv.nl 代理，Cloudflare 优化器抓 wsrv 会 403、本地 dev 优化器会超时 abort，
                造成列表裂图；客户端直连 wsrv 正常（200），故一并走 <img>。
              onError：任何封面加载失败就隐藏整块，避免出现裂图图标。
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image.src}
              alt={item.image.alt || `${item.title} 配图`}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const box = e.currentTarget.parentElement
                if (box) box.style.display = 'none'
              }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        ) : null}
      </div>
    </Link>
  )
}

function ReadingHighlights({ sections }) {
  return (
    <section className="rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel-strong)] p-4 shadow-[0_12px_36px_rgba(76,58,96,0.06)] dark:border-gray-800 dark:bg-[#0f141b]">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8e8798] dark:text-[#8e9ab0]">
            Start Here
          </p>
          <h2 className="mt-1 border-b-0 pb-0 text-[18px] font-semibold text-[#20172f] dark:text-gray-100">
            阅读起点
          </h2>
        </div>
        <Link
          href="/services"
          className="rounded-full border border-[#cfc6dc] bg-white px-3 py-1 text-[12px] text-[#49345f] no-underline transition hover:border-[var(--site-accent)] hover:text-[#20172f] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500"
        >
          合作 / 咨询 →
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-[#e5deec] bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2">
              <h3 className="text-[14px] font-semibold text-[#20172f] dark:text-gray-100">{section.title}</h3>
              <p className="mt-0.5 text-[11px] leading-5 text-[#716779] dark:text-gray-400">{section.desc}</p>
            </div>
            <div className="space-y-2">
              {section.items.map((item) => (
                <HighlightLink key={item.id || item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function HighlightLink({ item }) {
  const external = isExternalHref(item.href)
  return (
    <Link
      href={item.href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="group block rounded-lg px-2 py-1.5 no-underline transition hover:bg-[#f4f0f8] dark:hover:bg-[#151d27]"
    >
      <div className="mb-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={[
            'inline-flex max-w-full min-w-0 shrink items-center truncate rounded-full border px-1.5 py-px text-[10px]',
            KIND_TAG_CLASS[item.kind] || KIND_TAG_CLASS.people,
          ].join(' ')}
        >
          {item.tagLabel}
        </span>
        <CanvasOriginBadge canvasId={item.canvasId} href={item.href} size="sm" />
        {item.dateLabel || item.date ? (
          <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-[#958aa1] dark:text-gray-500">
            {item.dateLabel || item.date}
          </span>
        ) : null}
      </div>
      <p className="mb-0 line-clamp-2 text-[13px] font-medium leading-5 text-[#20172f] group-hover:text-[#120b1f] dark:text-gray-100 dark:group-hover:text-white">
        {item.title}
      </p>
    </Link>
  )
}
