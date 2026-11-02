import ResourcesDirectory from './ResourcesDirectory'
import { isResourceDirectoryItem } from '../../../lib/content/directoryMembership'
import { readRuntimeKnowledgeItems } from '../../../lib/content/knowledgeRuntime'
import { CONTENT_PV_ENTRIES } from '../../../lib/content/contentRegistry'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '资源',
  description: '按用途查找资料原文、学习索引、视觉影音、收藏订阅。',
  alternates: { canonical: '/resources' },
  openGraph: {
    type: 'website',
    siteName: '2aran.com',
    title: '资源',
    description: '资料、学习、影音与收藏，集中查找和使用。',
    url: 'https://2aran.com/resources',
    locale: 'zh_CN',
  },
}

const RESOURCE_ENTRIES = CONTENT_PV_ENTRIES.filter((entry) =>
  entry.category === 'resource' && isResourceDirectoryItem(entry),
)

export default async function ResourcesPage() {
  const knowledgeItems = await readRuntimeKnowledgeItems()
  const resources = new Map(
    knowledgeItems
      .filter((item) => item.contentKind === 'resource' && isResourceDirectoryItem(item))
      .map((item) => [item.href, item]),
  )

  // 合并资源主题页的阅读统计信息，按 href 去重。
  for (const entry of RESOURCE_ENTRIES) {
    const item = resources.get(entry.href)
    resources.set(entry.href, {
      ...entry,
      ...item,
      title: item?.title || entry.title,
      summary: item?.summary || entry.summary,
      date: item?.date || entry.date || '',
      tags: [...new Set([...(item?.tags || []), ...(entry.tags || [])])],
      pvKey: `resource/${entry.slug}`,
    })
  }

  return <ResourcesDirectory resources={[...resources.values()]} />
}
