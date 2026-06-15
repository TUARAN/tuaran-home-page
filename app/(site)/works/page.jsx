import Link from 'next/link'

import CanvasOriginBadge from '../components/CanvasOriginBadge'
import SharePageButton from '../components/SharePageButton'
import SiteToolsPanel from '../components/SiteToolsPanel'
import {
  FEATURED_WORK_ITEM_IDS,
  WORK_ITEMS,
  WORK_STRATEGY_PARAGRAPHS,
  WORK_TYPE_META,
  getWorkItemsByType,
  getWorkStatusLabel,
  getWorkTypeMeta,
} from '../../../lib/workItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '作品与项目',
  description:
    '涂阿燃的产品站点、AI 工程实验、内容系统、研究页面与工具作品。这里展示已经做成系统的项目，而不只是文章目录。',
  alternates: {
    canonical: '/works',
  },
}

const TYPE_TONE = {
  product: {
    label: 'Product',
    accent: 'text-[#8b4b2f] dark:text-[#d9a38e]',
    line: 'bg-[#d6a18f] dark:bg-[#704838]',
    card:
      'border-[#dfcfc8] bg-[#fbf5f2] hover:border-[#c69c8c] dark:border-[#46332d] dark:bg-[#1f1715] dark:hover:border-[#725143]',
    chip:
      'border-[#dfcfc8] bg-white/70 text-[#8b4b2f] dark:border-[#46332d] dark:bg-[#241a17] dark:text-[#d9a38e]',
  },
  'ai-engineering': {
    label: 'AI',
    accent: 'text-[#2f668a] dark:text-[#9ab6d4]',
    line: 'bg-[#9fc5d2] dark:bg-[#365264]',
    card:
      'border-[#cbd9ee] bg-[#f3f7fb] hover:border-[#9ebbd5] dark:border-[#2a3a55] dark:bg-[#121d29] dark:hover:border-[#49637f]',
    chip:
      'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
  },
  'content-system': {
    label: 'System',
    accent: 'text-[#386b54] dark:text-[#9dcab1]',
    line: 'bg-[#9cc7ae] dark:bg-[#385947]',
    card:
      'border-[#c7dce4] bg-[#f1f8f6] hover:border-[#94bdac] dark:border-[#263f4b] dark:bg-[#13231f] dark:hover:border-[#416858]',
    chip:
      'border-[#c7dce4] bg-[#edf6f8] text-[#3f6878] dark:border-[#263f4b] dark:bg-[#13232b] dark:text-[#9ac9d8]',
  },
  'research-page': {
    label: 'Research',
    accent: 'text-[#7352a2] dark:text-[#c5afe8]',
    line: 'bg-[#b7a0d1] dark:bg-[#4a3b62]',
    card:
      'border-[#d6d0df] bg-[#f7f3fa] hover:border-[#b8a6cd] dark:border-[#303947] dark:bg-[#181521] dark:hover:border-[#524465]',
    chip:
      'border-[#cfc3e2] bg-[#f3eff9] text-[#72539b] dark:border-[#3c2f57] dark:bg-[#1f1830] dark:text-[#c5afe8]',
  },
  'tool-experiment': {
    label: 'Tool',
    accent: 'text-[#8b5a1f] dark:text-[#d4bd87]',
    line: 'bg-[#d0b47e] dark:bg-[#6a5428]',
    card:
      'border-[#ded8c8] bg-[#f8f6ef] hover:border-[#c4ad78] dark:border-[#3d3829] dark:bg-[#1d1b14] dark:hover:border-[#6d5d33]',
    chip:
      'border-[#ded8c8] bg-[#f7f2e6] text-[#7c5d34] dark:border-[#3d3829] dark:bg-[#242014] dark:text-[#d4bd87]',
  },
}

const DEFAULT_TONE = TYPE_TONE.product

function getTone(type) {
  return TYPE_TONE[type] || DEFAULT_TONE
}

function isExternalHref(href) {
  return /^https?:\/\//.test(href)
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

function WorkPreviewMark({ type, index = 0 }) {
  const tone = getTone(type)

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
            style={{ height: `${18 + ((bar * 11 + index * 7) % 48)}px`, opacity: 0.42 + bar * 0.08 }}
          />
        ))}
      </div>
      <div className="absolute right-4 top-4 grid grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((dot) => (
          <span key={dot} className={`h-2.5 w-2.5 rounded-full ${tone.line}`} style={{ opacity: 0.35 + dot * 0.13 }} />
        ))}
      </div>
    </div>
  )
}

