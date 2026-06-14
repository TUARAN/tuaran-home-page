import Link from 'next/link'

import CanvasOriginBadge from '../components/CanvasOriginBadge'
import SharePageButton from '../components/SharePageButton'
import { ENGINEERING_WORK_CATEGORIES, ENGINEERING_WORKS } from '../../../lib/engineeringWorks'

export const dynamic = 'force-static'

export const metadata = {
  title: '多维页面',
  description:
    '涂阿燃自研的可视化页面、AI 工程实验、富数据研判与长期项目。这里收集已经做成系统的作品，而不只是文章目录。',
  alternates: {
    canonical: '/works',
  },
}

const FEATURED_WORK_IDS = ['platform-framework-pairs', 'cancers-overview', 'web-llm']

const CATEGORY_TONE = {
  'ai-engineering': {
    label: 'Run',
    accent: 'text-[#2f668a] dark:text-[#9ab6d4]',
    line: 'bg-[#9fc5d2] dark:bg-[#365264]',
    card:
      'border-[#cbd9ee] bg-[#f3f7fb] hover:border-[#9ebbd5] dark:border-[#2a3a55] dark:bg-[#121d29] dark:hover:border-[#49637f]',
    chip:
      'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
  },
  'data-visualization': {
    label: 'Map',
    accent: 'text-[#386b54] dark:text-[#9dcab1]',
    line: 'bg-[#9cc7ae] dark:bg-[#385947]',
    card:
      'border-[#c7dce4] bg-[#f1f8f6] hover:border-[#94bdac] dark:border-[#263f4b] dark:bg-[#13231f] dark:hover:border-[#416858]',
    chip:
      'border-[#c7dce4] bg-[#edf6f8] text-[#3f6878] dark:border-[#263f4b] dark:bg-[#13232b] dark:text-[#9ac9d8]',
  },
  'engineering-research': {
    label: 'Judge',
    accent: 'text-[#7352a2] dark:text-[#c5afe8]',
    line: 'bg-[#b7a0d1] dark:bg-[#4a3b62]',
    card:
      'border-[#d6d0df] bg-[#f7f3fa] hover:border-[#b8a6cd] dark:border-[#303947] dark:bg-[#181521] dark:hover:border-[#524465]',
    chip:
      'border-[#cfc3e2] bg-[#f3eff9] text-[#72539b] dark:border-[#3c2f57] dark:bg-[#1f1830] dark:text-[#c5afe8]',
  },
  'long-term-project': {
    label: 'Build',
    accent: 'text-[#8b5a1f] dark:text-[#d4bd87]',
    line: 'bg-[#d0b47e] dark:bg-[#6a5428]',
    card:
      'border-[#ded8c8] bg-[#f8f6ef] hover:border-[#c4ad78] dark:border-[#3d3829] dark:bg-[#1d1b14] dark:hover:border-[#6d5d33]',
    chip:
      'border-[#ded8c8] bg-[#f7f2e6] text-[#7c5d34] dark:border-[#3d3829] dark:bg-[#242014] dark:text-[#d4bd87]',
  },
}

const DEFAULT_TONE = {
  label: 'Work',
  accent: 'text-[#67695d] dark:text-gray-400',
  line: 'bg-[#b7baa8] dark:bg-[#475061]',
  card:
    'border-[#d8d9cf] bg-white/55 hover:border-[#b7baa8] dark:border-gray-800 dark:bg-[#111820] dark:hover:border-gray-700',
  chip:
    'border-[#d8d9cf] bg-white/70 text-[#606358] dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300',
}

function formatDate(iso) {
  if (!iso) return ''
  return iso.replace(/-/g, ' / ')
}

function getWorksByCategory(categoryId) {
  return ENGINEERING_WORKS.filter((work) => work.category === categoryId)
}

function getCategory(categoryId) {
  return ENGINEERING_WORK_CATEGORIES.find((category) => category.id === categoryId)
}

