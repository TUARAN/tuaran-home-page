import Link from 'next/link'

/**
 * 作者引流条 + 分发用 Markdown
 * - <AuthorByline />：紧凑的一行署名，与 TL;DR 共用一个 aside，节奏一致
 * - AUTHOR_INTRO_MARKDOWN：分发时拼接到正文最前面（H1 之后），保证转出去的也带作者信息
 */

export const AUTHOR_INTRO_MARKDOWN =
  '> 作者：[涂阿燃（TUARAN）｜前端与 AI 工程师、出版作者](https://2aran.com/about)'

export function AuthorByline() {
  return (
    <p className="research-author-muted mb-0 text-[12px] leading-5">
      <Link href="/about" rel="author" className="research-author-link no-underline">
        作者：涂阿燃（TUARAN）｜前端与 AI 工程师、出版作者
      </Link>
    </p>
  )
}

export default AuthorByline
