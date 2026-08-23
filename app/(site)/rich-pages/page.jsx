import RichPagesDirectory from './RichPagesDirectory'
import {
  ENGINEERING_WORK_CATEGORIES,
  ENGINEERING_WORKS,
  getRichPagePresentation,
  getRichPagePvKey,
} from '../../../lib/engineeringWorks'
import { getOwnerPageState } from '../../../lib/adminPageAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const PAGE_URL = 'https://2aran.com/rich-pages'

export const metadata = {
  title: '互动专题',
  description:
    '可阅读、可筛选、可操作的互动专题与内容作品。',
  alternates: {
    canonical: '/rich-pages',
  },
  openGraph: {
    type: 'website',
    siteName: '2aran.com',
    title: '互动专题',
    description: '把数据、分析和工具组织成可阅读、可筛选、可操作的内容。',
    url: PAGE_URL,
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '互动专题',
    description: '可阅读、可筛选、可操作的内容作品。',
    creator: '@Anthony404',
    site: '@Anthony404',
  },
}

export default async function RichPagesPage() {
  const { state } = await getOwnerPageState()
  const canViewOwnerContent = state === 'owner'
  const categoryLabels = Object.fromEntries(ENGINEERING_WORK_CATEGORIES.map((category) => [category.id, category.title]))
  const works = ENGINEERING_WORKS
    .filter((work) => work.audience !== 'owner' || canViewOwnerContent)
    .map((work) => {
      const presentation = getRichPagePresentation(work)
      return {
        ...work,
        categoryLabel: categoryLabels[work.category] || '互动专题',
        presentation: presentation.id,
        presentationLabel: presentation.label,
        pvKey: getRichPagePvKey(work),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <RichPagesDirectory works={works} categories={ENGINEERING_WORK_CATEGORIES} />
  )
}