function getTone(categoryId) {
  return CATEGORY_TONE[categoryId] || DEFAULT_TONE
}

function getFeaturedWorks() {
  return FEATURED_WORK_IDS.map((id) => ENGINEERING_WORKS.find((work) => work.id === id)).filter(Boolean)
}

function ArrowIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className || 'h-3.5 w-3.5'}>
      <path
        d="M5 11L11 5M6.5 5H11V9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WorkPreviewMark({ categoryId, index = 0 }) {
  const tone = getTone(categoryId)

  return (
    <div
      aria-hidden="true"
      className="relative h-24 overflow-hidden border-b border-black/5 bg-white/45 dark:border-white/5 dark:bg-white/[0.03]"
    >
      <div className={`absolute left-4 top-4 h-1.5 w-12 rounded-full ${tone.line}`} />
      <div className="absolute bottom-4 left-4 right-4 flex items-end gap-2">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={`w-full rounded-t-sm ${tone.line}`}
            style={{ height: `${20 + ((bar * 13 + index * 9) % 48)}px`, opacity: 0.44 + bar * 0.08 }}
          />
        ))}
      </div>
      <div className="absolute right-4 top-4 grid grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((dot) => (
          <span key={dot} className={`h-2.5 w-2.5 rounded-full ${tone.line}`} style={{ opacity: 0.38 + dot * 0.12 }} />
        ))}
      </div>
    </div>
  )
}

function CategoryShortcut({ section }) {
  const tone = getTone(section.id)

  return (
    <Link
      href={`#${section.id}`}
      className="group flex min-h-[92px] flex-col justify-between border border-[#d8d9cf] bg-white/45 p-3 text-[#171611] no-underline transition visited:text-[#171611] hover:-translate-y-0.5 hover:border-[#b7baa8] hover:bg-white/72 dark:border-gray-800 dark:bg-[#101720] dark:text-gray-100 dark:visited:text-gray-100 dark:hover:border-gray-700 dark:hover:bg-[#151c25]"
    >
      <span className="flex items-center justify-between gap-2">
        <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${tone.accent}`}>{tone.label}</span>
        <span className="font-mono text-[11px] text-[#8d9083] dark:text-gray-500">{section.works.length}</span>
      </span>
      <span>
        <span className="block text-[15px] font-semibold leading-snug text-[#171611] dark:text-gray-100">
          {section.title}
        </span>
        <span className="mt-1 line-clamp-2 block text-[12px] leading-5 text-[#67695d] dark:text-gray-500">
          {section.description}
        </span>
      </span>
    </Link>
  )
}

function FeaturedWorkCard({ work, index }) {
  const category = getCategory(work.category)
  const tone = getTone(work.category)

  return (
    <article className={`group overflow-hidden border transition duration-200 hover:-translate-y-1 ${tone.card}`}>
      <WorkPreviewMark categoryId={work.category} index={index} />
      <div className="flex min-h-[260px] flex-col p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${tone.chip}`}>
            {category?.title || work.kind || '作品'}
          </span>
          {work.badge ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#9a6a2a] dark:text-[#d4bd87]">
              {work.badge}
            </span>
          ) : null}
          <CanvasOriginBadge canvasId={work.canvasId} href={work.href} size="sm" />
        </div>

        <h2 className="mb-0 border-0 p-0 text-[19px] font-semibold leading-snug text-[#15140f] dark:text-gray-100 sm:text-[21px]">
          <Link
            href={work.href}
            className="text-[#15140f] no-underline transition visited:text-[#15140f] hover:text-[#8b5a1f] dark:text-gray-100 dark:visited:text-gray-100 dark:hover:text-[#d4bd87]"
          >
            {work.title}
          </Link>
        </h2>
        <p className="mb-0 mt-3 line-clamp-5 text-[13.5px] leading-7 text-[#51514a] dark:text-gray-400">
          {work.summary}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span className="font-mono text-[10px] leading-5 text-[#858779] dark:text-gray-500">
            <span className="block tabular-nums">{formatDate(work.date)}</span>
            <span className="block">{work.kind || '原创工程'}</span>
          </span>
          <Link
            href={work.href}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8b5a1f] no-underline transition visited:text-[#8b5a1f] group-hover:gap-2 dark:text-[#d4bd87] dark:visited:text-[#d4bd87]"
          >
            进入作品
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  )
}

