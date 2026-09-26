import Link from 'next/link'
import {
  IconArrowUpRight,
  IconExternalLink,
} from '@tabler/icons-react'

import { readRuntimeKnowledgeItems } from '../../../lib/knowledgeRuntime'
import { readContentCatalog } from '../../../lib/contentCatalogRuntime'
import { listRuntimeResearchByCategory } from '../../../lib/researchRuntime'
import { isAShareCompanyObservation, isCryptoAssetObservation } from '../../../lib/research/shareTitle'
import { researchPublicSummary } from '../../../lib/researchPublicSummary'
import { WEB3_CATEGORY_META, WEB3_RESOURCE_GROUPS } from '../../../lib/web3Directory'
import UsStockBook from './us-stocks/UsStockBook'
import UsStockReview from './us-stocks/UsStockReview'
import Web3Sidebar from './Web3Sidebar'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '市场与 Web3 · 内容、协议与链上查询',
  description: '汇集 A 股调研、加密资产与 Web3 内容，涵盖 CEX、DEX、DeFi、公链、钱包和数据查询。',
  keywords: ['市场与 Web3', 'DEX', 'CEX', 'DeFi', '区块链浏览器', '加密数据', 'A股调研'],
  alternates: { canonical: '/web3' },
}

function byDateDesc(a, b) {
  return String(b.date || '').localeCompare(String(a.date || ''))
}

async function listResearchForDirectory(category) {
  try {
    return await listRuntimeResearchByCategory(category)
  } catch (error) {
    const missingLocalD1 = process.env.NODE_ENV === 'development'
      && String(error?.message || '').includes('D1 binding DB is missing')
    if (!missingLocalD1) throw error
    const catalog = await readContentCatalog()
    return Object.values(catalog.researchMeta)
      .filter((entry) => entry.category === category)
      .sort(byDateDesc)
  }
}

function dateLabel(value) {
  const date = String(value || '').slice(0, 10)
  return date || '持续更新'
}

function aShareIdentity(entry) {
  const code = entry.slug.match(/(?:^|-)a-share-(\d{6})(?:$|-)/)?.[1]
    || entry.title.match(/[（(](\d{6})[）)]/)?.[1]
    || ''
  const company = entry.title.match(/——\s*([^（(]+)[（(]\d{6}[）)]/)?.[1]?.trim()
    || entry.title.replace(/^.*——\s*/, '').replace(/[（(]\d{6}[）)].*$/, '').trim()
  return { code, company }
}

function cryptoIdentity(entry) {
  const match = entry.title.match(/——\s*([^（(]+)[（(]([^）)]+)[）)]/)
  return {
    name: match?.[1]?.trim() || entry.title,
    symbol: entry.symbol || match?.[2]?.trim() || '',
  }
}

function ContentList({ id, title, description, href, count, items }) {
  return (
    <section id={id} className="min-w-0 scroll-mt-28 border-t border-[var(--site-line)] py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[var(--site-ink)]">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--site-faint)]">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="font-mono text-[11px] text-[var(--site-faint)]">{count} 篇</span>
          <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--site-ink)] no-underline hover:underline">
            查看全部 <IconArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {items.map((item) => (
          <ArticlePreview key={item.href} item={item} label={title} />
        ))}
      </div>
    </section>
  )
}

function ArticlePreview({ item, label, featured = false }) {
  return (
    <Link
      href={item.href}
      className={`group flex min-w-0 flex-col border border-[var(--site-line)] bg-[var(--site-panel)] no-underline transition hover:-translate-y-0.5 hover:border-[var(--site-accent)] hover:shadow-[0_12px_28px_rgba(28,25,20,0.07)] dark:hover:shadow-none ${featured ? 'min-h-[178px] rounded-2xl p-5' : 'min-h-[154px] rounded-xl p-3.5'}`}
    >
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--site-faint)]">
        <span className="truncate">{label}</span>
        <span className="shrink-0 whitespace-nowrap">{dateLabel(item.date)}</span>
      </div>
      <h3 className={`${featured ? 'mt-4 text-base leading-6' : 'mt-3 text-sm leading-5'} line-clamp-2 font-semibold text-[var(--site-ink)] group-hover:text-[var(--site-accent)]`}>{item.title}</h3>
      <p className={`${featured ? 'line-clamp-2' : 'line-clamp-3'} mt-2 text-xs leading-5 text-[var(--site-muted)]`}>{item.summary}</p>
      <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-[var(--site-ink)]">阅读 <IconArrowUpRight size={13} /></span>
    </Link>
  )
}

