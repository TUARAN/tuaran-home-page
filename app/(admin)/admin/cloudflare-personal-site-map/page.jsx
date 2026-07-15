import Link from 'next/link'

import AdminPageGate from '../../components/AdminPageGate'
import { AdminPage } from '../../components/ui'
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
  VERDICT_META,
  WORKER_BUNDLE_METRICS,
} from './data'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: SHARE_COPY.title,
  description: SHARE_COPY.lead,
  robots: { index: false, follow: false },
}

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

function VerdictPill({ verdict }) {
  const meta = VERDICT_META[verdict] || VERDICT_META.skip
  const toneClass = {
    success: 'bg-[#e5ece4] text-[#374d34] dark:bg-[#1a2e18] dark:text-[#a3c2a0]',
    info: 'bg-[#e4ebf5] text-[#334d73] dark:bg-[#1a2438] dark:text-[#9db8e8]',
    warning: 'bg-[#e2e4d8] text-[#7a5a1a] dark:bg-[#202018] dark:text-[#a1ab76]',
    neutral: 'bg-[#e2e4dc] text-[#51514a] dark:bg-[#1c1d1b] dark:text-[#9c9c96]',
  }[meta.tone]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${toneClass}`}>
      {meta.label}
    </span>
  )
}

function Section({ id, title, description, children }) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <div className="mb-4">
        <h2 className="font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">{title}</h2>
        {description ? <p className="mt-1 text-[13px] leading-6 text-[#63655f] dark:text-gray-500">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function DataTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-md border border-[#dee0d6] bg-white dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full min-w-[680px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-[#dee0d6] dark:border-gray-800">
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#767869] dark:text-gray-500">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-[#e4e6dc] last:border-b-0 dark:border-gray-800/80">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3 align-top text-[#262724] dark:text-gray-200">
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

function LayerTables({ layers, headers, rowBuilder }) {
  return (
    <div className="space-y-5">
      {layers.map((layer) => (
        <div key={layer.name}>
          <h3 className="mb-2 font-serif text-[17px] font-semibold text-[#15140f] dark:text-gray-100">{layer.name}</h3>
          <DataTable headers={headers} rows={layer.items.map(rowBuilder)} />
        </div>
      ))}
    </div>
  )
}

function ArchitectureDiagram() {
  return (
    <figure className="overflow-hidden rounded-md border border-[#dee0db] bg-white text-center dark:border-gray-800 dark:bg-gray-900">
      <svg viewBox="0 0 760 300" role="img" aria-label="2aran.com 在 Cloudflare 上的数据流" className="mx-auto block h-auto w-full max-w-[780px]">
        <text x="0" y="16" className="fill-[#63655f] dark:fill-gray-500" fontSize="11">架构快照 · tuaran-home-page · 2026-07</text>
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
      </svg>
      <figcaption className="border-t border-[#dee0db] px-3 py-2 text-[11px] text-[#63655f] dark:border-gray-800 dark:text-gray-400">
        访客请求先过边缘 Middleware，再由公开 Pages Worker 承接前台页面与少量 API；后台和后台 API 已准备拆到 admin.2aran.com，评论/通知/积分后续收敛到轻 API Worker。
      </figcaption>
    </figure>
  )
}

function CloudflarePersonalSiteMapContent() {
  return (
    <AdminPage title="Cloudflare 个人站技术地图" description={SHARE_COPY.lead}>
      <div className="border-b border-[#dee0db] pb-4 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a5a14] dark:text-[#9ba475]">
            Engineering Work · Cloudflare 架构
          </span>
          <span className="rounded-full bg-[#e4ebf5] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#334d73] dark:bg-[#1a2438] dark:text-[#9db8e8]">
            后台私有 · Server Rendered
          </span>
        </div>
      </div>

      <nav aria-label="页面章节" className="sticky top-0 z-10 mt-5 flex flex-wrap gap-x-3 gap-y-2 border-b border-[#dee0d6] bg-[#f7f8f5]/95 py-3 backdrop-blur dark:border-gray-800 dark:bg-[#111]/95">
        {SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="text-[12px] font-medium text-[#67695d] no-underline underline-offset-4 hover:text-[#8b5a1f] hover:underline dark:text-gray-400 dark:hover:text-[#a1ab76]">
            {section.label}
          </a>
        ))}
      </nav>

      <Section id="overview" title="概览">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DIMENSION_SCORES.map((dim) => (
            <div key={dim.id} className="rounded-md border border-[#dee0d6] bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dim.color }} />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#767869] dark:text-gray-500">{dim.label}</span>
              </div>
              <div className="mt-2 font-serif text-[28px] font-semibold tabular-nums text-[#15140f] dark:text-gray-100">{dim.score}</div>
              <div className="mt-1 text-[12px] text-[#51514a] dark:text-gray-400">{dim.summary}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {VERDICT_COUNTS.map((item) => (
            <div key={item.verdict} className="rounded-md border border-[#dee0d6] bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
              <div className="font-serif text-[22px] font-semibold tabular-nums text-[#15140f] dark:text-gray-100">{item.count}</div>
              <div className="mt-1 text-[12px] text-[#51514a] dark:text-gray-400">{item.label} 产品</div>
              <div className="mt-1.5"><VerdictPill verdict={item.verdict} /></div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-md border border-[#d3e0d0] bg-[#f2f6f1] px-4 py-3 text-[13px] leading-6 text-[#374d34] dark:border-[#293628] dark:bg-[#141f14] dark:text-[#a3c2a0]">
          {SHARE_COPY.full}
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          {RECENT_UPDATES.map((item) => (
            <article key={`${item.date}-${item.title}`} className="rounded-md border border-[#dee0d6] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#767869] dark:text-gray-500">{item.date}</div>
              <h3 className="mt-2 font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{item.title}</h3>
              <p className="mt-2 text-[12px] leading-6 text-[#51514a] dark:text-gray-400">{item.detail}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="runtime" title="运行时边界" description="public / admin / API 的职责分层。">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <ArchitectureDiagram />
          <div className="space-y-4">
            <DataTable headers={['事实', '当前值']} rows={SITE_FACTS.map((fact) => [fact.label, fact.value])} />
            <DataTable headers={['阶段', '路由', '体积', '说明']} rows={WORKER_BUNDLE_METRICS.map((row) => [row.stage, row.routes, row.packageSize, row.note])} />
          </div>
        </div>
        <div className="mt-5">
          <DataTable
            headers={['面', '当前', '下一步', '判定']}
            rows={RUNTIME_SURFACES.map((row) => [row.surface, row.current, row.next, <VerdictPill key={`${row.surface}-pill`} verdict={row.verdict} />])}
          />
        </div>
      </Section>

      <Section id="arch" title="技术架构">
        <LayerTables
          layers={TECH_ARCH_LAYERS}
          headers={['组件', '本站状态', '判定']}
          rowBuilder={(item) => [item.component, item.site, <VerdictPill key={`${item.component}-pill`} verdict={item.verdict} />]}
        />
      </Section>

      <Section id="security" title="安全防御">
        <LayerTables
          layers={SECURITY_LAYERS}
          headers={['组件', '本站状态', '判定']}
          rowBuilder={(item) => [item.component, item.site, <VerdictPill key={`${item.component}-pill`} verdict={item.verdict} />]}
        />
      </Section>

      <Section id="ops" title="运营飞轮">
        <div className="space-y-5">
          {OPS_FLYWHEEL.map((loop) => (
            <div key={loop.loop}>
              <h3 className="mb-2 font-serif text-[17px] font-semibold text-[#15140f] dark:text-gray-100">{loop.loop}</h3>
              <DataTable
                headers={['阶段', '本站状态', '需要补齐', '判定']}
                rows={loop.items.map((item) => [item.stage, item.site, item.need, <VerdictPill key={`${loop.loop}-${item.stage}-pill`} verdict={item.verdict} />])}
              />
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {OPS_METRICS.map((group) => (
            <div key={group.category} className="rounded-md border border-[#dee0d6] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">{group.category}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">{group.items.join(' · ')}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="market" title="市场设计">
        <div className="space-y-5">
          <DataTable headers={['层级', '设计', '本站状态', '判定']} rows={MARKET_DESIGN.map((item) => [item.tier, item.desc, item.site, <VerdictPill key={`${item.tier}-pill`} verdict={item.verdict} />])} />
          <DataTable headers={['模式', '说明', '判定']} rows={PRICING_MODELS.map((item) => [item.model, item.desc, <VerdictPill key={`${item.model}-pill`} verdict={item.verdict} />])} />
          <DataTable headers={['阶段', '说明', '本站入口']} rows={MARKET_ENTRY.map((item) => [item.stage, item.desc, item.site])} />
        </div>
      </Section>

      <Section id="cloudflare" title="Cloudflare 对照">
        <div className="space-y-5">
          <DataTable headers={['层级', '产品', '职责', '判定', '备注']} rows={CORE_STACK.map((row) => [row.layer, row.product, row.role, <VerdictPill key={`${row.product}-pill`} verdict={row.verdict} />, row.note])} />
          <DataTable headers={['产品', '类型', '个人站场景', '判定']} rows={STORAGE_PRODUCTS.map((row) => [row.product, row.type, row.personalUse, <VerdictPill key={`${row.product}-pill`} verdict={row.verdict} />])} />
          <DataTable headers={['产品', '职责', '判定', '原因']} rows={AI_PRODUCTS.map((row) => [row.product, row.role, <VerdictPill key={`${row.product}-pill`} verdict={row.verdict} />, row.reason])} />
          <DataTable headers={['产品', '职责', '判定', '说明']} rows={PLATFORM_PRODUCTS.map((row) => [row.product, row.role, <VerdictPill key={`${row.product}-pill`} verdict={row.verdict} />, row.reason])} />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {STORAGE_COMPARE.map((item) => (
            <article key={item.name} className="rounded-md border border-[#dee0d6] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">{item.name}</h3>
                <VerdictPill verdict={item.verdict} />
              </div>
              <p className="mt-3 text-[13px] leading-6 text-[#262724] dark:text-gray-200">{item.store}</p>
              <p className="mt-2 text-[12px] leading-6 text-[#51514a] dark:text-gray-400">{item.site}</p>
              <p className="mt-2 text-[12px] leading-6 text-[#63655f] dark:text-gray-500">{item.avoid}</p>
            </article>
          ))}
        </div>
        <div className="mt-5">
          <DataTable headers={['触发条件', '建议动作']} rows={TRIGGER_RULES.map((row) => [row.trigger, row.action])} />
        </div>
      </Section>

      <Section id="stack" title="推荐最小栈">
        <div className="flex flex-wrap gap-2">
          {MIN_STACK.map((item) => (
            <span key={item} className="rounded-full border border-[#d3e0d0] bg-[#f2f6f1] px-3 py-1 font-mono text-[11px] text-[#374d34] dark:border-[#293628] dark:bg-[#141f14] dark:text-[#a3c2a0]">
              {item}
            </span>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-[#63655f] dark:text-gray-500">刻意不加：{SKIP_STACK.join(' · ')}</p>
      </Section>

      <section className="mt-10 border-t border-[#dee0d6] pt-8 dark:border-gray-800">
        <h2 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">相关阅读</h2>
        <ul className="mt-4 space-y-2">
          {RELATED_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-[13px] text-[#8b5a1f] no-underline hover:underline dark:text-[#a1ab76]">
                {link.label}
              </Link>
              <span className="ml-2 text-[12px] text-[#63655f] dark:text-gray-500">{link.note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[12px] text-[#63655f] dark:text-gray-500">
          返回 <Link href="/admin" className="text-[#8b5a1f] no-underline hover:underline dark:text-[#a1ab76]">后台总览</Link> ·
          判定基于 wrangler.toml、next-on-pages 构建日志与本次 public/admin/API 拆分记录（2026-07 快照）
        </p>
      </section>
    </AdminPage>
  )
}

export default function CloudflarePersonalSiteMapPage() {
  return (
    <AdminPageGate
      label="Cloudflare 个人站技术地图"
      returnTo="/admin/cloudflare-personal-site-map"
      description="本站 Cloudflare 架构、public/admin/API 边界与后续技术细节，仅站长本人可见。"
    >
      <CloudflarePersonalSiteMapContent />
    </AdminPageGate>
  )
}