function WorkCard({ work, index }) {
  const tone = getTone(work.category)

  return (
    <article className={`group grid min-h-[220px] overflow-hidden border transition hover:-translate-y-0.5 ${tone.card}`}>
      <WorkPreviewMark categoryId={work.category} index={index} />
      <div className="flex flex-col p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#858779] dark:text-gray-500">
            {formatDate(work.date)}
          </span>
          <span className={`inline-flex border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] ${tone.chip}`}>
            {work.kind || '原创工程'}
          </span>
          {work.badge ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#9a6a2a] dark:text-[#d4bd87]">
              {work.badge}
            </span>
          ) : null}
          <CanvasOriginBadge canvasId={work.canvasId} href={work.href} size="sm" />
        </div>
        <h3 className="mb-0 line-clamp-2 text-[17px] font-semibold leading-snug text-[#15140f] dark:text-gray-100">
          <Link
            href={work.href}
            className="text-[#15140f] no-underline transition visited:text-[#15140f] hover:text-[#8b5a1f] dark:text-gray-100 dark:visited:text-gray-100 dark:hover:text-[#d4bd87]"
          >
            {work.title}
          </Link>
        </h3>
        <p className="mb-0 mt-2 line-clamp-3 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
          {work.summary}
        </p>
        <Link
          href={work.href}
          className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[12px] font-semibold text-[#8b5a1f] no-underline transition visited:text-[#8b5a1f] group-hover:gap-2 dark:text-[#d4bd87] dark:visited:text-[#d4bd87]"
        >
          打开
          <ArrowIcon />
        </Link>
      </div>
    </article>
  )
}

