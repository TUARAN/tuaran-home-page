import SharePageButton from '../components/SharePageButton'
import GroupedDirectoryPage from '../components/GroupedDirectoryPage'
import { ENGINEERING_WORK_CATEGORIES, ENGINEERING_WORKS } from '../../../lib/engineeringWorks'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/rich-pages'

export const metadata = {
  title: '多维页面',
  description:
    '涂阿燃的多维页面专页：把调研、宣发、内容展示和可交互工具做成同一个可阅读、可操作、可传播的页面系统。',
  alternates: {
    canonical: '/rich-pages',
  },
  openGraph: {
    type: 'website',
    siteName: '2aran.com',
    title: '多维页面',
    description: '过去、现在、未来：可交互调研、可交互宣发、可交互内容展示的页面方法论与案例库。',
    url: PAGE_URL,
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '多维页面',
    description: '把调研、宣发和内容展示做成可交互页面系统。',
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
      .map((work) => ({
        ...work,
        actionLabel: '进入',
        mobileBadge: { label: work.kind || work.date, mono: false },
        badges: [
          { label: work.kind || '多维页面', mono: false },
          { label: work.date },
          ...(work.badge ? [{
            label: work.badge,
            className: 'border-[#c9b27c] bg-[#fff8e8] text-[#7a581b] dark:border-[#5b4824] dark:bg-[#241d12] dark:text-[#e7c77f]',
          }] : []),
        ],
      })),
  })).filter((section) => section.items.length > 0)

  return (
    <GroupedDirectoryPage
      eyebrow="Rich Pages"
      title="多维页面"
      description={(
        <p className="mb-0">
          把调研、数据、工具和行动入口放在一起：能阅读、能筛选、能对比，也能直接进入下一步。
        </p>
      )}
      headerActions={<SharePageButton title="多维页面" text="可阅读、可筛选、可操作的内容页。" url={PAGE_URL} size="sm" />}
      sections={sections}
      actionLabel="进入"
    />
  )
}
