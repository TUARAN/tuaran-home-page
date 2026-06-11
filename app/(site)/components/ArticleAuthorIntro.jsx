import Link from 'next/link'

/**
 * 作者引流条 + 分发用 Markdown
 * - <AuthorByline />：紧凑署名式两行，与 TL;DR 共用一个 aside，节奏一致
 * - AUTHOR_INTRO_MARKDOWN：分发时拼接到正文最前面（H1 之后），保证转出去的也带作者信息
 */

export const AUTHOR_INTRO_MARKDOWN =
  '> **涂阿燃 · tuaran**　前端 / AI Agent / 政企方案  \n' +
  '> 在 [2aran.com](https://2aran.com) 写技术调研、AI 工程实践与独立开发笔记。[了解更多 →](https://2aran.com/about)'

export function AuthorByline() {
  return (
    <div className="leading-6">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[13px] font-semibold text-[#15140f] dark:text-gray-100">涂阿燃 · tuaran</span>
        <span className="text-[11px] text-[#707462] dark:text-[#989d87]">
          前端 / AI Agent / 政企方案
        </span>
      </div>
      <p className="mt-0.5 text-[12px] leading-5 text-[#585a4c] dark:text-[#a1a593]">
        在
        {' '}
        <Link href="/" className="text-[#333431] underline underline-offset-2 hover:text-[#15140f] dark:text-gray-200 dark:hover:text-white">
          2aran.com
        </Link>
        {' '}
        写技术调研、AI 工程实践与独立开发笔记。
        {' '}
        <Link href="/about" className="text-[#8a5a14] underline underline-offset-2 hover:text-[#5d3b08] dark:text-[#9ba475] dark:hover:text-[#b9c39a]">
          了解更多 →
        </Link>
      </p>
    </div>
  )
}

export default AuthorByline
