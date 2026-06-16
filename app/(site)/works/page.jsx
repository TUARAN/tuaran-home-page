import Link from 'next/link'

import CanvasOriginBadge from '../components/CanvasOriginBadge'
import SharePageButton from '../components/SharePageButton'
import SiteToolsPanel from '../components/SiteToolsPanel'
import {
  FEATURED_WORK_ITEM_IDS,
  WORK_ITEMS,
  WORK_TYPE_META,
  getWorkItemsByType,
  getWorkStatusLabel,
  getWorkTypeMeta,
} from '../../../lib/workItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '作品与项目',
  description:
    '涂阿燃的对外产品、AI 工程实验、内容系统、研究页面与工具作品。这里展示已经做成系统的项目，而不只是文章目录。',
  alternates: {
    canonical: '/works',
  },
}

const TYPE_TONE = {
  product: {
    accent: '#8B4513',
    bg: '#FDF8F3',
    border: '#E8D5C0',
  },
  'ai-engineering': {
    accent: '#1E6FA0',
    bg: '#F4F8FB',
    border: '#C5D8E8',
  },
  'content-system': {
    accent: '#2D7A4F',
    bg: '#F2F8F4',
    border: '#C0DDC8',
  },
  'research-page': {
    accent: '#6B4BBA',
    bg: '#F6F4FC',
    border: '#D5CCEE',
  },
  'tool-experiment': {
    accent: '#A76A00',
    bg: '#FCFAF4',
    border: '#E8DDC0',
  },
}

function getTone(type) {
  return TYPE_TONE[type] || TYPE_TONE.product
}

function isExternalHref(href) {
  return /^https?:\/\//.test(href)
}

function ArrowIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className || 'h-3.5 w-3.5'}>
      <path d="M5 11L11 5M6.5 5H11V9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WorkLink({ item, children, className = '', ...props }) {
  return (
    <a
      href={item.href}
      target={isExternalHref(item.href) ? '_blank' : undefined}
      rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
      className={className}
      {...props}
    >
      {children}
    </a>
  )
}

function StatusPill({ status }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-[#F1EEE5] px-2.5 text-[11px] font-medium text-[#6E6F64] dark:bg-[#232323] dark:text-gray-400">
      {getWorkStatusLabel(status)}
    </span>
  )
}

function TypeBadge({ type }) {
  const tone = getTone(type)
  const typeMeta = getWorkTypeMeta(type)
  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold"
      style={{ backgroundColor: tone.bg, color: tone.accent }}
    >
      {typeMeta?.title || type}
    </span>
  )
}

function StatBlock({ value, label }) {
  return (
    <div className="border-l border-[#E8E4DB] pl-4 dark:border-[#2A2820]">
      <div className="font-serif text-[30px] font-bold leading-none text-[#15140f] dark:text-gray-100">{value}</div>
      <div className="mt-2 text-[12px] leading-relaxed text-[#8E8F80] dark:text-gray-500">{label}</div>
    </div>
  )
}

