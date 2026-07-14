import Link from 'next/link'

/**
 * 作者引流条 + 分发用 Markdown
 * - <AuthorByline />：紧凑的一行署名，与 TL;DR 共用一个 aside，节奏一致
 * - AUTHOR_INTRO_MARKDOWN：分发时拼接到正文最前面（H1 之后），保证转出去的也带作者信息
 */

export const AUTHOR_INTRO_MARKDOWN =
  '> [涂阿燃的网络日志：FDE・KOL・OPC｜记录 AI 实践、社会洞察、生活随笔](https://2aran.com/about)'

export function AuthorByline() {
  return (
    <p className="research-author-muted text-[12px] leading-5">
      <Link href="/about" className="research-author-link no-underline">
        涂阿燃的网络日志：FDE・KOL・OPC｜记录 AI 实践、社会洞察、生活随笔
      </Link>
    </p>
  )
}

export default AuthorByline
