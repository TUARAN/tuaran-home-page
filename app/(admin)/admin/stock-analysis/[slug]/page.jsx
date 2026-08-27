import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminPageGate from '../../../components/AdminPageGate'
import StockAnalysisClientLoader from '../StockAnalysisClientLoader'
import {
  getSiblingSlugs,
  getSnapshotBySlug,
} from '../data'

export const runtime = 'edge'
export const metadata = {
  title: '交易分析快照',
  description: '仅站长可访问的交易分析快照。',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default function SnapshotDetailPage({ params }) {
  const R = getSnapshotBySlug(params.slug)
  if (!R) notFound()

  const { prev, next } = getSiblingSlugs(R.slug)

  return (
    <AdminPageGate
      label="交易分析"
      returnTo={`/admin/stock-analysis/${R.slug}`}
      description="交易快照、横向分析与风险信号仅站长本人可见。"
    >
      {/* Top navigation: 返回索引 + 上一条 / 下一条 */}
      <nav className="mx-auto w-full max-w-[1120px] px-4 pt-6">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d7d9cf] dark:border-[#2b3644] bg-white dark:bg-[#111923] px-4 py-3">
          <Link
            href="/admin/stock-analysis"
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--site-muted)] hover:text-[#00e5a0] transition-colors"
          >
            <span aria-hidden>←</span>
            <span>返回快照库</span>
          </Link>

          <div className="flex items-center gap-2 text-[12px]">
            {prev ? (
              <Link
                href={`/admin/stock-analysis/${prev}`}
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
                href={`/admin/stock-analysis/${next}`}
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

      <StockAnalysisClientLoader record={R} />
    </AdminPageGate>
  )
}
