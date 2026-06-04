import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'
import { ENGINEERING_WORKS } from '../../../lib/engineeringWorks'

export const dynamic = 'force-static'

export const metadata = {
  title: '工程作品',
  description:
    '涂阿燃自研的可视化、富数据调研与长期写作工程。每一件都带交互、带数据、带工程量 —— 不是单纯 Markdown 文章，而是不可被 AI 复制的原创判断与实现。',
  alternates: {
    canonical: '/works',
  },
}

function formatDate(iso) {
  if (!iso) return ''
  return iso.replace(/-/g, ' / ')
}

export default function WorksPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-4 border-b border-[#e8dfd0] pb-6 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
            Engineering Works · 5% Original Layer
          </p>
          <h1 className="mt-2 font-serif text-[28px] font-semibold leading-tight text-[#221f19] dark:text-gray-100 sm:text-[32px]">
            工程作品
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-[#5d554a] dark:text-gray-400">
            带交互、带数据、带工程量的页面。这些不是单纯 Markdown 文章 ——
            是一份份从数据、视觉、交互到结论都自己构建的富页面，每一件都需要工程实现 +
            原创判断，单靠 AI 生成不出来。
          </p>
        </div>
        <SharePageButton
          title="涂阿燃 · 工程作品"
          text="自研可视化、富数据调研与长期写作工程"
          url="https://2aran.com/works"
          size="md"
        />
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:gap-4">
        {ENGINEERING_WORKS.map((work, i) => (
          <article
            key={work.id}
            className="group relative flex flex-col rounded-2xl border border-[#e8dfd0] bg-white/80 p-5 transition hover:border-[#cbb796] hover:shadow-[0_6px_24px_rgba(63,53,39,0.08)] dark:border-gray-800 dark:bg-gray-900/70 dark:hover:border-gray-600"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
                {String(i + 1).padStart(2, '0')} · {work.kind || '原创工程'}
              </p>
              {work.badge ? (
                <span className="rounded-full bg-[#fde6c6] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8b5a1f] dark:bg-[#3a2c14] dark:text-[#f0c776]">
                  {work.badge}
                </span>
              ) : null}
            </div>

            <h2 className="mt-2 font-serif text-[20px] font-semibold leading-tight text-[#221f19] dark:text-gray-100">
              <Link href={work.href} className="no-underline transition hover:text-[#8b5a1f] dark:hover:text-[#f0c776]">
                {work.title}
              </Link>
            </h2>

            <p className="mt-3 flex-1 text-[13px] leading-6 text-[#5d554a] dark:text-gray-400">
              {work.summary}
            </p>

            <div className="mt-4 flex items-center justify-between text-[11px] text-[#8f8069] dark:text-gray-500">
              <span className="font-mono tabular-nums">{formatDate(work.date)}</span>
              <Link
                href={work.href}
                className="inline-flex items-center gap-1 font-medium text-[#8b5a1f] no-underline transition hover:gap-2 dark:text-[#f0c776]"
              >
                进入 →
              </Link>
            </div>
          </article>
        ))}
      </section>

      <footer className="mt-12 border-t border-[#e8dfd0] pt-6 text-[12px] leading-6 text-[#7a6f5d] dark:border-gray-800 dark:text-gray-500">
        <p>
          这一层占整体内容的约 5%，但是站点真正的核心 —— 工程量 + 原创判断 + 数据可视化 + 交互体验组合在一起，是<strong className="text-[#5d503f] dark:text-gray-300"> 不可被 AI 复制 </strong>的部分。
        </p>
        <p className="mt-3 text-[11px] text-[#8f8069] dark:text-gray-600">
          如果你只想看 Markdown 形式的文章和调研，请到{' '}
          <Link href="/articles" className="underline underline-offset-2">/articles</Link>。
        </p>
      </footer>
    </main>
  )
}
