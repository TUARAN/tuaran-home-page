import Link from 'next/link'

/**
 * 文章底部统一 CTA：留住流量、引导下一步
 * 设计原则：克制 + 信息密度高 + 不卖货式
 */
export default function ArticleFooterCta() {
  return (
    <aside className="mx-auto mt-12 max-w-[72ch] border-t border-[#dee0db] pt-8 dark:border-gray-800">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
          Stay in touch
        </p>
        <p className="text-[11px] text-[#999] dark:text-gray-500">写完一篇 · 走到下一段</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a
          href="/rss.xml"
          className="group flex items-baseline gap-3 rounded-xl border border-[#dee0db] bg-white p-4 no-underline transition hover:-translate-y-0.5 hover:border-[#c2c4b7] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600"
        >
          <span className="text-[18px]" aria-hidden="true">📡</span>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">RSS 订阅 →</div>
            <p className="mt-0.5 text-[12px] leading-5 text-[#666] dark:text-gray-400">
              2aran.com/rss.xml · 用你的阅读器订阅，不错过任何一篇
            </p>
          </div>
        </a>

        <Link
          href="/community"
          className="group flex items-baseline gap-3 rounded-xl border border-[#dee0db] bg-white p-4 no-underline transition hover:-translate-y-0.5 hover:border-[#c2c4b7] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600"
        >
          <span className="text-[18px]" aria-hidden="true">💬</span>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">加入社群 →</div>
            <p className="mt-0.5 text-[12px] leading-5 text-[#666] dark:text-gray-400">
              微信小红书读者群，不焦虑，慢节奏
            </p>
          </div>
        </Link>

        <Link
          href="/articles"
          className="group flex items-baseline gap-3 rounded-xl border border-[#dee0db] bg-white p-4 no-underline transition hover:-translate-y-0.5 hover:border-[#c2c4b7] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600"
        >
          <span className="text-[18px]" aria-hidden="true">📚</span>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">知识库 →</div>
            <p className="mt-0.5 text-[12px] leading-5 text-[#666] dark:text-gray-400">
              精选文章 + 公司调研 + 事项调研 + 人物调研
            </p>
          </div>
        </Link>

        <Link
          href="/about"
          className="group flex items-baseline gap-3 rounded-xl border border-[#dee0db] bg-white p-4 no-underline transition hover:-translate-y-0.5 hover:border-[#c2c4b7] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600"
        >
          <span className="text-[18px]" aria-hidden="true">👋</span>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">关于我 →</div>
            <p className="mt-0.5 text-[12px] leading-5 text-[#666] dark:text-gray-400">
              前端 · AI Agent · 政企方案 · 创业 · 奶爸
            </p>
          </div>
        </Link>
      </div>

      <p className="mt-6 text-center text-[12px] text-[#999] dark:text-gray-500">
        合作 / 咨询 / 调研定制见 <Link href="/services" className="text-[#646655] no-underline hover:text-[#15140f] dark:text-[#acaf9d] dark:hover:text-gray-100">合作说明</Link> · 微信 <span className="font-mono">atar24</span>
      </p>
    </aside>
  )
}
