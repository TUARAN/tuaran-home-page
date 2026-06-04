import Link from 'next/link'

/**
 * 作者引流条 + 分发用 Markdown
 * - <AuthorByline />：紧凑署名式两行，与 TL;DR 共用一个 aside，节奏一致
 * - AUTHOR_INTRO_MARKDOWN：分发时拼接到正文最前面（H1 之后），保证转出去的也带作者信息
 */

export const AUTHOR_INTRO_MARKDOWN =
  '> **涂阿燃 · tuaran**　前端 / AI Agent / 政企方案 / 独立开发者  \n' +
  '> 在 [2aran.com](https://2aran.com) 写技术调研、AI 工程实践与独立开发笔记。[了解更多 →](https://2aran.com/about)'

export function AuthorByline() {
  return (
    <div className="leading-6">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[13px] font-semibold text-[#221f19] dark:text-gray-100">涂阿燃 · tuaran</span>
        <span className="text-[11px] text-[#8a7e62] dark:text-[#b9a987]">
          前端 / AI Agent / 政企方案 / 独立开发者
        </span>
      </div>
      <p className="mt-0.5 text-[12px] leading-5 text-[#6d614c] dark:text-[#bbae93]">
        在
        {' '}
        <Link href="/" className="text-[#5d503f] underline underline-offset-2 hover:text-[#221f19] dark:text-gray-200 dark:hover:text-white">
          2aran.com
        </Link>
        {' '}
        写技术调研、AI 工程实践与独立开发笔记。
        {' '}
        <Link href="/about" className="text-[#8a5a14] underline underline-offset-2 hover:text-[#5d3b08] dark:text-[#e2bd75] dark:hover:text-[#f3d99a]">
          了解更多 →
        </Link>
      </p>
    </div>
  )
}

export default AuthorByline
