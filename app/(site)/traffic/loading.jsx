import { Skeleton } from '../../components/loading/LoadingPrimitives'

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-12" aria-busy="true" aria-label="正在加载访问地图">
      <span className="sr-only">正在加载访问地图</span>
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="mt-3 h-4 w-56 rounded-full" />
          </div>
        </div>
      </header>

      <section>
        <Skeleton className="h-[80vh] min-h-[640px] w-full rounded-xl border border-[var(--site-line)]" />
      </section>
    </div>
  )
}
