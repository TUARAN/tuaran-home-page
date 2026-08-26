import Image from 'next/image'
import Link from 'next/link'

import { AVATAR_PATH } from '../../../lib/avatar'

/**
 * 作者引流条 + 分发用 Markdown
 * - <AuthorByline />：紧凑的一行署名，与 TL;DR 共用一个 aside，节奏一致
 * - AUTHOR_INTRO_MARKDOWN：分发时拼接到正文最前面（H1 之后），保证转出去的也带作者信息
 */

export const AUTHOR_INTRO_MARKDOWN =
  '> **涂阿燃**  \n> 前端与智能体工程师 · 技术作者 · [个人介绍 →](https://2aran.com/about)'

export function AuthorByline() {
  return (
    <div className="research-author-byline flex items-center gap-3">
      <Link
        href="/about"
        rel="author"
        aria-label="了解作者涂阿燃"
        className="research-author-avatar shrink-0 rounded-full no-underline"
      >
        <Image
          src={AVATAR_PATH}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href="/about"
          rel="author"
          className="research-author-name inline-flex items-baseline gap-1.5 no-underline"
        >
          <span className="text-[13px] font-semibold">涂阿燃</span>
        </Link>
        <p className="research-author-muted mb-0 mt-0.5 text-[11px] leading-4">
          前端与智能体工程师 · 技术作者
        </p>
      </div>

      <Link
        href="/about"
        className="research-author-profile-link inline-flex shrink-0 items-center gap-1 text-[11px] font-medium no-underline"
      >
        个人介绍
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}

export default AuthorByline
