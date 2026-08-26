import { LoadingState, Skeleton } from '../../components/loading/LoadingPrimitives'

export default function ReadingLoading() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-12" aria-busy="true">
      <div className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5">
        <LoadingState label="正在加载阅读空间" compact />
        <div className="mt-6 space-y-3" aria-hidden="true">
          <Skeleton className="h-5 w-2/5 rounded-full" />
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-4/5 rounded-full" />
        </div>
      </div>
    </div>
  )
}
