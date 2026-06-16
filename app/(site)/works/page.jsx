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
    accent: '#8B4513',
    accentLight: '#A0522D',
    accentBg: '#FDF8F3',
    accentBg2: '#F5EDE3',
    accentSoft: '#E8D5C0',
    dark: { accent: '#D4A574', accentLight: '#E0C09E', accentBg: '#1A1410', accentBg2: '#1F1A15', accentSoft: '#2A221A' },
  },
  'ai-engineering': {
    accent: '#1E6FA0',
    accentLight: '#2B8BC0',
    accentBg: '#F4F8FB',
    accentBg2: '#E8F1F7',
    accentSoft: '#C5D8E8',
    dark: { accent: '#7BB8D8', accentLight: '#96CCE8', accentBg: '#10161C', accentBg2: '#151C24', accentSoft: '#1A2430' },
  },
  'content-system': {
    accent: '#2D7A4F',
    accentLight: '#3A9860',
    accentBg: '#F2F8F4',
    accentBg2: '#E6F2EA',
    accentSoft: '#C0DDC8',
    dark: { accent: '#6DBF88', accentLight: '#8AD0A0', accentBg: '#101A15', accentBg2: '#15201A', accentSoft: '#1A2820' },
  },
  'research-page': {
    accent: '#6B4BBA',
    accentLight: '#8466D4',
    accentBg: '#F6F4FC',
    accentBg2: '#EDE8F8',
    accentSoft: '#D5CCEE',
    dark: { accent: '#B09AE8', accentLight: '#C4B4F0', accentBg: '#14131E', accentBg2: '#1A1826', accentSoft: '#222030' },
  },
  'tool-experiment': {
    accent: '#B8860B',
    accentLight: '#D4A520',
    accentBg: '#FCFAF4',
    accentBg2: '#F7F3E6',
    accentSoft: '#E8DDC0',
    dark: { accent: '#D4BD87', accentLight: '#E0CDA0', accentBg: '#1A1710', accentBg2: '#1F1C15', accentSoft: '#28241A' },
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

function DiagonalLines({ color, count = 3, className = '' }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-px w-16 origin-right"
          style={{
            backgroundColor: color,
            opacity: 0.15 - i * 0.03,
            transform: `rotate(${-15 + i * 5}deg)`,
            marginBottom: 4 + i * 3,
          }}
        />
      ))}
    </div>
  )
}

function CircleDeco({ color, size = 120, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: color, opacity: 0.06 }}
    />
  )
}

// ============================================================
// L1：精选 Hero 区 —— 主 Hero 渐变背景
// ============================================================

