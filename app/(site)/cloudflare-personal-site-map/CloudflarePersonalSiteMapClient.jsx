'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import SharePageButton from '../components/SharePageButton'
import CanvasOriginBadge from '../components/CanvasOriginBadge'

import {
  AI_PRODUCTS,
  CORE_STACK,
  MIN_STACK,
  PLATFORM_PRODUCTS,
  RELATED_LINKS,
  SHARE_COPY,
  SITE_FACTS,
  SKIP_STACK,
  STORAGE_COMPARE,
  STORAGE_PRODUCTS,
  TRIGGER_RULES,
  VERDICT_COUNTS,
  VERDICT_FILTERS,
  VERDICT_META,
} from './data'

const SHARE_URL = 'https://2aran.com/cloudflare-personal-site-map'

const SECTIONS = [
  { id: 'overview', label: '概览' },
  { id: 'flow', label: '数据流' },
  { id: 'products', label: '产品判定' },
  { id: 'storage', label: 'D1 / R2 / KV' },
  { id: 'triggers', label: 'R2 扩展' },
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
          架构快照 · tuaran-home-page · 2026-06
        </text>
        <rect x="20" y="40" width="120" height="56" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1.2" />
        <text x="80" y="68" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">访客</text>
        <text x="80" y="84" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">浏览器</text>
        <rect x="180" y="40" width="140" height="56" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1.2" />
        <text x="250" y="68" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">Cloudflare CDN</text>
        <text x="250" y="84" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">Pages 边缘 · Middleware</text>
        <rect x="360" y="28" width="160" height="80" rx="6" className="fill-[#4a6fa5] stroke-[#3d5f8f] dark:fill-[#5b7fb8] dark:stroke-[#4a6fa5]" strokeWidth="1.5" />
        <text x="440" y="58" textAnchor="middle" className="fill-white" fontSize="13" fontWeight="600">Pages Functions</text>
        <text x="440" y="78" textAnchor="middle" className="fill-white/85" fontSize="11">Next.js API Routes</text>
        <rect x="560" y="40" width="160" height="56" rx="6" className="fill-[#e9ebe6] stroke-[#c3c5c0] dark:fill-[#1c1d1b] dark:stroke-[#373836]" strokeWidth="1.2" />
        <text x="640" y="68" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">D1 · DB</text>
        <text x="640" y="84" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">SQLite 边缘库</text>
        <rect x="180" y="130" width="140" height="56" rx="6" className="fill-[#f7f8f5] stroke-[#d0d2cd] dark:fill-[#161513] dark:stroke-[#2c2d2b]" strokeWidth="1.2" />
        <text x="250" y="158" textAnchor="middle" className="fill-[#15140f] dark:fill-gray-100" fontSize="13" fontWeight="600">Git 构建产物</text>
        <text x="250" y="174" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">public/ + SSR</text>
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
        <text x="620" y="254" textAnchor="middle" className="fill-[#51514a] dark:fill-gray-400" fontSize="11">壁纸 / 可下载</text>
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
        访客请求先过边缘 Middleware（cf-ipcountry 定默认语言、域名/路径重定向），再由 Pages CDN 分发；动态写操作进 Functions → D1；壁纸等大文件走 Functions → R2（D1 只存元数据）；浏览器 WebGPU 本地推理不进 Cloudflare AI。
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
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <header className="border-b border-[#dee0db] pb-6 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a5a14] dark:text-[#9ba475]">
            Engineering Work · Cloudflare
          </span>
          <span className="rounded-full bg-[#e5ece4] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#374d34] dark:bg-[#1a2e18] dark:text-[#a3c2a0]">
            对照 2aran.com 实装
          </span>
          <CanvasOriginBadge canvasId="cloudflare-personal-site-map" size="sm" />
        </div>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-serif text-[24px] font-semibold leading-snug text-[#15140f] dark:text-gray-100 sm:text-[30px]">
              Cloudflare 开发者平台选型地图
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
        <div className="grid gap-3 sm:grid-cols-3">
          {VERDICT_COUNTS.map((item) => (
            <button
              key={item.verdict}
              type="button"
              onClick={() => setVerdictFilter((prev) => (prev === item.verdict ? 'all' : item.verdict))}
              className={`rounded-md border px-4 py-4 text-left transition ${
                verdictFilter === item.verdict
                  ? 'border-[#8b5a1f] bg-[#eef0e8] dark:border-[#a1ab76] dark:bg-[#1e2018]'
                  : 'border-[#dee0d6] bg-white hover:bg-[#eef0e8]/60 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-900/80'
              }`}
            >
              <div className="font-serif text-[28px] font-semibold tabular-nums text-[#15140f] dark:text-gray-100">
                {item.count}
              </div>
              <div className="mt-1 text-[12px] text-[#51514a] dark:text-gray-400">{item.label} 产品</div>
              <div className="mt-2">
                <VerdictPill verdict={item.verdict} />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-md border border-[#d3e0d0] bg-[#f2f6f1] px-4 py-3 text-[13px] leading-6 text-[#374d34] dark:border-[#293628] dark:bg-[#141f14] dark:text-[#a3c2a0]">
          {SHARE_COPY.full}
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

      <section id="flow" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">数据流</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
          你现在这条链路：Pages 托管 + 边缘 Middleware（cf-ipcountry 定默认语言 / 域名重定向）+ Functions 写 D1 + R2（壁纸/可下载文件）+ Git 静态资源。
        </p>
        <div className="mt-4">
          <ArchitectureDiagram />
        </div>
      </section>

      <section id="products" className="mt-10 scroll-mt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">产品判定</h2>
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
            <h3 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">核心三层</h3>
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
              <h3 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">存储 & 数据</h3>
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
              <h3 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">AI & Agent</h3>
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
              <span className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">
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
      </section>

      <section id="storage" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">D1 / R2 / KV 怎么选</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {STORAGE_COMPARE.map((item) => (
            <article
              key={item.name}
              className="rounded-md border border-[#dee0d6] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">{item.name}</h3>
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
      </section>

      <section id="triggers" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">R2 扩展场景</h2>
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
          判定基于 wrangler.toml 与 ai-context/architecture.md（2026-06 快照）
        </p>
      </section>
    </main>
  )
}
