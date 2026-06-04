import Link from 'next/link'
import Image from 'next/image'

/**
 * 文章顶部统一作者介绍 / 引流卡
 * 放在 header 之后、正文之前，每篇详情页都展示
 * 设计原则：克制、信息密度高、不打断阅读节奏
 */
export default function ArticleAuthorIntro() {
  return (
    <aside className="mx-auto mb-8 max-w-[72ch] rounded-xl border border-[#e8dfd0] bg-white/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/60">
      <div className="flex items-start gap-3">
        <Image
          src="/tuaranme.png"
          alt="涂阿燃"
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-full border border-[#e8dfd0] bg-white object-cover dark:border-gray-800 dark:bg-gray-900"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[14px] font-semibold text-[#221f19] dark:text-gray-100">涂阿燃 · tuaran</span>
            <span className="text-[11px] text-[#999] dark:text-gray-500">
              前端 · AI Agent · 政企方案 · 创业 · 奶爸
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-5 text-[#666] dark:text-gray-400">
            在
            {' '}
            <Link href="/" className="text-[#444] underline underline-offset-2 hover:text-[#111] dark:text-gray-200 dark:hover:text-white">
              2aran.com
            </Link>
            {' '}
            写技术调研、公司观察、独立开发与中年技术人的真实记录。
            {' '}
            <Link href="/about" className="text-[#8a5a14] underline underline-offset-2 hover:text-[#5d3b08] dark:text-[#e2bd75] dark:hover:text-[#f3d99a]">
              了解我 →
            </Link>
          </p>
        </div>
      </div>
    </aside>
  )
}