function MainHero({ item }) {
  const tone = getTone(item.type)
  const typeMeta = getWorkTypeMeta(item.type)

  return (
    <article className="relative overflow-hidden border-b border-[#E8E4DB] dark:border-[#252218]">
      {/* 渐变背景 */}      
      <div
        className="absolute inset-0 opacity-40 dark:opacity-25"
        style={{
          background: `linear-gradient(135deg, ${tone.accentBg2} 0%, transparent 60%)`,
        }}
      />
      <div className="relative flex flex-col gap-8 px-0 py-12 sm:flex-row sm:items-start sm:py-16">
        {/* 超大装饰数字 */}
        <div className="relative shrink-0 hidden sm:block">
          <span
            className="block font-serif text-[180px] font-bold leading-none tracking-[-0.05em]"
            style={{ color: `${tone.accent}08` }}
          >
            01
          </span>
        </div>

        <div className="min-w-0 flex-1 pt-1 sm:pt-6">
          {/* 类型标签 */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide"
              style={{ backgroundColor: `${tone.accent}15`, color: tone.accent }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.accent }} />
              {typeMeta?.title}
            </span>
            <span className="text-[11px] font-medium text-[#9A9B90] dark:text-gray-500">
              {getWorkStatusLabel(item.status)}
            </span>
          </div>

          {/* 标题 */}
          <h2 className="mb-0 border-0 p-0 font-serif text-[38px] font-bold leading-[1.1] tracking-[-0.015em] text-[#15140f] dark:text-gray-100 sm:text-[48px]">
            <a href={item.href} target={isExternalHref(item.href) ? '_blank' : undefined} rel={isExternalHref(item.href) ? 'noreferrer' : undefined} className="text-[#15140f] no-underline hover:opacity-75 dark:text-gray-100">
              {item.title}
            </a>
          </h2>

          {/* 描述 */}
          <p className="mb-0 mt-5 max-w-2xl text-[16px] leading-[1.75] text-[#5E5F55] dark:text-gray-400">
            {item.summary}
          </p>

          {/* Tags + CTA */}
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <div className="flex flex-wrap gap-2">
              {item.tags?.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-md border px-2.5 py-1 text-[11px] font-medium tracking-wide"
                  style={{ borderColor: `${tone.accent}20`, color: tone.accent, backgroundColor: `${tone.accent}06` }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <a
              href={item.href}
              target={isExternalHref(item.href) ? '_blank' : undefined}
              rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#15140f] no-underline transition hover:gap-3 dark:text-gray-200"
            >
              {isExternalHref(item.href) ? '访问项目' : '打开页面'}
              <ArrowIcon />
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

// 次 Hero：卡片式，微妙的底色
function SubHeroCard({ item, index }) {
  const tone = getTone(item.type)
  const typeMeta = getWorkTypeMeta(item.type)

  return (
    <article
      className="group relative overflow-hidden rounded-none border border-[#E8E4DB] p-6 transition hover:border-[#D0CCC0] dark:border-[#2A2820] dark:hover:border-[#3A3830]"
      style={{ backgroundColor: tone.accentBg }}
    >
      {/* 左上角序号 */}
      <span className="absolute right-4 top-4 font-mono text-[10px] tracking-[0.15em] text-[#C0BDB0] dark:text-gray-700">
        {String(index + 2).padStart(2, '0')}
      </span>

      {/* 顶部色条 */}
      <div className="mb-5 h-1 w-10" style={{ backgroundColor: tone.accent, opacity: 0.6 }} />

      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: tone.accent }}>
          {typeMeta?.title}
        </span>
        <span className="text-[11px] text-[#B0AE9E] dark:text-gray-600">·</span>
        <span className="text-[11px] text-[#9A9B90] dark:text-gray-500">{getWorkStatusLabel(item.status)}</span>
      </div>

      <h3 className="mb-0 border-0 p-0 font-serif text-[22px] font-semibold leading-snug text-[#15140f] dark:text-gray-100">
        <a
          href={item.href}
          target={isExternalHref(item.href) ? '_blank' : undefined}
          rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
          className="text-[#15140f] no-underline hover:opacity-70 dark:text-gray-100"
        >
          {item.title}
        </a>
      </h3>

      <p className="mb-0 mt-2 text-[13px] leading-relaxed text-[#6E6F64] dark:text-gray-500">{item.role}</p>
      <p className="mb-0 mt-3 line-clamp-3 text-[13px] leading-relaxed text-[#51514a] dark:text-gray-400">
        {item.summary}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {item.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded px-1.5 py-0.5 text-[10px] tracking-wide"
              style={{ backgroundColor: `${tone.accent}0D`, color: tone.accent }}
            >
              {tag}
            </span>
          ))}
        </div>
        <a
          href={item.href}
          target={isExternalHref(item.href) ? '_blank' : undefined}
          rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
          className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-[#6E6F64] no-underline transition-colors hover:text-[#15140f] dark:text-gray-500 dark:hover:text-gray-200"
        >
          {isExternalHref(item.href) ? '访问' : '打开'}
          <ArrowIcon className="h-3 w-3" />
        </a>
      </div>
    </article>
  )
}

// ============================================================
// L2：类型导航 —— 药丸标签
// ============================================================

function TypeNav({ sections }) {
  return (
    <nav aria-label="作品类型" className="flex flex-wrap items-center gap-2">
      {sections.map((section, i) => {
        const tone = getTone(section.id)
        return (
          <Link
            key={section.id}
            href={`#${section.id}`}
            className="group inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] no-underline transition-all"
            style={{
              borderColor: 'transparent',
              backgroundColor: tone.accentBg,
              color: '#51514a',
            }}
          >
            <span className="font-semibold tracking-wide" style={{ color: tone.accent }}>
              {section.title}
            </span>
            <span className="ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tracking-tight" style={{ backgroundColor: `${tone.accent}12`, color: tone.accent }}>
              {section.items.length}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

// ============================================================
// L3：作品列表 —— 多样化行
// ============================================================

function HighlightRowNumbered({ item, index, tone, typeMeta }) {
  return (
    <article className="group grid gap-4 border-b py-5 sm:grid-cols-[60px_1fr_auto]" style={{ borderColor: `${tone.accent}12` }}>
      {/* 装饰序号 */}
      <div className="hidden pt-1 sm:block">
        <span
          className="font-serif text-[40px] font-bold leading-none tracking-[-0.03em]"
          style={{ color: `${tone.accent}25` }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide" style={{ backgroundColor: `${tone.accent}12`, color: tone.accent }}>
            {typeMeta?.title}
          </span>
          <span className="text-[11px] text-[#B0AE9E] dark:text-gray-600">
            {getWorkStatusLabel(item.status)}
          </span>
          {item.canvasId ? <CanvasOriginBadge canvasId={item.canvasId} href={item.href} size="sm" /> : null}
        </div>

        <h3 className="mb-0 inline border-0 p-0 font-serif text-[20px] font-semibold leading-snug text-[#15140f] dark:text-gray-100">
          <a
            href={item.href}
            target={isExternalHref(item.href) ? '_blank' : undefined}
            rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
            className="text-[#15140f] no-underline hover:opacity-70 dark:text-gray-100"
          >
            {item.title}
          </a>
        </h3>
        <span className="ml-3 text-[13px] text-[#9A9B90] dark:text-gray-600">{item.role}</span>

        <p className="mb-0 mt-2 max-w-xl text-[13px] leading-relaxed text-[#5E5F55] dark:text-gray-400 line-clamp-2">
          {item.summary}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded px-1.5 py-0.5 text-[10px] tracking-wide"
              style={{ backgroundColor: `${tone.accent}0A`, color: tone.accent }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-start pt-1 sm:justify-end">
        <a
          href={item.href}
          target={isExternalHref(item.href) ? '_blank' : undefined}
          rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#6E6F64] no-underline transition-colors hover:text-[#15140f] dark:text-gray-500 dark:hover:text-gray-200"
        >
          {isExternalHref(item.href) ? '访问' : '打开'}
          <ArrowIcon className="h-3 w-3" />
        </a>
      </div>
    </article>
  )
}

function HighlightRowCompact({ item, tone, typeMeta }) {
  return (
    <article className="group border-b py-3 transition-colors hover:bg-[#FCFCFA] dark:hover:bg-[#151515]" style={{ borderColor: `${tone.accent}0C` }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide" style={{ backgroundColor: `${tone.accent}10`, color: tone.accent }}>
            {typeMeta?.title}
          </span>
          <span className="truncate text-[14px] font-medium text-[#15140f] dark:text-gray-100">
            <a
              href={item.href}
              target={isExternalHref(item.href) ? '_blank' : undefined}
              rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
              className="text-[#15140f] no-underline hover:opacity-70 dark:text-gray-100"
            >
              {item.title}
            </a>
          </span>
          <span className="truncate text-[13px] text-[#B0AE9E] dark:text-gray-600">{item.role}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-[11px] text-[#C8C6B4] dark:text-gray-700 sm:inline">
            {getWorkStatusLabel(item.status)}
          </span>
          <a
            href={item.href}
            target={isExternalHref(item.href) ? '_blank' : undefined}
            rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
            className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[#8E8F80] no-underline transition-colors hover:text-[#15140f] dark:text-gray-500 dark:hover:text-gray-200"
          >
            {isExternalHref(item.href) ? '访问' : '打开'} <ArrowIcon className="h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  )
}

function CompactRow({ item, tone }) {
  const typeMeta = getWorkTypeMeta(item.type)
  return (
    <div className="group flex items-center gap-2 py-2 text-[13px] transition-colors hover:bg-[#FCFCFA] dark:hover:bg-[#151515]">
      <span className="hidden shrink-0 rounded px-1 py-0 text-[9px] font-semibold tracking-wider sm:inline" style={{ backgroundColor: `${tone.accent}0A`, color: tone.accent }}>
        {typeMeta?.title}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-medium text-[#5E5F55] dark:text-gray-400">
          <a
            href={item.href}
            target={isExternalHref(item.href) ? '_blank' : undefined}
            rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
            className="text-[#5E5F55] no-underline hover:text-[#15140f] dark:text-gray-400 dark:hover:text-gray-200"
          >
            {item.title}
          </a>
        </span>
        <span className="hidden truncate text-[11px] text-[#C8C6B4] dark:text-gray-700 sm:inline">— {item.role}</span>
      </div>
      <a
        href={item.href}
        target={isExternalHref(item.href) ? '_blank' : undefined}
        rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
        className="shrink-0 text-[11px] font-medium text-[#B0AE9E] no-underline transition-colors hover:text-[#15140f] dark:text-gray-600 dark:hover:text-gray-300"
      >
        {isExternalHref(item.href) ? '访问' : '打开'} ↗
      </a>
    </div>
  )
}

// ============================================================
// 分区组件 —— 每个类型用不同的底色和装饰
// ============================================================

const HIGH_PRIORITY = 85

// 分区头的5种视觉变体
function SectionHeader_v1({ section, sectionIndex, tone }) {
  // Product：左对齐大标题 + 下划线 + 右边描述
  const num = String(sectionIndex + 1).padStart(2, '0')
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: tone.accent }}>
          {num} · {section.titleEn}
        </span>
        <h2 className="mb-0 mt-2 border-0 p-0 font-serif text-[28px] font-bold leading-tight text-[#15140f] dark:text-gray-100">
          {section.title}
        </h2>
        <div className="mt-3 h-0.5 w-16" style={{ backgroundColor: tone.accent, opacity: 0.6 }} />
      </div>
      <p className="mb-0 max-w-xs text-[13px] leading-relaxed text-[#9A9B90] dark:text-gray-500">
        {section.description}
      </p>
    </div>
  )
}

function SectionHeader_v2({ section, sectionIndex, tone }) {
  // AI Engineering：垂直装饰块 + 标题并排
  const num = String(sectionIndex + 1).padStart(2, '0')
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row">
      {/* 左侧色块 */}
      <div className="flex shrink-0 gap-3 pt-0.5">
        <div className="h-16 w-1 rounded-full" style={{ backgroundColor: tone.accent, opacity: 0.5 }} />
        <span className="font-mono text-[13px] font-bold leading-tight tracking-[0.05em]" style={{ color: tone.accent }}>
          {num}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-[#C0BDB0] dark:text-gray-600">
            {section.titleEn}
          </span>
          <h2 className="mb-0 mt-2 border-0 p-0 font-serif text-[28px] font-bold leading-tight text-[#15140f] dark:text-gray-100">
            {section.title}
          </h2>
        </div>
        <p className="mb-0 max-w-xs text-[13px] leading-relaxed text-[#9A9B90] dark:text-gray-500">
          {section.description}
        </p>
      </div>
    </div>
  )
}

function SectionHeader_v3({ section, sectionIndex, tone }) {
  // Content System：号码在标题上方 + 细线分隔
  const num = String(sectionIndex + 1).padStart(2, '0')
  return (
    <div className="mb-10">
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-[64px] font-bold leading-none tracking-[-0.03em]" style={{ color: `${tone.accent}15` }}>
          {num}
        </span>
        <div>
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: tone.accent }}>
            {section.titleEn}
          </span>
          <h2 className="mb-0 mt-1 border-0 p-0 font-serif text-[28px] font-bold leading-tight text-[#15140f] dark:text-gray-100">
            {section.title}
          </h2>
        </div>
      </div>
      <div className="mt-6 border-t pt-3" style={{ borderColor: `${tone.accent}18` }}>
        <p className="mb-0 max-w-md text-[13px] leading-relaxed text-[#9A9B90] dark:text-gray-500">
          {section.description}
        </p>
      </div>
    </div>
  )
}

function SectionHeader_v4({ section, sectionIndex, tone }) {
  // Research：居中 + 装饰圆 + 描述在下方
  const num = String(sectionIndex + 1).padStart(2, '0')
  return (
    <div className="mb-10 text-center">
      <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: tone.accent }}>
        {num} · {section.titleEn}
      </span>
      <div className="relative mx-auto my-4 flex items-center justify-center gap-4">
        <div className="h-px flex-1" style={{ backgroundColor: `${tone.accent}15` }} />
        <div className="flex h-3 w-3 shrink-0 rotate-45" style={{ backgroundColor: tone.accent, opacity: 0.35 }} />
        <h2 className="mb-0 shrink-0 border-0 p-0 font-serif text-[28px] font-bold leading-tight text-[#15140f] dark:text-gray-100">
          {section.title}
        </h2>
        <div className="flex h-3 w-3 shrink-0 rotate-45" style={{ backgroundColor: tone.accent, opacity: 0.35 }} />
        <div className="h-px flex-1" style={{ backgroundColor: `${tone.accent}15` }} />
      </div>
      <p className="mb-0 mx-auto max-w-sm text-[13px] leading-relaxed text-[#9A9B90] dark:text-gray-500">
        {section.description}
      </p>
    </div>
  )
}

function SectionHeader_v5({ section, sectionIndex, tone }) {
  // Tool：极简——一个小圆 + 标题在一行
  const num = String(sectionIndex + 1).padStart(2, '0')
  return (
    <div className="mb-10 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone.accent, opacity: 0.6 }} />
        <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: tone.accent }}>
          {num}
        </span>
      </div>
      <h2 className="mb-0 border-0 p-0 font-serif text-[28px] font-bold leading-tight text-[#15140f] dark:text-gray-100">
        {section.title}
      </h2>
      <span className="text-[11px] text-[#C8C6B4] dark:text-gray-700">— {section.titleEn}</span>
      <div className="ml-auto max-w-[200px]">
        <p className="mb-0 text-right text-[13px] leading-relaxed text-[#9A9B90] dark:text-gray-500">
          {section.description}
        </p>
      </div>
    </div>
  )
}

const SECTION_HEADERS = [SectionHeader_v1, SectionHeader_v2, SectionHeader_v3, SectionHeader_v4, SectionHeader_v5]

function WorkSection({ section, sectionIndex }) {
  const tone = getTone(section.id)
  const sortedItems = [...section.items].sort((a, b) => (b.priority || 0) - (a.priority || 0))
  const highItems = sortedItems.filter((item) => (item.priority || 0) >= HIGH_PRIORITY)
  const compactItems = sortedItems.filter((item) => (item.priority || 0) < HIGH_PRIORITY)
  const Header = SECTION_HEADERS[sectionIndex] || SectionHeader_v1

  return (
    <section
      id={section.id}
      className="relative scroll-mt-28 px-4 py-10 sm:px-6 sm:py-14"
      style={{ backgroundColor: tone.accentBg }}
    >
      {/* 装饰圆 */}
      {sectionIndex % 2 === 0 && (
        <CircleDeco color={tone.accent} size={200} className="-left-10 top-10" />
      )}
      {sectionIndex % 2 === 1 && (
        <CircleDeco color={tone.accent} size={160} className="-right-8 bottom-8" />
      )}

      {/* 对角线装饰 */}
      {sectionIndex === 2 && (
        <DiagonalLines color={tone.accent} count={4} className="absolute right-8 top-16" />
      )}

      <div className="relative mx-auto max-w-5xl">
        <Header section={section} sectionIndex={sectionIndex} tone={tone} />

        {/* 高优先级 */}
        {highItems.length > 0 && (
          <div style={{ borderColor: `${tone.accent}10` }}>
            {highItems.map((item, i) => (
              <HighlightRowNumbered
                key={item.id}
                item={item}
                index={i}
                tone={tone}
                typeMeta={getWorkTypeMeta(item.type)}
              />
            ))}
          </div>
        )}

        {/* 中 / 低优先级 */}
        {compactItems.length > 0 && (
          <div className="mt-3">
            {highItems.length > 0 && (
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1" style={{ backgroundColor: `${tone.accent}15` }} />
                <span className="text-[11px] tracking-wide" style={{ color: `${tone.accent}60` }}>
                  更多
                </span>
                <div className="h-px flex-1" style={{ backgroundColor: `${tone.accent}15` }} />
              </div>
            )}

            {/* 中优先级 */}
            <div>
              {compactItems
                .filter((item) => (item.priority || 0) >= 75)
                .map((item) => (
                  <HighlightRowCompact key={item.id} item={item} tone={tone} typeMeta={getWorkTypeMeta(item.type)} />
                ))}
            </div>

            {/* 低优先级：极简网格 */}
            {compactItems.filter((item) => (item.priority || 0) < 75).length > 0 && (
              <div className="mt-3 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                {compactItems
                  .filter((item) => (item.priority || 0) < 75)
                  .map((item) => (
                    <CompactRow key={item.id} item={item} tone={tone} />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ============================================================
// 主页面
// ============================================================

export default function WorksPage() {
  const featuredItems = FEATURED_WORK_ITEM_IDS.map((id) => WORK_ITEMS.find((item) => item.id === id)).filter(Boolean)
  const heroItem = featuredItems[0]
  const subHeroItems = featuredItems.slice(1)
  const sections = WORK_TYPE_META.map((type) => ({
    ...type,
    items: getWorkItemsByType(type.id),
  })).filter((s) => s.items.length > 0)

  const typeCounts = {}
  WORK_TYPE_META.forEach((t) => { typeCounts[t.id] = getWorkItemsByType(t.id).length })

  return (
    <main className="mx-auto w-full max-w-7xl">
      {/* ===== Header ===== */}
      <header className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="grid gap-10 border-b pb-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end" style={{ borderColor: '#E8E4DB' }}>
          <div>
            <p className="mb-0 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#B0AE9E] dark:text-gray-600">
              Works · Products · AI Systems
            </p>
            <h1 className="mt-5 max-w-2xl font-serif text-[40px] font-bold leading-[1.1] tracking-[-0.015em] text-[#15140f] dark:text-gray-100 sm:text-[54px]">
              把写作、工程和 AI
              <br className="hidden sm:block" />
              做成可运行的系统
            </h1>
            <p className="mb-0 mt-5 max-w-xl text-[16px] leading-[1.7] text-[#5E5F55] dark:text-gray-400">
              这里不是文章目录，而是我正在运营、打磨和验证的作品展厅——产品站点、AI 工程实验、内容系统、研究页面和工具原型。
            </p>
            <blockquote className="mb-0 mt-6 border-l-2 pl-5 text-[14px] leading-[1.7] text-[#8E8F80] italic dark:text-gray-500" style={{ borderColor: TYPE_TONE.product.accent }}>
              {WORK_STRATEGY_PARAGRAPHS[0]}
            </blockquote>
            <div className="mt-7">
              <Link
                href="#featured-works"
                className="inline-flex min-h-[44px] items-center gap-2 bg-[#15140f] px-6 text-[14px] font-semibold text-[#FAF8F1] no-underline transition-colors hover:bg-[#2F2B22] dark:bg-gray-100 dark:text-[#111820] dark:hover:bg-gray-200"
              >
                看产品主线
                <ArrowIcon className="h-3.5 w-3.5 text-[#FAF8F1] dark:text-[#111820]" />
              </Link>
            </div>
          </div>

          {/* 统计 */}
          <div className="flex flex-col gap-6 lg:items-end">
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-[72px] font-bold leading-none tracking-[-0.03em] text-[#15140f] dark:text-gray-100">
                  {WORK_ITEMS.length}
                </span>
                <span className="text-[13px] text-[#B0AE9E] dark:text-gray-600">个项目</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[#6E6F64] dark:text-gray-500">
                {WORK_TYPE_META.map((t) => {
                  const tone = getTone(t.id)
                  return (
                    <span key={t.id} className="inline-flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.accent, opacity: 0.6 }} />
                      <span className="font-semibold" style={{ color: tone.accent }}>{typeCounts[t.id]}</span>
                      {' '}{t.title}
                    </span>
                  )
                })}
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

      {/* ===== L1: 精选 Hero ===== */}
      <section id="featured-works" className="scroll-mt-28" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-5xl px-4 pt-16 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#B0AE9E] dark:text-gray-600">
                Operating Spine
              </p>
              <h2 id="featured-heading" className="mb-0 border-0 p-0 font-serif text-[26px] font-bold text-[#15140f] dark:text-gray-100">
                三条产品主线
              </h2>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6E6F64] no-underline transition-colors hover:text-[#15140f] dark:text-gray-500 dark:hover:text-gray-200"
            >
              合作方式
              <ArrowIcon />
            </Link>
          </div>
        </div>

        {/* 主 Hero */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {heroItem && <MainHero item={heroItem} />}
        </div>

        {/* 次 Hero 双列 */}
        {subHeroItems.length > 0 && (
          <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
            <div className="grid gap-8 sm:grid-cols-2">
              {subHeroItems.map((item, i) => (
                <SubHeroCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== L2: 类型导航 ===== */}
      <div className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
        <TypeNav sections={sections} />
      </div>

      {/* ===== L3: 作品分区 —— 交替底色 ===== */}
      <div className="mt-12">
        {sections.map((section, i) => (
          <WorkSection key={section.id} section={section} sectionIndex={i} />
        ))}
      </div>

      {/* ===== L4: 底部 ===== */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="mb-6">
          <h2 className="mb-0 border-0 p-0 text-[20px] font-bold text-[#15140f] dark:text-gray-100">
            站内工具
          </h2>
          <p className="mb-0 mt-1 text-[13px] leading-relaxed text-[#8E8F80] dark:text-gray-500">
            自用的小工具集合。
          </p>
        </div>
        <SiteToolsPanel />
      </section>

      <footer className="mx-auto max-w-5xl border-t px-4 py-8 sm:px-6" style={{ borderColor: '#E8E4DB' }}>
        <div className="grid gap-4 text-[13px] leading-relaxed text-[#8E8F80] dark:text-gray-500 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <p className="mb-0">
              研究型富页面仍保留在这里，但降为作品矩阵的一类；普通文章在{' '}
              <Link href="/articles" className="font-semibold no-underline transition-colors hover:opacity-70" style={{ color: TYPE_TONE.product.accent }}>
                /articles
              </Link>。
            </p>
            <p className="mb-0 mt-2">
              若条目带 <CanvasOriginBadge canvasId="cloudflare-personal-site-map" size="sm" className="mx-1 align-middle" />{' '}
              标签，表示先在 Cursor Canvas 里完成交互原型，再落地为站内工程页。
            </p>
          </div>
          <Link
            href="#featured-works"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium no-underline transition-colors hover:opacity-70" style={{ color: TYPE_TONE.product.accent }}
          >
            回到产品主线
            <ArrowIcon />
          </Link>
        </div>
      </footer>
    </main>
  )
}
