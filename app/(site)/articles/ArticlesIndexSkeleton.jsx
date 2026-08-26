import { Skeleton } from '../../components/loading/LoadingPrimitives'

const SKELETON_ROWS = Array.from({ length: 24 }, (_, index) => index)

function FilterSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((section) => (
        <div key={section} className="rounded-xl border border-[#e5e0d8] p-3 dark:border-gray-800">
          <div className="flex items-start gap-2">
            <Skeleton className="h-6 w-6 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-2.5 w-28 rounded" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from({ length: section === 0 ? 8 : 5 }, (_, index) => (
              <Skeleton key={index} className="h-7 w-16 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RowSkeleton({ index }) {
  return (
    <div className="border-b border-[#e8e2e8] px-4 py-4 last:border-b-0 dark:border-gray-800 sm:px-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_136px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className={`ml-5 mt-3 h-5 rounded ${index % 3 === 0 ? 'w-3/5' : 'w-4/5'}`} />
          <div className="ml-5 mt-3 space-y-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
          <Skeleton className="ml-5 mt-3 h-3 w-24 rounded" />
        </div>
        {index % 3 !== 0 ? (
          <Skeleton className="hidden h-24 rounded-md sm:block" />
        ) : null}
      </div>
    </div>
  )
}

export default function ArticlesIndexSkeleton() {
  return (
    <div className="articles-index-stone space-y-5" aria-busy="true" aria-label="正在加载内容目录">
      <span className="sr-only">正在加载内容目录</span>
      <div>
        <section className="-mx-1 space-y-2.5 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel-strong)]/95 p-3">
          <div className="flex gap-2">
            <Skeleton className="h-11 min-w-0 flex-1 rounded-lg" />
            <Skeleton className="h-11 w-16 rounded-lg" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </section>

        <div className="mt-5 lg:grid lg:grid-cols-[236px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <aside className="hidden rounded-lg border border-[#e8e2e8] bg-white/60 p-3 lg:block dark:border-gray-800 dark:bg-[#121821]">
            <Skeleton className="mb-3 h-4 w-20 rounded" />
            <FilterSkeleton />
          </aside>

          <div className="min-w-0">
            <section className="mb-4 rounded-lg border border-[#e8e2e8] bg-white/60 p-3 lg:hidden dark:border-gray-800 dark:bg-[#121821]">
              <Skeleton className="mb-3 h-4 w-20 rounded" />
              <FilterSkeleton />
            </section>
            <section className="overflow-hidden border-y border-[#d9d2df] bg-white/45 dark:border-gray-800 dark:bg-[#101721]/65">
              {SKELETON_ROWS.map((index) => <RowSkeleton key={index} index={index} />)}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
