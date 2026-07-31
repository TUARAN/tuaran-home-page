import SharePageButton from '../components/SharePageButton'
import GroupedDirectoryPage from '../components/GroupedDirectoryPage'
import {
  ENGINEERING_WORK_CATEGORIES,
  ENGINEERING_WORKS,
  getRichPagePresentation,
  getRichPagePvKey,
} from '../../../lib/engineeringWorks'

export const dynamic = 'force-static'

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

export default function RichPagesPage() {
  const sections = ENGINEERING_WORK_CATEGORIES.map((category) => ({
    ...category,
    titleEn: category.id.replaceAll('-', ' '),
    items: ENGINEERING_WORKS
      .filter((work) => work.category === category.id)
      .map((work) => {
        const presentation = getRichPagePresentation(work)
        return {
          ...work,
          analyticsEvent: 'entry_click',
          analyticsSurface: 'interactive_directory',
          analyticsDestinationKind: 'interactive',
          pvKey: getRichPagePvKey(work),
          actionLabel: '进入',
          mobileBadge: { label: presentation.label, mono: false },
          badges: [
            {
              label: presentation.label,
              mono: false,
              className: presentation.id === 'feature'
                ? 'border-[#6d5d82] bg-[#2f2146] text-white dark:border-[#75698a] dark:bg-[#c1c6a8] dark:text-[#171611]'
                : '',
            },
            { label: work.kind || '互动专题', mono: false },
            { label: work.date },
            ...(work.badge ? [{
              label: work.badge,
              className: 'border-[#c9b27c] bg-[#fff8e8] text-[#7a581b] dark:border-[#5b4824] dark:bg-[#241d12] dark:text-[#e7c77f]',
            }] : []),
          ],
        }
      }),
  })).filter((section) => section.items.length > 0)

  return (
    <GroupedDirectoryPage
      eyebrow="Rich Pages"
      title="互动专题"
      description={(
        <p className="mb-0">
          数据、分析和工具可以在同一页面中阅读、筛选和操作，适合呈现传统图文难以表达的关系。
        </p>
      )}
      headerActions={<SharePageButton title="互动专题" text="可阅读、可筛选、可操作的内容页。" url={PAGE_URL} size="sm" />}
      sections={sections}
      actionLabel="进入"
    />
  )
}