function ResourceGroup({ group }) {
  return (
    <section id={group.id} className="scroll-mt-28 border-t border-[var(--site-line)] py-7 first:border-t-0">
      <div className="mb-3 grid gap-1 md:grid-cols-[190px_1fr] md:gap-8">
        <h3 className="text-base font-semibold text-[var(--site-ink)]">{group.title}</h3>
        <p className="text-sm leading-6 text-[var(--site-muted)]">{group.description}</p>
      </div>
      <div className="grid gap-x-8 sm:grid-cols-2">
        {group.items.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="group grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[var(--site-line)] py-3 no-underline"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-2">
              <strong className="text-sm text-[var(--site-ink)]">{item.name}</strong>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--site-faint)]">{item.type}</span>
              </span>
              <span className="mt-1 block truncate text-xs text-[var(--site-muted)]">{item.note}</span>
            </span>
            <IconExternalLink size={14} className="mt-1 text-[var(--site-faint)] group-hover:text-[var(--site-accent)]" />
          </a>
        ))}
      </div>
    </section>
  )
}

function categoryIdForItem(item) {
  const text = `${item.title || ''} ${item.summary || ''} ${item.href || ''}`.toLowerCase()
  if (/usdt|usdc|tether|stablecoin|稳定币/.test(text)) return 'stablecoins'
  if (/币安人生|binance|crypto-binancecoin/.test(text)) return 'cex'
  if (/how-to-launch-token-onchain|流动性市场的完整架构/.test(text)) return 'dex'
  if (/robinhood|defi|借贷|质押/.test(text)) return 'defi'
  if (/巨鲸|whale|仪表盘|链上数据/.test(text)) return 'data'
  if (/cnt|content token|nft|游戏|social/.test(text)) return 'nft-gaming'
  if (/钱包|wallet|多签|授权/.test(text)) return 'wallets'
  return 'chains'
}

const CATEGORY_RESOURCE_NAMES = {
  cex: ['Binance', 'OKX', 'Coinbase', 'Kraken'],
  dex: ['Uniswap', 'Jupiter', 'Curve', 'PancakeSwap'],
  defi: ['DefiLlama', 'Token Terminal', 'Dune'],
  stablecoins: ['DefiLlama', 'CoinGecko', 'Tronscan'],
  chains: ['L2BEAT', 'Etherscan', 'Solscan', 'BscScan'],
  wallets: ['Revoke.cash', 'De.Fi Scanner', 'Chainabuse'],
  data: ['Dune', 'DefiLlama', 'CoinGecko', 'CoinMarketCap'],
  'nft-gaming': ['Dune', 'Etherscan'],
}

const ALL_RESOURCES = WEB3_RESOURCE_GROUPS.flatMap((group) => group.items)

