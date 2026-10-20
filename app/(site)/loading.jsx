'use client'

import { usePathname } from 'next/navigation'
import { Skeleton } from '../components/loading/LoadingPrimitives'

function ReadingRows({ count = 6 }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="border-b border-[var(--site-line)] py-4 last:border-0" aria-hidden="true">
      <div className="mb-2 flex gap-2">
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <Skeleton className={`h-5 rounded-md ${index % 2 ? 'w-[76%]' : 'w-[92%]'}`} />
      <Skeleton className="mt-2 h-3.5 w-full rounded-md" />
      <Skeleton className="mt-1.5 h-3.5 w-[65%] rounded-md" />
    </div>
  ))
}

function HomeLoading() {
  return (
    <main className="home-page" role="status" aria-busy="true" aria-label="正在加载首页">
      <span className="sr-only">正在加载首页内容</span>
      <div className="home-main-grid">
        <section className="home-section min-w-0" aria-hidden="true">
          <Skeleton className="mb-3 h-3 w-28 rounded-full" />
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="mt-3 h-4 w-[70%] rounded-md" />
          <div className="mt-6 flex gap-3 border-b border-[var(--site-line)] pb-3">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <ReadingRows />
        </section>
        <div className="home-main-column min-w-0">
          <section className="home-section min-w-0" aria-hidden="true">
            <Skeleton className="mb-3 h-3 w-28 rounded-full" />
            <Skeleton className="h-8 w-44 rounded-md" />
            <div className="mt-5"><ReadingRows count={3} /></div>
          </section>
          <section className="home-section min-w-0" aria-hidden="true">
            <Skeleton className="mb-3 h-3 w-20 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-md" />
            <div className="mt-4"><ReadingRows count={2} /></div>
          </section>
        </div>
        <aside className="home-side-stack hidden lg:block" aria-hidden="true">
          <section className="home-section">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="mt-5 h-5 w-3/4 rounded-md" />
            <Skeleton className="mt-3 h-3.5 w-full rounded-md" />
            <Skeleton className="mt-2 h-3.5 w-4/5 rounded-md" />
          </section>
          <section className="home-section">
            <Skeleton className="h-5 w-2/3 rounded-md" />
            <Skeleton className="mt-4 h-12 w-full rounded-lg" />
            <Skeleton className="mt-3 h-12 w-full rounded-lg" />
          </section>
        </aside>
      </div>
    </main>
  )
}

function GenericLoading() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-12" role="status" aria-busy="true" aria-label="正在加载页面">
      <span className="sr-only">正在加载页面</span>
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-4">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="mt-3 h-4 w-[min(28rem,70%)] rounded-full" />
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="rounded-xl border border-[var(--site-line)] p-4" aria-hidden="true">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="mt-4 h-5 w-4/5 rounded-md" />
            <Skeleton className="mt-2 h-3.5 w-full rounded-md" />
            <Skeleton className="mt-1.5 h-3.5 w-2/3 rounded-md" />
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-[92%] rounded-full" />
        <Skeleton className="h-4 w-[84%] rounded-full" />
      </div>
    </div>
  )
}

export default function Loading() {
  return usePathname() === '/' ? <HomeLoading /> : <GenericLoading />
}
