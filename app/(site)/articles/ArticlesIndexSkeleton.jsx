const SKELETON_ROWS = Array.from({ length: 24 }, (_, index) => index)

function FilterSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((section) => (
        <div key={section} className="rounded-xl border border-[#e5e0d8] p-3 dark:border-gray-800">
          <div className="flex items-start gap-2">
            <span className="h-6 w-6 rounded-md bg-[#e4e0d9] dark:bg-gray-800" />
            <div className="flex-1 space-y-2">
              <span className="block h-3 w-16 rounded bg-[#dfdbd4] dark:bg-gray-800" />
              <span className="block h-2.5 w-28 rounded bg-[#ebe7e1] dark:bg-gray-900" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from({ length: section === 0 ? 8 : 5 }, (_, index) => (
              <span key={index} className="h-7 w-16 rounded-full border border-[#e4e0d9] dark:border-gray-800" />
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
            <span className="h-2 w-2 rounded-full bg-[#ded9d2] dark:bg-gray-800" />
            <span className="h-3 w-24 rounded bg-[#e4e0da] dark:bg-gray-800" />
            <span className="h-6 w-20 rounded-md border border-[#e2ded7] dark:border-gray-800" />
            <span className="h-6 w-12 rounded-full border border-[#e2ded7] dark:border-gray-800" />
          </div>
          <span className={`ml-5 mt-3 block h-5 rounded bg-[#dcd8d1] dark:bg-gray-800 ${index % 3 === 0 ? 'w-3/5' : 'w-4/5'}`} />
          <div className="ml-5 mt-3 space-y-2">
            <span className="block h-3 w-full rounded bg-[#ebe7e1] dark:bg-gray-900" />
            <span className="block h-3 w-2/3 rounded bg-[#ebe7e1] dark:bg-gray-900" />
          </div>
          <span className="ml-5 mt-3 block h-3 w-24 rounded bg-[#e4e0da] dark:bg-gray-800" />
        </div>
        {index % 3 !== 0 ? (
          <span className="hidden h-24 rounded-md border border-[#e2ded7] bg-[#ebe7e1] dark:border-gray-800 dark:bg-gray-900 sm:block" />
        ) : null}
      </div>
    </div>
  )
}

export default function ArticlesIndexSkeleton() {
  return (
    <div className="articles-index-stone space-y-5" aria-busy="true" aria-label="正在加载内容目录">
      <span className="sr-only">正在加载内容目录</span>
      <div className="animate-pulse">
        <section className="-mx-1 space-y-2.5 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel-strong)]/95 p-3">
          <div className="flex gap-2">
            <span className="h-11 min-w-0 flex-1 rounded-lg border border-[#ddd8d0] bg-white/55 dark:border-gray-800 dark:bg-gray-900" />
            <span className="h-11 w-16 rounded-lg border border-[#ddd8d0] dark:border-gray-800" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} className="h-6 w-16 rounded-full bg-[#ebe7e1] dark:bg-gray-900" />
            ))}
          </div>
        </section>

        <div className="mt-5 lg:grid lg:grid-cols-[236px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <aside className="hidden rounded-lg border border-[#e8e2e8] bg-white/60 p-3 lg:block dark:border-gray-800 dark:bg-[#121821]">
            <span className="mb-3 block h-4 w-20 rounded bg-[#dedad3] dark:bg-gray-800" />
            <FilterSkeleton />
          </aside>

          <div className="min-w-0">
            <section className="mb-4 rounded-lg border border-[#e8e2e8] bg-white/60 p-3 lg:hidden dark:border-gray-800 dark:bg-[#121821]">
              <span className="mb-3 block h-4 w-20 rounded bg-[#dedad3] dark:bg-gray-800" />
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