function WorkLink({ item, children, className }) {
  if (isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className || ''}`}>
        {children}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {children}
    </Link>
  )
}

function FeaturedWorkCard({ item, index }) {
  const tone = getTone(item.type)
  const typeMeta = getWorkTypeMeta(item.type)

  return (
    <article className={`group overflow-hidden border transition duration-200 hover:-translate-y-1 ${tone.card}`}>
      <WorkPreviewMark type={item.type} index={index} />
      <div className="flex min-h-[300px] flex-col p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${tone.chip}`}>
            {typeMeta?.title || item.type}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#858779] dark:text-gray-500">
            {getWorkStatusLabel(item.status)}
          </span>
        </div>

        <h2 className="mb-0 border-0 p-0 text-[24px] font-semibold leading-tight text-[#15140f] dark:text-gray-100">
          <WorkLink
            item={item}
            className="text-[#15140f] no-underline transition visited:text-[#15140f] hover:text-[#8b5a1f] dark:text-gray-100 dark:visited:text-gray-100 dark:hover:text-[#d4bd87]"
          >
            {item.title}
          </WorkLink>
        </h2>
        <p className="mb-0 mt-2 text-[13px] leading-6 text-[#767869] dark:text-gray-500">{item.role}</p>
        <p className="mb-0 mt-4 line-clamp-5 text-[14px] leading-7 text-[#51514a] dark:text-gray-400">
          {item.summary}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {item.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className={`inline-flex border px-2 py-1 text-[11px] leading-none ${tone.chip}`}>
              {tag}
            </span>
          ))}
        </div>

        <WorkLink
          item={item}
          className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[13px] font-semibold text-[#8b5a1f] no-underline transition visited:text-[#8b5a1f] group-hover:gap-2 dark:text-[#d4bd87] dark:visited:text-[#d4bd87]"
        >
          {isExternalHref(item.href) ? '访问项目' : '打开页面'}
          <ArrowIcon />
        </WorkLink>
      </div>
    </article>
  )
}

