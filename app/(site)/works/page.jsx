import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'
import SiteToolsPanel from '../components/SiteToolsPanel'
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
    '涂阿燃的数字作品展厅：对外产品、AI 工程实验、内容系统、研究页面与工具作品。',
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

      <section className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t border-[#c8c1b4] pt-8 dark:border-white/15">
          <div>
            <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#8b8275] dark:text-white/45">
              Museum Utilities
            </p>
            <h2 className="mb-0 border-0 p-0 font-serif text-[24px] font-bold text-[#171611] dark:text-gray-100">站内工具</h2>
          </div>
          <SharePageButton
            title="涂阿燃 · 作品展厅"
            text="对外产品、AI 工程实验、内容系统、研究页面与工具作品"
            url="https://2aran.com/works"
            size="md"
          />
        </div>
        <SiteToolsPanel />
      </section>

      <footer className="mx-auto max-w-[1240px] border-t border-[#c8c1b4] px-4 py-8 text-[13px] text-[#736b60] dark:border-white/15 dark:text-white/45 sm:px-6 lg:px-8">
        展厅收录可运行的项目与富页面；普通文章在{' '}
        <Link href="/articles" className="font-semibold text-[#171611] no-underline hover:opacity-65 dark:text-white">
          /articles
        </Link>。
      </footer>
    </main>
  )
}
