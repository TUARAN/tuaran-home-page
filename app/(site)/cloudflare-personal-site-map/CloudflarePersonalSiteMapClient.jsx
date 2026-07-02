'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import SharePageButton from '../components/SharePageButton'
import CanvasOriginBadge from '../components/CanvasOriginBadge'

import {
  AI_PRODUCTS,
  CORE_STACK,
  DIMENSION_SCORES,
  MARKET_DESIGN,
  MARKET_ENTRY,
  MIN_STACK,
  OPS_FLYWHEEL,
  OPS_METRICS,
  PLATFORM_PRODUCTS,
  PRICING_MODELS,
  RECENT_UPDATES,
  RELATED_LINKS,
  RUNTIME_SURFACES,
  SECURITY_LAYERS,
  SHARE_COPY,
  SITE_FACTS,
  SKIP_STACK,
  STORAGE_COMPARE,
  STORAGE_PRODUCTS,
  TECH_ARCH_LAYERS,
  TRIGGER_RULES,
  VERDICT_COUNTS,
  VERDICT_FILTERS,
  VERDICT_META,
  WORKER_BUNDLE_METRICS,
} from './data'

const SHARE_URL = 'https://2aran.com/cloudflare-personal-site-map'

const SECTIONS = [
  { id: 'overview', label: '概览' },
  { id: 'runtime', label: '运行时边界' },
  { id: 'arch', label: '技术架构' },
  { id: 'security', label: '安全防御' },
  { id: 'ops', label: '运营飞轮' },
  { id: 'market', label: '市场设计' },
  { id: 'cloudflare', label: 'Cloudflare 对照' },
  { id: 'stack', label: '最小栈' },
]