function WorkCard({ item, index }) {
  const tone = getTone(item.type)
  const typeMeta = getWorkTypeMeta(item.type)

  return (
    <article className={`group grid min-h-[250px] overflow-hidden border transition hover:-translate-y-0.5 ${tone.card}`}>
      <WorkPreviewMark type={item.type} index={index} />
      <div className="flex flex-col p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] ${tone.chip}`}>
            {typeMeta?.label || tone.label}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#858779] dark:text-gray-500">
            {getWorkStatusLabel(item.status)}
          </span>
          {item.canvasId ? <CanvasOriginBadge canvasId={item.canvasId} href={item.href} size="sm" /> : null}
        </div>

        <h3 className="mb-0 line-clamp-2 text-[18px] font-semibold leading-snug text-[#15140f] dark:text-gray-100">
          <WorkLink
            item={item}
            className="text-[#15140f] no-underline transition visited:text-[#15140f] hover:text-[#8b5a1f] dark:text-gray-100 dark:visited:text-gray-100 dark:hover:text-[#d4bd87]"
          >
            {item.title}
          </WorkLink>
        </h3>
        <p className="mb-0 mt-1 text-[12px] leading-5 text-[#767869] dark:text-gray-500">{item.role}</p>
        <p className="mb-0 mt-3 line-clamp-3 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
          {item.summary}
        </p>

        <WorkLink
          item={item}
          className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[12px] font-semibold text-[#8b5a1f] no-underline transition visited:text-[#8b5a1f] group-hover:gap-2 dark:text-[#d4bd87] dark:visited:text-[#d4bd87]"
        >
          {isExternalHref(item.href) ? '访问' : '打开'}
          <ArrowIcon />
        </WorkLink>
      </div>
    </article>
  )
}

function TypeShortcut({ section }) {
  const tone = getTone(section.id)

  return (
    <Link
      href={`#${section.id}`}
      className="group flex min-h-[110px] flex-col justify-between border border-[#d8d9cf] bg-white/45 p-3 text-[#171611] no-underline transition visited:text-[#171611] hover:-translate-y-0.5 hover:border-[#b7baa8] hover:bg-white/72 dark:border-gray-800 dark:bg-[#101720] dark:text-gray-100 dark:visited:text-gray-100 dark:hover:border-gray-700 dark:hover:bg-[#151c25]"
    >
      <span className="flex items-center justify-between gap-2">
        <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${tone.accent}`}>{getTone(section.id).label}</span>
        <span className="font-mono text-[11px] text-[#8d9083] dark:text-gray-500">{section.items.length}</span>
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

export default function WorksPage() {
  const featuredItems = FEATURED_WORK_ITEM_IDS.map((id) => WORK_ITEMS.find((item) => item.id === id)).filter(Boolean)
  const sections = WORK_TYPE_META.map((type) => ({
    ...type,
    items: getWorkItemsByType(type.id),
  })).filter((section) => section.items.length > 0)
  const productCount = getWorkItemsByType('product').length
  const aiCount = getWorkItemsByType('ai-engineering').length

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="border-b border-[#dee0db] pb-8 dark:border-gray-800">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div>
            <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.24em] text-[#767869] dark:text-[#8e9ab0]">
              Works / Products / AI Systems
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-[34px] font-semibold leading-tight text-[#15140f] dark:text-gray-100 sm:text-[48px]">
              把写作、工程和 AI 做成可运行的系统
            </h1>
            <p className="mb-0 mt-4 max-w-3xl text-[15px] leading-8 text-[#444740] dark:text-gray-300">
              这里不是文章目录，而是我正在运营、打磨和验证的作品展厅：产品站点、AI 工程实验、内容系统、研究页面和工具原型会放在同一张项目图里。
            </p>
            <blockquote className="mb-0 mt-5 border-l-2 border-[#8b5a1f] pl-4 text-[14px] leading-7 text-[#67695d] italic dark:border-[#d4bd87] dark:text-gray-400">
              {WORK_STRATEGY_PARAGRAPHS[0]}
            </blockquote>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="#product"
                className="inline-flex min-h-10 items-center border border-[#15140f] bg-[#15140f] px-4 text-[13px] font-semibold text-[#faf8f1] no-underline visited:text-[#faf8f1] hover:bg-[#2f2b22] dark:border-gray-100 dark:bg-gray-100 dark:text-[#111820] dark:visited:text-[#111820]"
              >
                看产品主线
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-l-0 border-[#dee0db] text-[12px] leading-6 text-[#67695d] dark:border-gray-800 dark:text-gray-500 lg:border-l lg:pl-5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="border border-[#d8d9cf] bg-white/45 px-2 py-3 dark:border-gray-800 dark:bg-[#101720]">
                <span className="block font-mono text-[18px] text-[#15140f] dark:text-gray-100">{WORK_ITEMS.length}</span>
                <span className="mt-1 block text-[11px]">项目</span>
              </div>
              <div className="border border-[#d8d9cf] bg-white/45 px-2 py-3 dark:border-gray-800 dark:bg-[#101720]">
                <span className="block font-mono text-[18px] text-[#15140f] dark:text-gray-100">{productCount}</span>
                <span className="mt-1 block text-[11px]">产品</span>
              </div>
              <div className="border border-[#d8d9cf] bg-white/45 px-2 py-3 dark:border-gray-800 dark:bg-[#101720]">
                <span className="block font-mono text-[18px] text-[#15140f] dark:text-gray-100">{aiCount}</span>
                <span className="mt-1 block text-[11px]">AI 工程</span>
              </div>
            </div>
            <SharePageButton
              title="涂阿燃 · 作品与项目"
              text="产品站点、AI 工程实验、内容系统、研究页面与工具作品"
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
              Operating Spine
            </p>
            <h2 id="featured-works" className="mb-0 border-0 p-0 text-[23px] font-semibold text-[#15140f] dark:text-gray-100">
              先看三条产品主线
            </h2>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#67695d] no-underline transition visited:text-[#67695d] hover:text-[#8b5a1f] dark:text-gray-400 dark:visited:text-gray-400 dark:hover:text-[#d4bd87]"
          >
            看合作方式
            <ArrowIcon />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {featuredItems.map((item, index) => (
            <FeaturedWorkCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </section>

      <nav aria-label="作品类型" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {sections.map((section) => (
          <TypeShortcut key={section.id} section={section} />
        ))}
      </nav>

      <section className="mt-12 space-y-12">
        {sections.map((section, sectionIndex) => (
          <section key={section.id} id={section.id} className="scroll-mt-24 border-t border-[#dee0db] pt-6 dark:border-gray-800">
            <div className="mb-5 grid gap-3 md:grid-cols-[220px_1fr] md:items-end">
              <div>
                <p className={`mb-1 font-mono text-[10px] uppercase tracking-[0.18em] ${getTone(section.id).accent}`}>
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
              {section.items.map((item, index) => (
                <WorkCard key={item.id} item={item} index={index + sectionIndex} />
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="mt-12 border-t border-[#dee0db] pt-10 dark:border-gray-800">
        <div className="mb-8">
          <h2 className="mb-0 border-0 p-0 text-[20px] font-semibold text-[#15140f] dark:text-gray-100">
            站内工具
          </h2>
          <p className="mb-0 mt-1 text-[13px] leading-6 text-[#67695d] dark:text-gray-500">
            自用的小工具集合。
          </p>
        </div>
        <SiteToolsPanel />
      </section>

      <footer className="mt-12 grid gap-4 border-t border-[#dee0db] pt-6 text-[12px] leading-6 text-[#67695d] dark:border-gray-800 dark:text-gray-500 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="mb-0">
            研究型富页面仍保留在这里，但降为作品矩阵的一类；普通文章、调研和资料索引仍在{' '}
            <Link href="/articles" className="text-[#8b5a1f] underline underline-offset-2 visited:text-[#8b5a1f] dark:text-[#d4bd87] dark:visited:text-[#d4bd87]">
              /articles
            </Link>
            。
          </p>
          <p className="mb-0 mt-2">
            若条目带 <CanvasOriginBadge canvasId="cloudflare-personal-site-map" size="sm" className="mx-1 align-middle" />{' '}
            标签，表示先在 Cursor Canvas 里完成交互原型，再落地为站内工程页。
          </p>
        </div>
        <Link
          href="#featured-works"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#8b5a1f] no-underline visited:text-[#8b5a1f] dark:text-[#d4bd87] dark:visited:text-[#d4bd87]"
        >
          回到产品主线
          <ArrowIcon />
        </Link>
      </footer>
    </main>
  )
}