function FeaturedWorkCard({ item, index }) {
  const tone = getTone(item.type)

  return (
    <article className="flex h-full flex-col border border-[#E8E4DB] bg-[#FFFDF8] p-5 dark:border-[#2A2820] dark:bg-[#151515]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: tone.accent }}>
            主线 {String(index + 1).padStart(2, '0')}
          </p>
          <TypeBadge type={item.type} />
        </div>
        <StatusPill status={item.status} />
      </div>

      <h3 className="mb-0 border-0 p-0 font-serif text-[25px] font-bold leading-tight text-[#15140f] dark:text-gray-100">
        <WorkLink item={item} className="text-[#15140f] no-underline hover:opacity-75 dark:text-gray-100">
          {item.title}
        </WorkLink>
      </h3>
      <p className="mb-0 mt-2 text-[13px] font-medium text-[#8E8F80] dark:text-gray-500">{item.role}</p>
      <p className="mb-0 mt-4 flex-1 text-[14px] leading-relaxed text-[#55564F] dark:text-gray-400">
        {item.summary}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {item.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="border border-[#E8E4DB] bg-white px-2.5 py-1 text-[11px] font-medium text-[#6E6F64] dark:border-[#2A2820] dark:bg-[#101010] dark:text-gray-400">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6 border-t border-[#E8E4DB] pt-4 dark:border-[#2A2820]">
        <WorkLink item={item} className="inline-flex items-center gap-1.5 text-[13px] font-semibold no-underline" style={{ color: tone.accent }}>
          {isExternalHref(item.href) ? '访问项目' : '打开页面'}
          <ArrowIcon className="h-3.5 w-3.5" />
        </WorkLink>
      </div>
    </article>
  )
}

function TypeOverviewCard({ section }) {
  const tone = getTone(section.id)

  return (
    <Link
      href={`#${section.id}`}
      className="group block border border-[#E8E4DB] bg-white p-4 text-left no-underline transition-colors hover:border-[#CFC8B8] dark:border-[#2A2820] dark:bg-[#151515] dark:hover:border-[#444]"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="h-2.5 w-2.5" style={{ backgroundColor: tone.accent }} />
        <span className="font-mono text-[12px] font-bold text-[#B0AE9E] dark:text-gray-600">{section.items.length}</span>
      </div>
      <h3 className="mb-0 border-0 p-0 text-[15px] font-bold text-[#15140f] dark:text-gray-100">{section.title}</h3>
      <p className="mb-0 mt-2 min-h-[42px] text-[12px] leading-relaxed text-[#7A7B70] dark:text-gray-500">{section.description}</p>
    </Link>
  )
}

function WorkItemRow({ item }) {
  const tone = getTone(item.type)

  return (
    <article className="grid gap-4 border-t border-[#E8E4DB] py-5 first:border-t-0 dark:border-[#2A2820] md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-start">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <TypeBadge type={item.type} />
          <StatusPill status={item.status} />
          {item.canvasId ? <CanvasOriginBadge canvasId={item.canvasId} href={item.href} size="sm" /> : null}
        </div>
        <h3 className="mb-0 border-0 p-0 text-[18px] font-bold leading-snug text-[#15140f] dark:text-gray-100">
          <WorkLink item={item} className="text-[#15140f] no-underline hover:opacity-75 dark:text-gray-100">
            {item.title}
          </WorkLink>
        </h3>
        <p className="mb-0 mt-2 max-w-3xl text-[13px] leading-relaxed text-[#5E5F55] dark:text-gray-400">{item.summary}</p>
      </div>

      <div className="text-[12px] leading-relaxed text-[#8E8F80] dark:text-gray-500">
        <div className="font-semibold text-[#5E5F55] dark:text-gray-400">{item.role}</div>
        {item.domains?.length ? <div className="mt-1">{item.domains.join(' / ')}</div> : null}
      </div>

      <WorkLink item={item} className="inline-flex items-center gap-1.5 text-[13px] font-semibold no-underline md:justify-self-end" style={{ color: tone.accent }}>
        {isExternalHref(item.href) ? '访问' : '打开'}
        <ArrowIcon className="h-3.5 w-3.5" />
      </WorkLink>
    </article>
  )
}

function WorkSection({ section, sectionIndex }) {
  const tone = getTone(section.id)
  const sortedItems = [...section.items].sort((a, b) => (b.priority || 0) - (a.priority || 0))

  return (
    <section id={section.id} className="scroll-mt-28 border-t border-[#E8E4DB] py-10 dark:border-[#2A2820] sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: tone.accent }}>
            {String(sectionIndex + 1).padStart(2, '0')} · {section.titleEn}
          </p>
          <h2 className="mb-0 border-0 p-0 font-serif text-[28px] font-bold leading-tight text-[#15140f] dark:text-gray-100">{section.title}</h2>
          <p className="mb-0 mt-3 text-[13px] leading-relaxed text-[#7A7B70] dark:text-gray-500">{section.description}</p>
        </div>

        <div className="bg-[#FFFDF8] px-4 dark:bg-[#151515] sm:px-6">
          {sortedItems.map((item) => (
            <WorkItemRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function WorksPage() {
  const featuredItems = FEATURED_WORK_ITEM_IDS.map((id) => WORK_ITEMS.find((item) => item.id === id)).filter(Boolean)
  const sections = WORK_TYPE_META.map((type) => ({
    ...type,
    items: getWorkItemsByType(type.id),
  })).filter((section) => section.items.length > 0)
  const operatingCount = WORK_ITEMS.filter((item) => item.status === 'operating').length

  return (
    <main className="bg-[#FAF8F1] text-[#15140f] dark:bg-[#101010] dark:text-gray-100">
      <header className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
        <div className="grid gap-10 border-b border-[#E8E4DB] pb-10 dark:border-[#2A2820] lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="mb-0 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#8E8F80] dark:text-gray-500">
              Works Index
            </p>
            <h1 className="mb-0 mt-4 max-w-3xl font-serif text-[42px] font-bold leading-tight text-[#15140f] dark:text-gray-100 sm:text-[58px]">
              作品不是陈列，
              <br className="hidden sm:block" />
              是一张项目地图
            </h1>
            <p className="mb-0 mt-5 max-w-2xl text-[16px] leading-[1.8] text-[#5E5F55] dark:text-gray-400">
              先看当前最重要的三条经营主轴，再按「对外产品、AI 工程、内容系统、研究页面、工具实验」理解所有作品。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#featured-works" className="inline-flex min-h-[42px] items-center gap-2 bg-[#15140f] px-5 text-[14px] font-semibold text-[#FAF8F1] no-underline transition-colors hover:bg-[#2F2B22] dark:bg-gray-100 dark:text-[#111820] dark:hover:bg-gray-200">
                看经营主轴
                <ArrowIcon className="h-3.5 w-3.5" />
              </Link>
              <Link href="#work-categories" className="inline-flex min-h-[42px] items-center gap-2 border border-[#D8D2C4] px-5 text-[14px] font-semibold text-[#51514A] no-underline transition-colors hover:border-[#BEB5A2] hover:text-[#15140f] dark:border-[#333] dark:text-gray-400 dark:hover:text-gray-100">
                按类型浏览
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 lg:grid-cols-1">
            <StatBlock value={WORK_ITEMS.length} label="全部项目" />
            <StatBlock value={operatingCount} label="运营中" />
            <StatBlock value={sections.length} label="作品类型" />
          </div>
        </div>
      </header>

      <section id="featured-works" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-8 sm:px-6" aria-labelledby="featured-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E8F80] dark:text-gray-500">
              Operating Spine
            </p>
            <h2 id="featured-heading" className="mb-0 border-0 p-0 font-serif text-[30px] font-bold text-[#15140f] dark:text-gray-100">
              三条经营主轴
            </h2>
          </div>
          <Link href="/services" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#51514A] no-underline transition-colors hover:text-[#15140f] dark:text-gray-400 dark:hover:text-gray-100">
            合作方式
            <ArrowIcon />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {featuredItems.map((item, index) => (
            <FeaturedWorkCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </section>

      <section id="work-categories" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-8 sm:px-6" aria-labelledby="categories-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E8F80] dark:text-gray-500">
              Browse By Type
            </p>
            <h2 id="categories-heading" className="mb-0 border-0 p-0 font-serif text-[30px] font-bold text-[#15140f] dark:text-gray-100">
              按类型看清楚
            </h2>
          </div>
          <SharePageButton
            title="涂阿燃 · 作品与项目"
            text="对外产品、AI 工程实验、内容系统、研究页面与工具作品"
            url="https://2aran.com/works"
            size="md"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {sections.map((section) => (
            <TypeOverviewCard key={section.id} section={section} />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-6 pt-4 sm:px-6">
        {sections.map((section, index) => (
          <WorkSection key={section.id} section={section} sectionIndex={index} />
        ))}
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-5">
          <h2 className="mb-0 border-0 p-0 text-[20px] font-bold text-[#15140f] dark:text-gray-100">站内工具</h2>
          <p className="mb-0 mt-1 text-[13px] leading-relaxed text-[#8E8F80] dark:text-gray-500">
            自用的小工具集合。
          </p>
        </div>
        <SiteToolsPanel />
      </section>

      <footer className="mx-auto max-w-6xl border-t border-[#E8E4DB] px-4 py-8 text-[13px] leading-relaxed text-[#8E8F80] dark:border-[#2A2820] dark:text-gray-500 sm:px-6">
        研究型富页面仍保留在这里，但降为作品矩阵的一类；普通文章在{' '}
        <Link href="/articles" className="font-semibold text-[#15140f] no-underline transition-colors hover:opacity-70 dark:text-gray-200">
          /articles
        </Link>。
      </footer>
    </main>
  )
}