function VerdictPill({ verdict, active = false, onClick }) {
  const meta = VERDICT_META[verdict]
  const toneClass = {
    success:
      'bg-[#e5ece4] text-[#374d34] dark:bg-[#1a2e18] dark:text-[#a3c2a0]',
    info: 'bg-[#e4ebf5] text-[#334d73] dark:bg-[#1a2438] dark:text-[#9db8e8]',
    warning:
      'bg-[#e2e4d8] text-[#7a5a1a] dark:bg-[#202018] dark:text-[#a1ab76]',
    neutral:
      'bg-[#e2e4dc] text-[#51514a] dark:bg-[#1c1d1b] dark:text-[#9c9c96]',
  }[meta.tone]

  const base = `inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${toneClass}`
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} transition ${active ? 'ring-2 ring-[#8b5a1f] ring-offset-1 dark:ring-[#a1ab76] dark:ring-offset-gray-950' : 'opacity-80 hover:opacity-100'}`}
      >
        {meta.label}
      </button>
    )
  }
  return <span className={base}>{meta.label}</span>
}

function ArchitectureDiagram() {
  return (
    <figure className="overflow-hidden rounded-md border border-[#dee0db] bg-white text-center dark:border-gray-800 dark:bg-gray-900">
      <svg
        viewBox="0 0 760 300"
        role="img"
        aria-label="2aran.com 在 Cloudflare 上的数据流"
        className="mx-auto block h-auto w-full max-w-[780px]"
      >
        <text x="0" y="16" className="fill-[#63655f] dark:fill-gray-500" fontSize="11">
          架构快照 · tuaran-home-page · 2026-07
        </text>
        <rect x="20" y="40" width="120" height="56" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1.2" />
        <text x="80" y="68" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">访客</text>
        <text x="80" y="84" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">浏览器</text>
        <rect x="180" y="40" width="140" height="56" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1.2" />
        <text x="250" y="68" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">Cloudflare CDN</text>
        <text x="250" y="84" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">Pages 边缘 · Middleware</text>
        <rect x="360" y="28" width="160" height="80" rx="6" className="fill-[#4a6fa5] stroke-[#3d5f8f] dark:fill-[#5b7fb8] dark:stroke-[#4a6fa5]" strokeWidth="1.5" />
        <text x="440" y="58" textAnchor="middle" className="fill-white" fontSize="13" fontWeight="600">Public Pages Worker</text>
        <text x="440" y="78" textAnchor="middle" className="fill-white/85" fontSize="11">43 routes · public build</text>
        <rect x="560" y="40" width="160" height="56" rx="6" className="fill-[#e9ebe6] stroke-[#c3c5c0] dark:fill-[#1c1d1b] dark:stroke-[#373836]" strokeWidth="1.2" />
        <text x="640" y="68" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">D1 · DB</text>
        <text x="640" y="84" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">SQLite 边缘库</text>
        <rect x="180" y="130" width="140" height="56" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1.2" />
        <text x="250" y="158" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">Admin / API 拆分</text>
        <text x="250" y="174" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">admin.2aran.com · api 规划</text>
        <rect x="360" y="130" width="160" height="56" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1.2" />
        <text x="440" y="158" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">Resend</text>
        <text x="440" y="174" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">邮箱验证码</text>
        <rect x="560" y="130" width="160" height="56" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1.2" />
        <text x="640" y="158" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">GitHub OAuth</text>
        <text x="640" y="174" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">登录身份</text>
        <rect x="180" y="210" width="300" height="56" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1.2" />
        <text x="330" y="238" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">浏览器 WebGPU</text>
        <text x="330" y="254" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">/web-llm 本地推理</text>
        <rect x="520" y="210" width="200" height="56" rx="6" className="fill-[#e9ebe6] stroke-[#c3c5c0] dark:fill-[#1c1d1b] dark:stroke-[#373836]" strokeWidth="1.2" />
        <text x="620" y="238" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">R2 · MEDIA</text>
        <text x="620" y="254" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">downloads / feed 视频</text>
        <line x1="440" y1="186" x2="520" y2="238" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
        <line x1="140" y1="68" x2="180" y2="68" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" markerEnd="url(#cf-map-arrow)" />
        <line x1="320" y1="68" x2="360" y2="68" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
        <line x1="520" y1="68" x2="560" y2="68" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
        <line x1="250" y1="96" x2="250" y2="130" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
        <line x1="440" y1="108" x2="440" y2="130" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
        <line x1="440" y1="186" x2="440" y2="210" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
        <line x1="640" y1="96" x2="640" y2="130" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
        <defs>
          <marker id="cf-map-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" className="fill-[#b4b6b1] dark:fill-[#41423f]" />
          </marker>
        </defs>
      </svg>
      <figcaption className="border-t border-[#dee0db] px-3 py-2 text-[11px] text-[#63655f] dark:border-gray-800 dark:text-gray-400">
        访客请求先过边缘 Middleware（语言判断、域名/路径重定向），再由公开 Pages Worker 承接前台页面与少量 API；后台和后台 API 已准备拆到 admin.2aran.com，评论/通知/积分后续收敛到轻 API Worker；R2 承接 downloads/ 与 feed/ 大文件。
      </figcaption>
    </figure>
  )
}

function ProductTable({ headers, rows, emptyMessage }) {
  if (!rows.length) {
    return (
      <p className="rounded-md border border-dashed border-[#d0d2cd] px-4 py-8 text-center text-[13px] text-[#63655f] dark:border-gray-700 dark:text-gray-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-[#dee0d6] dark:border-gray-800">
            {headers.map((header) => (
              <th
                key={header}
                className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#767869] dark:text-gray-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-[#e4e6dc] transition hover:bg-[#eef0e8]/70 dark:border-gray-800/80 dark:hover:bg-gray-900/60"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-3 py-3 align-top text-[#262724] dark:text-gray-200"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function matchesVerdict(verdict, filter) {
  return filter === 'all' || verdict === filter
}

export default function CloudflarePersonalSiteMapClient() {
  const [verdictFilter, setVerdictFilter] = useState('all')
  const [platformOpen, setPlatformOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const verdict = params.get('verdict')
    const q = params.get('q')
    if (verdict && VERDICT_FILTERS.some((item) => item.id === verdict)) {
      setVerdictFilter(verdict)
    }
    if (q) setQuery(q)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams()
    if (verdictFilter !== 'all') params.set('verdict', verdictFilter)
    if (query.trim()) params.set('q', query.trim())
    const qs = params.toString()
    const next = qs ? `?${qs}` : window.location.pathname
    window.history.replaceState(null, '', next)
  }, [verdictFilter, query])

  const normalizedQuery = query.trim().toLowerCase()

  const filteredStorage = useMemo(
    () =>
      STORAGE_PRODUCTS.filter((row) => {
        if (!matchesVerdict(row.verdict, verdictFilter)) return false
        if (!normalizedQuery) return true
        return `${row.product}${row.type}${row.personalUse}`.toLowerCase().includes(normalizedQuery)
      }),
    [verdictFilter, normalizedQuery]
  )

  const filteredAi = useMemo(
    () =>
      AI_PRODUCTS.filter((row) => {
        if (!matchesVerdict(row.verdict, verdictFilter)) return false
        if (!normalizedQuery) return true
        return `${row.product}${row.role}${row.reason}`.toLowerCase().includes(normalizedQuery)
      }),
    [verdictFilter, normalizedQuery]
  )

  const filteredPlatform = useMemo(
    () =>
      PLATFORM_PRODUCTS.filter((row) => {
        if (!matchesVerdict(row.verdict, verdictFilter)) return false
        if (!normalizedQuery) return true
        return `${row.product}${row.role}${row.reason}`.toLowerCase().includes(normalizedQuery)
      }),
    [verdictFilter, normalizedQuery]
  )

  const visibleCount =
    CORE_STACK.filter((row) => matchesVerdict(row.verdict, verdictFilter)).length +
    filteredStorage.length +
    filteredAi.length +
    filteredPlatform.length

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:py-10">
      <header className="border-b border-[#dee0db] pb-6 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a5a14] dark:text-[#9ba475]">
            Engineering Work · Cloudflare 架构
          </span>
          <span className="rounded-full bg-[#e5ece4] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#374d34] dark:bg-[#1a2e18] dark:text-[#a3c2a0]">
            对照 2aran.com 实装
          </span>
          <CanvasOriginBadge canvasId="cloudflare-personal-site-map" size="sm" />
        </div>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-serif text-[24px] font-semibold leading-snug text-[#15140f] dark:text-gray-100 sm:text-[30px]">
              Cloudflare 个人站技术地图
            </h1>
            <p className="mt-3 text-[14px] leading-7 text-[#51514a] dark:text-gray-400">
              {SHARE_COPY.lead}
            </p>
          </div>
          <SharePageButton
            title={SHARE_COPY.title}
            text={SHARE_COPY.lead}
            fullText={SHARE_COPY.full}
            url={SHARE_URL}
            size="md"
          />
        </div>
      </header>

      <nav
        aria-label="页面章节"
        className="sticky top-0 z-10 mt-5 flex flex-wrap gap-x-3 gap-y-2 border-b border-[#dee0d6] bg-[#f7f8f5]/95 py-3 backdrop-blur dark:border-gray-800 dark:bg-[#111]/95"
      >
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="text-[12px] font-medium text-[#67695d] no-underline underline-offset-4 hover:text-[#8b5a1f] hover:underline dark:text-gray-400 dark:hover:text-[#a1ab76]"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <section id="overview" className="mt-8 scroll-mt-24">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DIMENSION_SCORES.map((dim) => (
            <a
              key={dim.id}
              href={`#${dim.id}`}
              className="rounded-md border border-[#dee0d6] bg-white px-4 py-4 text-left transition hover:bg-[#eef0e8]/60 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-900/80"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: dim.color }}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#767869] dark:text-gray-500">
                  {dim.label}
                </span>
              </div>
              <div className="mt-2 font-serif text-[28px] font-semibold tabular-nums text-[#15140f] dark:text-gray-100">
                {dim.score}
              </div>
              <div className="mt-1 text-[12px] text-[#51514a] dark:text-gray-400">{dim.summary}</div>
            </a>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {VERDICT_COUNTS.map((item) => (
            <button
              key={item.verdict}
              type="button"
              onClick={() => setVerdictFilter((prev) => (prev === item.verdict ? 'all' : item.verdict))}
              className={`rounded-md border px-4 py-3 text-left transition ${
                verdictFilter === item.verdict
                  ? 'border-[#8b5a1f] bg-[#eef0e8] dark:border-[#a1ab76] dark:bg-[#1e2018]'
                  : 'border-[#dee0d6] bg-white hover:bg-[#eef0e8]/60 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-900/80'
              }`}
            >
              <div className="font-serif text-[22px] font-semibold tabular-nums text-[#15140f] dark:text-gray-100">
                {item.count}
              </div>
              <div className="mt-1 text-[12px] text-[#51514a] dark:text-gray-400">{item.label} 产品</div>
              <div className="mt-1.5">
                <VerdictPill verdict={item.verdict} />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-md border border-[#d3e0d0] bg-[#f2f6f1] px-4 py-3 text-[13px] leading-6 text-[#374d34] dark:border-[#293628] dark:bg-[#141f14] dark:text-[#a3c2a0]">
          {SHARE_COPY.full}
        </div>

        <div className="mt-6">
          <h2 className="font-serif text-[20px] font-semibold text-[#15140f] dark:text-gray-100">2026-07 优化记录</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-4">
            {RECENT_UPDATES.map((item) => (
              <article
                key={`${item.date}-${item.title}`}
                className="rounded-md border border-[#dee0d6] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#767869] dark:text-gray-500">
                  {item.date}
                </div>
                <h3 className="mt-2 font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-[12px] leading-6 text-[#51514a] dark:text-gray-400">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
          <table className="w-full border-collapse text-left text-[13px]">
            <tbody>
              {SITE_FACTS.map((fact) => (
                <tr key={fact.label} className="border-b border-[#e4e6dc] last:border-b-0 dark:border-gray-800">
                  <th className="w-36 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#767869] dark:text-gray-500">
                    {fact.label}
                  </th>
                  <td className="px-4 py-3 text-[#262724] dark:text-gray-200">{fact.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="runtime" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">运行时边界</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
          这次优化的核心不是“删一点代码”，而是把普通访客需要的公开站、owner 才需要的后台、以及可以独立演进的前台 API 分开。短期先用 public build 贴着 Cloudflare Pages 免费计划边界，长期再拆独立 Worker。
        </p>

        <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">Worker 体积过程</h3>
            <div className="mt-3 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
              <ProductTable
                headers={['阶段', 'Routes', '包体', '说明']}
                rows={WORKER_BUNDLE_METRICS.map((row) => [
                  row.stage,
                  row.routes,
                  row.packageSize,
                  row.note,
                ])}
                emptyMessage=""
              />
            </div>
          </div>

          <div>
            <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">站点边界</h3>
            <div className="mt-3 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
              <ProductTable
                headers={['Surface', '当前状态', '下一步', '判定']}
                rows={RUNTIME_SURFACES.filter((row) => matchesVerdict(row.verdict, verdictFilter)).map((row) => [
                  row.surface,
                  row.current,
                  row.next,
                  <VerdictPill key={`${row.surface}-pill`} verdict={row.verdict} />,
                ])}
                emptyMessage="当前筛选下没有运行时边界。"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="arch" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">技术架构</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
          AI 商业项目四层架构：接入层→应用层→模型层→基础设施层。对照 2aran.com 现状标注判定。
        </p>
        <div className="mt-4">
          <figure className="overflow-hidden rounded-md border border-[#dee0db] bg-white text-center dark:border-gray-800 dark:bg-gray-900">
            <svg viewBox="0 0 760 340" role="img" aria-label="AI 商业项目四层技术架构" className="mx-auto block h-auto w-full max-w-[780px]">
              <text x="0" y="16" className="fill-[#63655f] dark:fill-gray-500" fontSize="11">四层技术架构 · Cloudflare 个人站技术地图</text>
              {/* 接入层 */}
              <rect x="20" y="36" width="720" height="52" rx="6" className="fill-[#e4ebf5] stroke-[#b4c4de] dark:fill-[#1a2438] dark:stroke-[#2c3e5a]" strokeWidth="1" />
              <text x="40" y="58" className="fill-[#334d73] dark:fill-[#9db8e8]" fontSize="11" fontWeight="600">接入层</text>
              <rect x="130" y="44" width="100" height="36" rx="4" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="180" y="67" textAnchor="middle" className="fill-white" fontSize="11">Web / H5</text>
              <rect x="240" y="44" width="120" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="300" y="67" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">iOS / Android</text>
              <rect x="370" y="44" width="100" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="420" y="67" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">Open API</text>
              <rect x="480" y="44" width="120" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="540" y="67" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">SDK / Plugin</text>
              {/* 应用层 */}
              <rect x="20" y="106" width="720" height="52" rx="6" className="fill-[#e5ece4] stroke-[#b4ccb0] dark:fill-[#1a2e18] dark:stroke-[#2c4a28]" strokeWidth="1" />
              <text x="40" y="128" className="fill-[#374d34] dark:fill-[#a3c2a0]" fontSize="11" fontWeight="600">应用层</text>
              <rect x="130" y="114" width="100" height="36" rx="4" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="180" y="137" textAnchor="middle" className="fill-white" fontSize="11">对话引擎</text>
              <rect x="240" y="114" width="80" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="280" y="137" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">RAG</text>
              <rect x="330" y="114" width="100" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="380" y="137" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">Agent 编排</text>
              <rect x="440" y="114" width="100" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="490" y="137" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">工作流引擎</text>
              <rect x="550" y="114" width="100" height="36" rx="4" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="600" y="137" textAnchor="middle" className="fill-white" fontSize="10">权限 / 计费</text>
              <rect x="660" y="114" width="70" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="695" y="137" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">多租户</text>
              {/* 模型层 */}
              <rect x="20" y="176" width="720" height="52" rx="6" className="fill-[#e2e4d8] stroke-[#c3c5b8] dark:fill-[#202018] dark:stroke-[#3a3a2c]" strokeWidth="1" />
              <text x="40" y="198" className="fill-[#7a5a1a] dark:fill-[#a1ab76]" fontSize="11" fontWeight="600">模型层</text>
              <rect x="130" y="184" width="120" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="190" y="207" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">LLM 网关路由</text>
              <rect x="260" y="184" width="120" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="320" y="207" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">Prompt 管理</text>
              <rect x="390" y="184" width="110" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="445" y="207" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">微调 / LoRA</text>
              <rect x="510" y="184" width="100" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="560" y="207" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">评测基准</text>
              {/* 基础设施层 */}
              <rect x="20" y="246" width="720" height="52" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="40" y="268" className="fill-[#51514a] dark:fill-gray-400" fontSize="11" fontWeight="600">基础设施</text>
              <rect x="130" y="254" width="80" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="170" y="277" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">向量数据库</text>
              <rect x="220" y="254" width="80" height="36" rx="4" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="260" y="277" textAnchor="middle" className="fill-white" fontSize="10">对象存储</text>
              <rect x="310" y="254" width="80" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="350" y="277" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">消息队列</text>
              <rect x="400" y="254" width="80" height="36" rx="4" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="440" y="277" textAnchor="middle" className="fill-white" fontSize="10">容器编排</text>
              <rect x="490" y="254" width="80" height="36" rx="4" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="530" y="277" textAnchor="middle" className="fill-white" fontSize="10">可观测性</text>
              <rect x="580" y="254" width="70" height="36" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="615" y="277" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">GPU 集群</text>
              <rect x="660" y="254" width="70" height="36" rx="4" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="695" y="277" textAnchor="middle" className="fill-white" fontSize="10">CDN/WAF</text>
              {/* 连线 */}
              <line x1="380" y1="88" x2="380" y2="106" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
              <line x1="380" y1="158" x2="380" y2="176" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
              <line x1="380" y1="228" x2="380" y2="246" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
              {/* 图例 */}
              <rect x="20" y="314" width="14" height="14" rx="3" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="40" y="325" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">2aran.com 已有</text>
              <rect x="140" y="314" width="14" height="14" rx="3" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="160" y="325" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">待建 / 不需要</text>
            </svg>
            <figcaption className="border-t border-[#dee0db] px-3 py-2 text-[11px] text-[#63655f] dark:border-gray-800 dark:text-gray-400">
              蓝色块 = 2aran.com 已有对应能力；白底块 = 待建或暂不需要。Web-LLM 是浏览器端推理，模型层和 GPU 集群不经过 Cloudflare。
            </figcaption>
          </figure>
        </div>

        <div className="mt-6 space-y-6">
          {TECH_ARCH_LAYERS.map((layer) => {
            const filtered = layer.items.filter((item) => matchesVerdict(item.verdict, verdictFilter))
            if (!filtered.length) return null
            return (
              <div key={layer.name}>
                <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">{layer.name}</h3>
                <div className="mt-2 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
                  <ProductTable
                    headers={['组件', '2aran.com 现状', '判定']}
                    rows={filtered.map((item) => [
                      item.component,
                      item.site,
                      <VerdictPill key={`${layer.name}-${item.component}-pill`} verdict={item.verdict} />,
                    ])}
                    emptyMessage="当前筛选下没有组件。"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section id="security" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">安全防御</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
          纵深防御五层：网络→应用→数据→模型→合规。2aran.com 在网络和应用层有较好覆盖，数据安全部分依赖平台，模型安全与合规尚空白。
        </p>
        <div className="mt-4">
          <figure className="overflow-hidden rounded-md border border-[#dee0db] bg-white text-center dark:border-gray-800 dark:bg-gray-900">
            <svg viewBox="0 0 760 320" role="img" aria-label="纵深安全防御五层架构" className="mx-auto block h-auto w-full max-w-[780px]">
              <text x="0" y="16" className="fill-[#63655f] dark:fill-gray-500" fontSize="11">纵深安全防御 · Cloudflare 个人站技术地图</text>
              {/* 网络安全 */}
              <rect x="20" y="36" width="720" height="48" rx="6" className="fill-[#4a6fa5] stroke-[#3d5f8f] dark:fill-[#5b7fb8] dark:stroke-[#4a6fa5]" strokeWidth="1" />
              <text x="40" y="65" className="fill-white" fontSize="11" fontWeight="600">网络安全</text>
              <text x="140" y="65" className="fill-white/85" fontSize="11">TLS 1.3</text>
              <text x="240" y="65" className="fill-white/85" fontSize="11">WAF</text>
              <text x="320" y="65" className="fill-white/85" fontSize="11">DDoS 防护</text>
              <text x="440" y="65" className="fill-white/60" fontSize="11">IP 白名单</text>
              {/* 应用安全 */}
              <rect x="20" y="96" width="720" height="48" rx="6" className="fill-[#e5ece4] stroke-[#b4ccb0] dark:fill-[#1a2e18] dark:stroke-[#2c4a28]" strokeWidth="1" />
              <text x="40" y="125" className="fill-[#374d34] dark:fill-[#a3c2a0]" fontSize="11" fontWeight="600">应用安全</text>
              <text x="140" y="125" className="fill-[#374d34] dark:fill-[#a3c2a0]" fontSize="11">OAuth 2.0</text>
              <text x="240" y="125" className="fill-[#374d34] dark:fill-[#a3c2a0]" fontSize="11">RBAC</text>
              <text x="320" y="125" className="fill-[#7a5a1a] dark:fill-[#a1ab76]" fontSize="11">限流</text>
              <text x="400" y="125" className="fill-[#374d34] dark:fill-[#a3c2a0]" fontSize="11">输入校验</text>
              <text x="500" y="125" className="fill-[#374d34] dark:fill-[#a3c2a0]" fontSize="11">CSP</text>
              {/* 数据安全 */}
              <rect x="20" y="156" width="720" height="48" rx="6" className="fill-[#e2e4d8] stroke-[#c3c5b8] dark:fill-[#202018] dark:stroke-[#3a3a2c]" strokeWidth="1" />
              <text x="40" y="185" className="fill-[#7a5a1a] dark:fill-[#a1ab76]" fontSize="11" fontWeight="600">数据安全</text>
              <text x="140" y="185" className="fill-[#7a5a1a] dark:fill-[#a1ab76]" fontSize="11">AES-256 at rest</text>
              <text x="290" y="185" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">数据脱敏</text>
              <text x="390" y="185" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">DLP</text>
              <text x="450" y="185" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">审计日志</text>
              <text x="550" y="185" className="fill-[#7a5a1a] dark:fill-[#a1ab76]" fontSize="11">备份</text>
              {/* 模型安全 */}
              <rect x="20" y="216" width="720" height="48" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="40" y="245" className="fill-[#51514a] dark:fill-gray-400" fontSize="11" fontWeight="600">模型安全</text>
              <text x="140" y="245" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">Prompt 注入防御</text>
              <text x="280" y="245" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">越狱防护</text>
              <text x="390" y="245" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">数据泄露防护</text>
              <text x="530" y="245" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">幻觉监控</text>
              <text x="640" y="245" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">水印</text>
              {/* 合规框架 */}
              <rect x="20" y="276" width="720" height="48" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="40" y="305" className="fill-[#51514a] dark:fill-gray-400" fontSize="11" fontWeight="600">合规框架</text>
              <text x="140" y="305" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">GDPR</text>
              <text x="220" y="305" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">数据安全法</text>
              <text x="340" y="305" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">算法备案</text>
              <text x="450" y="305" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">隐私影响评估</text>
              {/* 纵深连线 */}
              <line x1="380" y1="84" x2="380" y2="96" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
              <line x1="380" y1="144" x2="380" y2="156" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
              <line x1="380" y1="204" x2="380" y2="216" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
              <line x1="380" y1="264" x2="380" y2="276" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" />
            </svg>
            <figcaption className="border-t border-[#dee0db] px-3 py-2 text-[11px] text-[#63655f] dark:border-gray-800 dark:text-gray-400">
              深蓝底 = 全部已覆盖；绿底 = 大部分已覆盖；黄底 = 部分覆盖；白底 = 尚未覆盖。2aran.com 安全强项在网络与应用层。
            </figcaption>
          </figure>
        </div>

        <div className="mt-6 space-y-6">
          {SECURITY_LAYERS.map((layer) => {
            const filtered = layer.items.filter((item) => matchesVerdict(item.verdict, verdictFilter))
            if (!filtered.length) return null
            return (
              <div key={layer.name}>
                <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">{layer.name}</h3>
                <div className="mt-2 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
                  <ProductTable
                    headers={['组件', '2aran.com 现状', '判定']}
                    rows={filtered.map((item) => [
                      item.component,
                      item.site,
                      <VerdictPill key={`${layer.name}-${item.component}-pill`} verdict={item.verdict} />,
                    ])}
                    emptyMessage="当前筛选下没有组件。"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section id="ops" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">运营飞轮</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
          双飞轮模型：数据飞轮（用户交互→反馈标注→模型迭代→体验提升）驱动产品进化，增长飞轮（种子用户→口碑→付费→再投入）驱动商业增长。
        </p>
        <div className="mt-4">
          <figure className="overflow-hidden rounded-md border border-[#dee0db] bg-white text-center dark:border-gray-800 dark:bg-gray-900">
            <svg viewBox="0 0 760 360" role="img" aria-label="双飞轮运营模型" className="mx-auto block h-auto w-full max-w-[780px]">
              <text x="0" y="16" className="fill-[#63655f] dark:fill-gray-500" fontSize="11">双飞轮运营 · Cloudflare 个人站技术地图</text>
              {/* 数据飞轮 - 圆形 */}
              <circle cx="220" cy="190" r="110" className="fill-[#e5ece4] stroke-[#b4ccb0] dark:fill-[#1a2e18] dark:stroke-[#2c4a28]" strokeWidth="1.5" />
              <text x="220" y="175" textAnchor="middle" className="fill-[#374d34] dark:fill-[#a3c2a0]" fontSize="14" fontWeight="600">数据飞轮</text>
              <text x="220" y="195" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">用户交互→反馈标注→</text>
              <text x="220" y="211" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">模型迭代→体验提升</text>
              {/* 数据飞轮节点 */}
              <circle cx="220" cy="80" r="22" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="220" y="84" textAnchor="middle" className="fill-white" fontSize="10">交互</text>
              <circle cx="330" cy="190" r="22" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="330" y="194" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">标注</text>
              <circle cx="220" cy="300" r="22" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="220" y="304" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">迭代</text>
              <circle cx="110" cy="190" r="22" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="110" y="194" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">体验</text>
              {/* 箭头 */}
              <path d="M240,80 L310,170" className="fill-none stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.2" markerEnd="url(#ops-arrow)" />
              <path d="M330,212 L240,290" className="fill-none stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.2" markerEnd="url(#ops-arrow)" />
              <path d="M200,300 L130,212" className="fill-none stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.2" markerEnd="url(#ops-arrow)" />
              <path d="M110,168 L200,95" className="fill-none stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.2" markerEnd="url(#ops-arrow)" />
              {/* 增长飞轮 - 圆形 */}
              <circle cx="540" cy="190" r="110" className="fill-[#e2e4d8] stroke-[#c3c5b8] dark:fill-[#202018] dark:stroke-[#3a3a2c]" strokeWidth="1.5" />
              <text x="540" y="175" textAnchor="middle" className="fill-[#7a5a1a] dark:fill-[#a1ab76]" fontSize="14" fontWeight="600">增长飞轮</text>
              <text x="540" y="195" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">种子用户→口碑→</text>
              <text x="540" y="211" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">付费转化→再投入</text>
              {/* 增长飞轮节点 */}
              <circle cx="540" cy="80" r="22" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="540" y="84" textAnchor="middle" className="fill-white" fontSize="10">种子</text>
              <circle cx="650" cy="190" r="22" className="fill-[#4a6fa5] dark:fill-[#5b7fb8]" />
              <text x="650" y="194" textAnchor="middle" className="fill-white" fontSize="10">口碑</text>
              <circle cx="540" cy="300" r="22" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="540" y="304" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">付费</text>
              <circle cx="430" cy="190" r="22" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="430" y="194" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">投入</text>
              {/* 箭头 */}
              <path d="M560,80 L630,170" className="fill-none stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.2" markerEnd="url(#ops-arrow)" />
              <path d="M650,212 L560,290" className="fill-none stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.2" markerEnd="url(#ops-arrow)" />
              <path d="M520,300 L450,212" className="fill-none stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.2" markerEnd="url(#ops-arrow)" />
              <path d="M430,168 L520,95" className="fill-none stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.2" markerEnd="url(#ops-arrow)" />
              {/* 核心指标 */}
              <text x="300" y="345" className="fill-[#63655f] dark:fill-gray-500" fontSize="10">核心指标：留存率 · Token 消耗 · 任务完成率 · NPS · ARPU · CAC · LTV · 毛利率</text>
              <defs>
                <marker id="ops-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" className="fill-[#b4b6b1] dark:fill-[#41423f]" />
                </marker>
              </defs>
            </svg>
            <figcaption className="border-t border-[#dee0db] px-3 py-2 text-[11px] text-[#63655f] dark:border-gray-800 dark:text-gray-400">
              蓝色节点 = 2aran.com 已有基础；白底节点 = 尚未建设。数据飞轮是产品内驱力，增长飞轮是商业化引擎。
            </figcaption>
          </figure>
        </div>

        <div className="mt-6 space-y-6">
          {OPS_FLYWHEEL.map((loop) => (
            <div key={loop.loop}>
              <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">{loop.loop}</h3>
              <div className="mt-2 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
                <ProductTable
                  headers={['环节', '2aran.com 现状', '商业项目需要', '判定']}
                  rows={loop.items.filter((item) => matchesVerdict(item.verdict, verdictFilter)).map((item) => [
                    item.stage,
                    item.site,
                    item.need,
                    <VerdictPill key={`${loop.loop}-${item.stage}-pill`} verdict={item.verdict} />,
                  ])}
                  emptyMessage="当前筛选下没有环节。"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {OPS_METRICS.map((group) => (
            <div key={group.category} className="rounded-md border border-[#dee0d6] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#767869] dark:text-gray-500">{group.category}</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.items.map((m) => (
                  <span key={m} className="rounded-full border border-[#d3e0d0] bg-[#f2f6f1] px-2.5 py-0.5 font-mono text-[10px] text-[#374d34] dark:border-[#293628] dark:bg-[#141f14] dark:text-[#a3c2a0]">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="market" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">市场设计</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
          三层市场（C端/SMB/B端）× 四种定价模式 × 四阶段进入路径。2aran.com 目前是个人站，无商业设计；但如果未来做 AI 产品化，这些维度都需要补齐。
        </p>
        <div className="mt-4">
          <figure className="overflow-hidden rounded-md border border-[#dee0db] bg-white text-center dark:border-gray-800 dark:bg-gray-900">
            <svg viewBox="0 0 760 340" role="img" aria-label="市场设计与进入路径" className="mx-auto block h-auto w-full max-w-[780px]">
              <text x="0" y="16" className="fill-[#63655f] dark:fill-gray-500" fontSize="11">市场设计 · Cloudflare 个人站技术地图</text>
              {/* 三层市场 */}
              <rect x="20" y="36" width="230" height="52" rx="6" className="fill-[#4a6fa5] stroke-[#3d5f8f] dark:fill-[#5b7fb8] dark:stroke-[#4a6fa5]" strokeWidth="1.5" />
              <text x="135" y="58" textAnchor="middle" className="fill-white" fontSize="13" fontWeight="600">C 端市场</text>
              <text x="135" y="76" textAnchor="middle" className="fill-white/80" fontSize="11">免费工具 → 高级订阅</text>
              <rect x="265" y="36" width="230" height="52" rx="6" className="fill-[#e5ece4] stroke-[#b4ccb0] dark:fill-[#1a2e18] dark:stroke-[#2c4a28]" strokeWidth="1.5" />
              <text x="380" y="58" textAnchor="middle" className="fill-[#374d34] dark:fill-[#a3c2a0]" fontSize="13" fontWeight="600">SMB 市场</text>
              <text x="380" y="76" textAnchor="middle" className="fill-[#374d34]/80 dark:fill-[#a3c2a0]/80" fontSize="11">API/SDK → 按量计费</text>
              <rect x="510" y="36" width="230" height="52" rx="6" className="fill-[#e2e4d8] stroke-[#c3c5b8] dark:fill-[#202018] dark:stroke-[#3a3a2c]" strokeWidth="1.5" />
              <text x="625" y="58" textAnchor="middle" className="fill-[#7a5a1a] dark:fill-[#a1ab76]" fontSize="13" fontWeight="600">B 端市场</text>
              <text x="625" y="76" textAnchor="middle" className="fill-[#7a5a1a]/80 dark:fill-[#a1ab76]/80" fontSize="11">私有部署 → 年度合同</text>
              {/* 定价模式 */}
              <rect x="20" y="108" width="170" height="42" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="105" y="130" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11" fontWeight="600">按量计费</text>
              <rect x="200" y="108" width="170" height="42" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="285" y="130" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11" fontWeight="600">订阅制</text>
              <rect x="380" y="108" width="170" height="42" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="465" y="130" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11" fontWeight="600">混合模式</text>
              <rect x="560" y="108" width="170" height="42" rx="4" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1" />
              <text x="645" y="130" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11" fontWeight="600">效果计费</text>
              <text x="380" y="170" textAnchor="middle" className="fill-[#63655f] dark:fill-gray-500" fontSize="10">定价模式</text>
              {/* 四阶段进入路径 */}
              <rect x="20" y="195" width="170" height="56" rx="6" className="fill-[#4a6fa5] stroke-[#3d5f8f] dark:fill-[#5b7fb8] dark:stroke-[#4a6fa5]" strokeWidth="1.5" />
              <text x="105" y="218" textAnchor="middle" className="fill-white" fontSize="12" fontWeight="600">① 垂直场景突破</text>
              <text x="105" y="236" textAnchor="middle" className="fill-white/75" fontSize="9">选一个高价值场景做到极致</text>
              <line x1="190" y1="223" x2="200" y2="223" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" markerEnd="url(#market-arrow)" />
              <rect x="200" y="195" width="170" height="56" rx="6" className="fill-[#e5ece4] stroke-[#b4ccb0] dark:fill-[#1a2e18] dark:stroke-[#2c4a28]" strokeWidth="1.5" />
              <text x="285" y="218" textAnchor="middle" className="fill-[#374d34] dark:fill-[#a3c2a0]" fontSize="12" fontWeight="600">② 横向能力扩展</text>
              <text x="285" y="236" textAnchor="middle" className="fill-[#374d34]/75 dark:fill-[#a3c2a0]/75" fontSize="9">从单场景到多场景覆盖</text>
              <line x1="370" y1="223" x2="380" y2="223" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" markerEnd="url(#market-arrow)" />
              <rect x="380" y="195" width="170" height="56" rx="6" className="fill-[#e2e4d8] stroke-[#c3c5b8] dark:fill-[#202018] dark:stroke-[#3a3a2c]" strokeWidth="1.5" />
              <text x="465" y="218" textAnchor="middle" className="fill-[#7a5a1a] dark:fill-[#a1ab76]" fontSize="12" fontWeight="600">③ 平台生态构建</text>
              <text x="465" y="236" textAnchor="middle" className="fill-[#7a5a1a]/75 dark:fill-[#a1ab76]/75" fontSize="9">开放 API/SDK 引入第三方</text>
              <line x1="550" y1="223" x2="560" y2="223" className="stroke-[#b4b6b1] dark:stroke-[#41423f]" strokeWidth="1.5" markerEnd="url(#market-arrow)" />
              <rect x="560" y="195" width="170" height="56" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1.5" />
              <text x="645" y="218" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="12" fontWeight="600">④ 全球化</text>
              <text x="645" y="236" textAnchor="middle" className="fill-[#51514a]/75 dark:fill-gray-500" fontSize="9">多语言/多区域/多币种</text>
              {/* 2aran.com 定位 */}
              <text x="380" y="280" textAnchor="middle" className="fill-[#8a5a14] dark:fill-[#9ba475]" fontSize="11" fontWeight="600">2aran.com 当前定位</text>
              <line x1="105" y1="251" x2="105" y2="295" className="stroke-[#8a5a14] dark:stroke-[#9ba475]" strokeWidth="1" strokeDasharray="4 2" />
              <text x="105" y="310" textAnchor="middle" className="fill-[#8a5a14] dark:fill-[#9ba475]" fontSize="10">/web-llm AI 体验入口</text>
              <text x="285" y="310" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">调研内容体系可复用</text>
              <text x="465" y="310" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">暂未启动</text>
              <text x="645" y="310" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="10">i18n 雏形已有</text>
              <defs>
                <marker id="market-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" className="fill-[#b4b6b1] dark:fill-[#41423f]" />
                </marker>
              </defs>
            </svg>
            <figcaption className="border-t border-[#dee0db] px-3 py-2 text-[11px] text-[#63655f] dark:border-gray-800 dark:text-gray-400">
              蓝色 = 已有切入点（垂直场景），绿色/黄色 = 待建设，白色 = 远期。虚线标注 2aran.com 当前在进入路径上的位置。
            </figcaption>
          </figure>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">三层市场</h3>
            <div className="mt-2 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
              <ProductTable
                headers={['层级', '模式', '2aran.com', '判定']}
                rows={MARKET_DESIGN.filter((item) => matchesVerdict(item.verdict, verdictFilter)).map((item) => [
                  item.tier,
                  item.desc,
                  item.site,
                  <VerdictPill key={`${item.tier}-pill`} verdict={item.verdict} />,
                ])}
                emptyMessage="当前筛选下没有市场层级。"
              />
            </div>
          </div>
          <div>
            <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">定价模式</h3>
            <div className="mt-2 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
              <ProductTable
                headers={['模式', '说明', '判定']}
                rows={PRICING_MODELS.filter((item) => matchesVerdict(item.verdict, verdictFilter)).map((item) => [
                  item.model,
                  item.desc,
                  <VerdictPill key={`${item.model}-pill`} verdict={item.verdict} />,
                ])}
                emptyMessage="当前筛选下没有定价模式。"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">进入路径</h3>
          <div className="mt-2 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
            <ProductTable
              headers={['阶段', '说明', '2aran.com 对照']}
              rows={MARKET_ENTRY.map((item) => [item.stage, item.desc, item.site])}
              emptyMessage=""
            />
          </div>
        </div>
      </section>

      <section id="cloudflare" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">Cloudflare 对照</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
          2aran.com 的 Cloudflare 实装快照：架构数据流、产品判定、存储选型、R2 扩展场景。
        </p>

        <div className="mt-4">
          <h3 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">架构快照</h3>
          <div className="mt-3">
            <ArchitectureDiagram />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">产品判定</h3>
              <p className="mt-2 text-[13px] text-[#51514a] dark:text-gray-400">
                点击上方统计卡或下方筛选器过滤；当前可见 {visibleCount} 项。
              </p>
            </div>
            <label className="block w-full max-w-xs">
              <span className="sr-only">搜索产品</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索产品名 / 场景…"
                className="w-full rounded-md border border-[#d0d2cd] bg-white px-3 py-2 text-[13px] text-[#15140f] outline-none ring-[#8b5a1f] focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {VERDICT_FILTERS.map((filter) =>
              filter.id === 'all' ? (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setVerdictFilter('all')}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
                    verdictFilter === 'all'
                      ? 'bg-[#e4ebf5] text-[#334d73] ring-2 ring-[#8b5a1f] ring-offset-1 dark:bg-[#1a2438] dark:text-[#9db8e8] dark:ring-[#a1ab76] dark:ring-offset-gray-950'
                      : 'bg-[#e2e4dc] text-[#51514a] opacity-80 hover:opacity-100 dark:bg-[#1c1d1b] dark:text-[#9c9c96]'
                  }`}
                >
                  全部
                </button>
              ) : (
                <VerdictPill
                  key={filter.id}
                  verdict={filter.id}
                  active={verdictFilter === filter.id}
                  onClick={() => setVerdictFilter(filter.id)}
                />
              )
            )}
            {verdictFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => setVerdictFilter('all')}
                className="text-[12px] text-[#8b5a1f] underline-offset-4 hover:underline dark:text-[#a1ab76]"
              >
                清除筛选
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-8">
            <div>
              <h4 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">核心三层</h4>
              <div className="mt-3 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
                <ProductTable
                  headers={['层级', '产品', '职责', '判定', '备注']}
                  rows={CORE_STACK.filter((row) => matchesVerdict(row.verdict, verdictFilter)).map((row) => [
                    row.layer,
                    row.product,
                    row.role,
                    <VerdictPill key={`${row.product}-pill`} verdict={row.verdict} />,
                    row.note,
                  ])}
                  emptyMessage="当前筛选下没有核心层产品。"
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">存储 & 数据</h4>
                <div className="mt-3 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
                  <ProductTable
                    headers={['产品', '类型', '个人站场景', '判定']}
                    rows={filteredStorage.map((row) => [
                      row.product,
                      row.type,
                      row.personalUse,
                      <VerdictPill key={`${row.product}-pill`} verdict={row.verdict} />,
                    ])}
                    emptyMessage="当前筛选下没有存储类产品。"
                  />
                </div>
              </div>
              <div>
                <h4 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">AI & Agent</h4>
                <div className="mt-3 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
                  <ProductTable
                    headers={['产品', '职责', '判定', '原因']}
                    rows={filteredAi.map((row) => [
                      row.product,
                      row.role,
                      <VerdictPill key={`${row.product}-pill`} verdict={row.verdict} />,
                      row.reason,
                    ])}
                    emptyMessage="当前筛选下没有 AI 类产品。"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setPlatformOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-md border border-[#dee0d6] bg-white px-4 py-3 text-left transition hover:bg-[#eef0e8]/60 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-900/80"
              >
                <span className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">
                  平台 & 周边服务
                </span>
                <span className="font-mono text-[11px] text-[#767869] dark:text-gray-500">
                  {platformOpen ? '收起' : '展开'} · {filteredPlatform.length} 项
                </span>
              </button>
              {platformOpen ? (
                <div className="mt-3 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
                  <ProductTable
                    headers={['产品', '职责', '判定', '说明']}
                    rows={filteredPlatform.map((row) => [
                      row.product,
                      row.role,
                      <VerdictPill key={`${row.product}-pill`} verdict={row.verdict} />,
                      row.reason,
                    ])}
                    emptyMessage="当前筛选下没有平台类产品。"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">D1 / R2 / KV 怎么选</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {STORAGE_COMPARE.map((item) => (
              <article
                key={item.name}
                className="rounded-md border border-[#dee0d6] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">{item.name}</h4>
                  <VerdictPill verdict={item.verdict} />
                </div>
                <p className="mt-3 text-[13px] leading-6 text-[#262724] dark:text-gray-200">{item.store}</p>
                <p className="mt-2 text-[12px] leading-6 text-[#51514a] dark:text-gray-400">{item.site}</p>
                <p className="mt-2 text-[12px] leading-6 text-[#63655f] dark:text-gray-500">{item.avoid}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
            和 AWS 对照：<strong className="font-normal text-[#15140f] dark:text-gray-200">S3</strong> = 对象存储行业标准；{' '}
            <strong className="font-normal text-[#15140f] dark:text-gray-200">R2</strong> = S3 兼容 + 免 egress。{' '}
            <strong className="font-normal text-[#15140f] dark:text-gray-200">D1</strong> = Database 1，Cloudflare 第一条 SQL 产品线。
          </p>
        </div>

        <div className="mt-8">
          <h3 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">R2 扩展场景</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
            R2 已接入壁纸/可下载资源（绑定 MEDIA，前缀 downloads/），以下场景可扩展其用途。核心原则：D1 存元数据 + R2 存大文件本体。
          </p>
          <div className="mt-4 overflow-hidden rounded-md border border-[#dee0d6] dark:border-gray-800">
            <ProductTable
              headers={['场景', '建议动作']}
              rows={TRIGGER_RULES.map((row) => [row.trigger, row.action])}
              emptyMessage=""
            />
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md border border-[#dee0d6] bg-[#eef0e8] px-4 py-3 font-mono text-[12px] leading-6 text-[#262724] dark:border-gray-800 dark:bg-[#1a1814] dark:text-gray-200">
{`D1  →  元数据（谁、何时、文件名、R2 key）
R2  →  实际文件`}
          </pre>
        </div>
      </section>

      <section id="stack" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">推荐最小栈</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {MIN_STACK.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#d3e0d0] bg-[#f2f6f1] px-3 py-1 font-mono text-[11px] text-[#374d34] dark:border-[#293628] dark:bg-[#141f14] dark:text-[#a3c2a0]"
            >
              {item}
            </span>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-[#63655f] dark:text-gray-500">
          刻意不加：{SKIP_STACK.join(' · ')}
        </p>
      </section>

      <section className="mt-10 border-t border-[#dee0d6] pt-8 dark:border-gray-800">
        <h2 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">相关阅读</h2>
        <ul className="mt-4 space-y-2">
          {RELATED_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-[13px] text-[#8b5a1f] no-underline hover:underline dark:text-[#a1ab76]"
              >
                {link.label}
              </Link>
              <span className="ml-2 text-[12px] text-[#63655f] dark:text-gray-500">{link.note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[12px] text-[#63655f] dark:text-gray-500">
          返回{' '}
          <Link href="/works" className="text-[#8b5a1f] no-underline hover:underline dark:text-[#a1ab76]">
            多维页面
          </Link>
          {' · '}
          判定基于 wrangler.toml、next-on-pages 构建日志与本次 public/admin/API 拆分记录（2026-07 快照）
        </p>
      </section>
    </main>
  )
}