function CategoryDirectorySection({ category, items, selected }) {
  const resources = (CATEGORY_RESOURCE_NAMES[category.id] || [])
    .map((name) => ALL_RESOURCES.find((item) => item.name === name))
    .filter(Boolean)
  return (
    <section id={category.id} className={`scroll-mt-28 border-t py-7 first:border-t-0 ${selected ? 'border-[var(--site-accent)]' : 'border-[var(--site-line)]'}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-faint)]">{category.eyebrow}</p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--site-ink)]">{category.label}</h3>
        </div>
        <p className="text-xs text-[var(--site-faint)]">{items.length} 篇相关内容</p>
      </div>
      <div className="min-w-0">
        {items.length ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {items.map((item) => (
              <ArticlePreview key={item.href} item={item} label={category.label} />
            ))}
          </div>
        ) : <p className="py-2 text-sm text-[var(--site-faint)]">暂无相关专题文章。</p>}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {resources.map((resource) => (
            <a key={resource.name} href={resource.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--site-muted)] no-underline hover:text-[var(--site-ink)] hover:underline">
              {resource.name} <IconExternalLink size={11} />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function Web3Page({ searchParams }) {
  const params = await searchParams
  const selectedCategory = String(params?.category || '')
  const [knowledgeItems, companies, topics] = await Promise.all([
    readRuntimeKnowledgeItems(),
    listResearchForDirectory('companies'),
    listResearchForDirectory('topics'),
  ])

  const aShares = companies.filter(isAShareCompanyObservation).sort(byDateDesc)
  const cryptoAssets = topics.filter(isCryptoAssetObservation).sort(byDateDesc)
  const web3Items = knowledgeItems
    .filter((item) => item.subjects?.includes('web3') && item.href !== '/crypto-research')
    .sort(byDateDesc)

  const aShareCards = aShares.slice(0, 5).map((entry) => {
    const identity = aShareIdentity(entry)
    return {
      href: `/articles/research/companies/${entry.slug}`,
      title: `${identity.company}${identity.code ? `（${identity.code}）` : ''}`,
      summary: researchPublicSummary(entry),
      date: entry.date,
      kind: 'A 股调研',
    }
  })
  const cryptoCards = cryptoAssets.slice(0, 5).map((entry) => {
    const identity = cryptoIdentity(entry)
    return {
      href: `/articles/research/topics/${entry.slug}`,
      title: `${identity.name}${identity.symbol ? `（${identity.symbol}）` : ''}`,
      summary: researchPublicSummary(entry),
      date: entry.date,
      kind: '加密资产',
    }
  })
  const editorialWeb3Cards = web3Items.filter((item) => item.series !== 'crypto_research').map((item) => ({
    href: item.href,
    title: item.title,
    summary: item.summary || '关于公链、协议、钱包或链上应用的内容。',
    date: item.date,
    kind: 'Web3',
  }))
  const featuredCards = editorialWeb3Cards.slice(0, 3)
  const web3Cards = editorialWeb3Cards.slice(3, 8)

  const categories = [...WEB3_CATEGORY_META].sort((a, b) => {
    if (a.id === selectedCategory) return -1
    if (b.id === selectedCategory) return 1
    return 0
  })
  const categoryItems = Object.fromEntries(WEB3_CATEGORY_META.map((category) => [
    category.id,
    web3Items.filter((item) => categoryIdForItem(item) === category.id),
  ]))

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <header className="relative isolate overflow-hidden rounded-[26px] border border-[var(--site-line)] px-6 py-7 sm:px-9 sm:py-9">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-80 dark:opacity-45"
          style={{ backgroundImage: "url('/images/web3-directory-banner.webp')" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ background: 'linear-gradient(90deg, var(--site-panel) 0%, color-mix(in srgb, var(--site-panel) 92%, transparent) 48%, color-mix(in srgb, var(--site-panel) 58%, transparent) 100%)' }}
        />
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--site-accent)]">A-Shares · Crypto · Onchain</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-[var(--site-ink)] sm:text-5xl">
              市场与 Web3
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--site-muted)]">
              汇集 A 股调研、加密资产观察和 Web3 内容，并整理协议分类、交易平台与常用链上查询工具。
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[var(--site-line)] border-y border-[var(--site-line)] py-3">
            {[
              [aShares.length, 'A 股'],
              [cryptoAssets.length, '加密'],
              [web3Items.length, 'Web3'],
            ].map(([count, label]) => (
              <div key={label} className="px-3 py-1 text-center">
                <strong className="block text-2xl text-[var(--site-ink)]">{count}</strong>
                <span className="mt-1 block text-xs text-[var(--site-faint)]">{label} 内容</span>
              </div>
            ))}
          </div>
        </div>
        <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="市场与 Web3 页面目录">
          {[
            ['#us-stocks', '美股走势'],
            ['#content', '内容索引'],
            ['#categories', '领域分类'],
            ['#exchanges', '交易入口'],
            ['#market-data', '数据查询'],
            ['#explorers', '区块浏览器'],
            ['#safety', '安全工具'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="border-b border-transparent py-1 text-xs text-[var(--site-muted)] no-underline hover:border-[var(--site-accent)] hover:text-[var(--site-ink)]">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-4 grid min-w-0 gap-8 lg:grid-cols-[228px_minmax(0,1fr)] xl:gap-12">
        <Web3Sidebar />
        <div className="min-w-0">
      <section id="us-stocks" className="scroll-mt-28 border-b border-[var(--site-line)] py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--site-faint)]">US stocks</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--site-ink)]">美股走势</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--site-muted)]">
              下面每一段的宽度是最新一笔仓位快照里的毛名义占比。资产档位从 A4 往 A6 记，点进去看持仓和历次快照。
            </p>
          </div>
          <Link href="/web3/us-stocks" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--site-ink)] no-underline hover:underline">
            打开走势图 <IconArrowUpRight size={15} />
          </Link>
        </div>
        <div className="mt-5">
          <UsStockBook linked />
          <UsStockReview compact />
        </div>
      </section>
      <section id="content" className="scroll-mt-28 py-10 lg:pt-6">
        <div id="featured" className="scroll-mt-28 border-b border-[var(--site-line)] pb-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--site-faint)]">Featured</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-[var(--site-ink)]">精选阅读</h2>
            </div>
            <Link href="/articles?subject=web3" className="text-xs text-[var(--site-muted)] no-underline hover:text-[var(--site-ink)] hover:underline">全部 Web3 内容</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {featuredCards.map((item, index) => (
              <ArticlePreview key={item.href} item={item} label={`精选 ${String(index + 1).padStart(2, '0')}`} featured />
            ))}
          </div>
        </div>
        <div className="mb-7 mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--site-faint)]">Markets & Web3</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--site-ink)]">市场与链上内容</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[var(--site-muted)]">汇集最新 A 股调研、加密资产观察与 Web3 文章，并按研究对象继续细分。</p>
        </div>
        <div className="border-b border-[var(--site-line)]">
          <ContentList
            id="a-share"
            title="A 股调研"
            description="公司业务、财务、治理、估值与风险观察。"
            href="/a-share-research"
            count={aShares.length}
            items={aShareCards}
          />
          <ContentList
            id="crypto"
            title="加密资产"
            description="按市值观察背景、技术、用途、治理、安全与风险。"
            href="/crypto-research"
            count={cryptoAssets.length}
            items={cryptoCards}
          />
          <ContentList
            id="web3-content"
            title="Web3 内容"
            description="公链、钱包、智能合约、链上应用与行业记录。"
            href="/articles?subject=web3"
            count={web3Items.length}
            items={web3Cards}
          />
        </div>
      </section>

      <section id="categories" className="scroll-mt-24 border-t border-[var(--site-line)] py-14">
        <div className="mb-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--site-faint)]">Landscape</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--site-ink)]">Web3 分类内容</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--site-muted)]">覆盖中心化交易、链上交易、DeFi、公链、钱包与数据查询，每类附官方入口和常用工具。</p>
        </div>
        <div>
          {categories.map((category) => (
            <CategoryDirectorySection
              key={category.id}
              category={category}
              items={categoryItems[category.id] || []}
              selected={category.id === selectedCategory}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--site-line)] pt-14">
        <div className="mb-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--site-faint)]">Resources</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--site-ink)]">交易所与常用查询</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--site-muted)]">
            访问交易所或查询服务前，请核对域名、所在地区规则、费用和资产托管方式；任何安全扫描结果都不能替代自己核验合约与签名。
          </p>
        </div>
        <div>
          {WEB3_RESOURCE_GROUPS.map((group) => <ResourceGroup key={group.id} group={group} />)}
        </div>
      </section>

      <aside className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
        加密资产和 DeFi 存在高波动、合约漏洞、脱锚、流动性、托管与合规风险。公开信息不构成开户、买卖、收益或法律建议。
      </aside>
        </div>
      </div>
    </main>
  )
}
