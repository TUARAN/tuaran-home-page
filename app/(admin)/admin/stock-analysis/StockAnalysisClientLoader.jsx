'use client'

import dynamic from 'next/dynamic'

const StockAnalysisClient = dynamic(() => import('./StockAnalysisClient'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-10 text-sm text-[var(--site-muted)]">
      正在加载交易分析图表…
    </div>
  ),
})

export default function StockAnalysisClientLoader({ record }) {
  return <StockAnalysisClient record={record} />
}
