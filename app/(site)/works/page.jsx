import Link from 'next/link'

import WorksMuseumClient from './WorksMuseumClient'
import {
  FEATURED_WORK_ITEM_IDS,
  WORK_ITEMS,
  WORK_TYPE_META,
  getWorkItemsByType,
} from '../../../lib/workItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '作品展厅',
  description:
    '涂阿燃的数字作品展厅：长期运行的对外产品、工程项目与代表性 AI 工程成果。',
  alternates: {
    canonical: '/works',
  },
}

export default function WorksPage() {
  const featuredItems = FEATURED_WORK_ITEM_IDS.map((id) => WORK_ITEMS.find((item) => item.id === id)).filter(Boolean)
  const sections = WORK_TYPE_META.map((type) => ({
    ...type,
    items: getWorkItemsByType(type.id),
  })).filter((section) => section.items.length > 0)
  const operatingCount = WORK_ITEMS.filter((item) => item.status === 'operating').length

  return (
    <main className="bg-[#ece8df] text-[#171611] dark:bg-[#0d0e0d] dark:text-gray-100">
      <WorksMuseumClient
        featuredItems={featuredItems}
        sections={sections}
        items={WORK_ITEMS}
        operatingCount={operatingCount}
      />

      <footer className="mx-auto max-w-[1240px] border-t border-[#c8c1b4] px-4 py-8 text-[13px] text-[#736b60] dark:border-white/15 dark:text-white/45 sm:px-6 lg:px-8">
        展厅只收录长期运行的产品与代表性工程项目；内容在{' '}
        <Link href="/articles" className="font-semibold text-[#171611] no-underline hover:opacity-65 dark:text-white">
          /articles
        </Link>
        ，作者与项目背景见{' '}
        <Link href="/about" className="font-semibold text-[#171611] no-underline hover:opacity-65 dark:text-white">
          /about
        </Link>。
      </footer>
    </main>
  )
}
