import Link from 'next/link'

/**
 * 作者引流条 + 分发用 Markdown
 * - <AuthorByline />：紧凑的一行署名，与 TL;DR 共用一个 aside，节奏一致
 * - AUTHOR_INTRO_MARKDOWN：分发时拼接到正文最前面（H1 之后），保证转出去的也带作者信息
 */

export const AUTHOR_INTRO_MARKDOWN =
  '> 作者：[涂阿燃（TUARAN）](https://2aran.com/about)｜[FDE](https://2aran.com/about#fde) / [KOL](https://2aran.com/about#kol) / [OPC](https://2aran.com/about#opc)'

export function AuthorByline() {
  return (
    <p className="research-author-muted mb-0 text-[12px] leading-5">
      <Link href="/about" rel="author" className="research-author-link no-underline">
        作者：涂阿燃（TUARAN）
      </Link>
      <span aria-hidden="true">｜</span>
      <Link href="/about#fde" className="research-author-link no-underline">
        FDE
      </Link>
      <span aria-hidden="true"> / </span>
      <Link href="/about#kol" className="research-author-link no-underline">
        KOL
      </Link>
      <span aria-hidden="true"> / </span>
      <Link href="/about#opc" className="research-author-link no-underline">
        OPC
      </Link>
    </p>
  )
}

export default AuthorByline
