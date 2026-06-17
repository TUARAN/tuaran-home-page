import Link from 'next/link'
import { notFound } from 'next/navigation'
import StockAnalysisClient from '../StockAnalysisClient'
import {
  getAllSlugs,
  getSiblingSlugs,
  getSnapshotBySlug,
} from '../data'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }) {
  const R = getSnapshotBySlug(params.slug)
  if (!R) return { title: '未找到快照' }

  const sign = R.price.changePct >= 0 ? '+' : ''
  return {
    title: `${R.pair} ${R.contractType} · ${R.date} ${R.time} 多维度分析`,
    description: `${R.pair}（${R.exchange} ${R.contractType} ${R.timeframe}）${R.date} ${R.time} 多维度分析：当前价 ${R.price.current}，24H ${sign}${R.price.changePct}%，资金费率 ${R.funding.rateDisplay}（年化 ${R.funding.annualizedPct}%），综合风险指数 ${R.gaugeValue}（${R.analysisSummary.riskLevel}）。${R.analysisSummary.keyConcern}。`,
    keywords: [
      R.pair,
      R.contractType,
      R.exchange,
      '资金费率',
      '量价背离',
      '均线乖离',
      '风险信号',
      '交易分析',
      '分钟级',
    ],
    alternates: {
      canonical: `/stock-analysis/${R.slug}`,
    },
  }
}

export default function SnapshotDetailPage({ params }) {
  const R = getSnapshotBySlug(params.slug)
  if (!R) notFound()

  const { prev, next } = getSiblingSlugs(R.slug)

  return (
    <>
      {/* Top navigation: 返回索引 + 上一条 / 下一条 */}
      <nav className="mx-auto w-full max-w-[1120px] px-4 pt-6">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d7d9cf] dark:border-[#2b3644] bg-white dark:bg-[#111923] px-4 py-3">
          <Link
            href="/stock-analysis"
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--site-muted)] hover:text-[#00e5a0] transition-colors"
          >
            <span aria-hidden>←</span>
            <span>返回快照库</span>
          </Link>

          <div className="flex items-center gap-2 text-[12px]">
            {prev ? (
              <Link
                href={`/stock-analysis/${prev}`}
                className="inline-flex items-center gap-1 rounded border border-[#d7d9cf] dark:border-[#2b3644] px-3 py-1.5 text-[var(--site-muted)] hover:border-[#00e5a0] hover:text-[#00e5a0] transition-colors"
              >
                <span aria-hidden>←</span>
                <span>上一条</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-dashed border-[#d7d9cf] dark:border-[#2b3644] px-3 py-1.5 text-[var(--site-muted)] opacity-50 cursor-not-allowed">
                <span aria-hidden>←</span>
                <span>上一条</span>
              </span>
            )}
            {next ? (
              <Link
                href={`/stock-analysis/${next}`}
                className="inline-flex items-center gap-1 rounded border border-[#d7d9cf] dark:border-[#2b3644] px-3 py-1.5 text-[var(--site-muted)] hover:border-[#00e5a0] hover:text-[#00e5a0] transition-colors"
              >
                <span>下一条</span>
                <span aria-hidden>→</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-dashed border-[#d7d9cf] dark:border-[#2b3644] px-3 py-1.5 text-[var(--site-muted)] opacity-50 cursor-not-allowed">
                <span>下一条</span>
                <span aria-hidden>→</span>
              </span>
            )}
          </div>
        </div>
      </nav>

      <StockAnalysisClient record={R} />
    </>
  )
}