export default function WorksPage() {
  const uncategorizedWorks = ENGINEERING_WORKS.filter(
    (work) => !ENGINEERING_WORK_CATEGORIES.some((category) => category.id === work.category)
  )
  const sections = [
    ...ENGINEERING_WORK_CATEGORIES.map((category) => ({
      ...category,
      works: getWorksByCategory(category.id),
    })),
    ...(uncategorizedWorks.length
      ? [
          {
            id: 'uncategorized',
            title: '其他作品',
            description: '尚未归入固定类型的工程页面。',
            works: uncategorizedWorks,
          },
        ]
      : []),
  ].filter((section) => section.works.length > 0)
  const featuredWorks = getFeaturedWorks()
  const latestWork = ENGINEERING_WORKS[0]

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="border-b border-[#dee0db] pb-8 dark:border-gray-800">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.24em] text-[#767869] dark:text-[#8e9ab0]">
              Works / Systems / Interfaces
            </p>
            <h1 className="mt-3 font-serif text-[32px] font-semibold leading-tight text-[#15140f] dark:text-gray-100 sm:text-[42px]">
              做成系统的作品
            </h1>
            <p className="mb-0 mt-4 max-w-3xl text-[15px] leading-8 text-[#444740] dark:text-gray-300">
              这里放的不是普通文章目录，而是已经落成页面的工程作品：可交互的数据视图、AI 工具实验、平台格局研判和长期写作项目。
            </p>
          </div>

          <div className="flex flex-col gap-3 border-l-0 border-[#dee0db] text-[12px] leading-6 text-[#67695d] dark:border-gray-800 dark:text-gray-500 lg:border-l lg:pl-5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="border border-[#d8d9cf] bg-white/45 px-2 py-3 dark:border-gray-800 dark:bg-[#101720]">
                <span className="block font-mono text-[18px] text-[#15140f] dark:text-gray-100">{ENGINEERING_WORKS.length}</span>
                <span className="mt-1 block text-[11px]">作品</span>
              </div>
              <div className="border border-[#d8d9cf] bg-white/45 px-2 py-3 dark:border-gray-800 dark:bg-[#101720]">
                <span className="block font-mono text-[18px] text-[#15140f] dark:text-gray-100">{sections.length}</span>
                <span className="mt-1 block text-[11px]">方向</span>
              </div>
              <div className="border border-[#d8d9cf] bg-white/45 px-2 py-3 dark:border-gray-800 dark:bg-[#101720]">
                <span className="block font-mono text-[18px] text-[#15140f] dark:text-gray-100">
                  {latestWork?.date?.slice(5) || '-'}
                </span>
                <span className="mt-1 block text-[11px]">最近更新</span>
              </div>
            </div>
            <SharePageButton
              title="涂阿燃 · 多维页面"
              text="自研可视化、AI 工程实验、富数据研判与长期项目"
              url="https://2aran.com/works"
              size="md"
            />
          </div>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="featured-works">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#858779] dark:text-gray-500">
              Featured
            </p>
            <h2 id="featured-works" className="mb-0 border-0 p-0 text-[22px] font-semibold text-[#15140f] dark:text-gray-100">
              先看这几件
            </h2>
          </div>
          <Link
            href="/articles?tab=works"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#67695d] no-underline transition visited:text-[#67695d] hover:text-[#8b5a1f] dark:text-gray-400 dark:visited:text-gray-400 dark:hover:text-[#d4bd87]"
          >
            查看文章索引里的多维页面
            <ArrowIcon />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {featuredWorks.map((work, index) => (
            <FeaturedWorkCard key={work.id} work={work} index={index} />
          ))}
        </div>
      </section>

      <nav aria-label="作品类型" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <CategoryShortcut key={section.id} section={section} />
        ))}
      </nav>

      <section className="mt-12 space-y-12">
        {sections.map((section, sectionIndex) => (
          <section key={section.id} id={section.id} className="scroll-mt-24 border-t border-[#dee0db] pt-6 dark:border-gray-800">
            <div className="mb-5 grid gap-3 md:grid-cols-[220px_1fr] md:items-end">
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#848676] dark:text-gray-500">
                  {String(sectionIndex + 1).padStart(2, '0')} / {getTone(section.id).label}
                </p>
                <h2 className="mb-0 border-0 p-0 font-serif text-[24px] font-semibold leading-tight text-[#15140f] dark:text-gray-100">
                  {section.title}
                </h2>
              </div>
              <p className="mb-0 max-w-2xl text-[13px] leading-6 text-[#67695d] dark:text-gray-500">
                {section.description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.works.map((work, index) => (
                <WorkCard key={work.id} work={work} index={index + sectionIndex} />
              ))}
            </div>
          </section>
        ))}
      </section>

      <footer className="mt-12 grid gap-4 border-t border-[#dee0db] pt-6 text-[12px] leading-6 text-[#67695d] dark:border-gray-800 dark:text-gray-500 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="mb-0">
            若条目带 <CanvasOriginBadge canvasId="cloudflare-personal-site-map" size="sm" className="mx-1 align-middle" />{' '}
            标签，表示先在 Cursor Canvas 里完成交互原型，再落地为站内工程页。
          </p>
          <p className="mb-0 mt-2">
            普通文章、调研和资料索引仍在{' '}
            <Link href="/articles" className="text-[#8b5a1f] underline underline-offset-2 visited:text-[#8b5a1f] dark:text-[#d4bd87] dark:visited:text-[#d4bd87]">/articles</Link>。
          </p>
        </div>
        <Link
          href="#featured-works"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#8b5a1f] no-underline visited:text-[#8b5a1f] dark:text-[#d4bd87] dark:visited:text-[#d4bd87]"
        >
          回到代表作品
          <ArrowIcon />
        </Link>
      </footer>
    </main>
  )
}
