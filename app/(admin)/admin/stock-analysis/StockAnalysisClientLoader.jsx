'use client'

import dynamic from 'next/dynamic'
import { LoadingState } from '../../../components/loading/LoadingPrimitives'

const StockAnalysisClient = dynamic(() => import('./StockAnalysisClient'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-10">
      <LoadingState label="正在加载交易分析图表" detail="图表模块准备完成后会自动显示。" />
    </div>
  ),
})

export default function StockAnalysisClientLoader({ record }) {
  return <StockAnalysisClient record={record} />
}
